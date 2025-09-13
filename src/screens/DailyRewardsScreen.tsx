import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { RootStackParamList } from "../components/types";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import { get_data_uri } from '../config/api';
import { useAuth } from '../auth/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHashPower } from "../stores/HashPowerStore";

type NavigationProp = StackNavigationProp<
  RootStackParamList,
  "DailyRewardsScreen"
>;

interface Reward {
  _id: string;
  rewardType: string;
  amount: number;
  isRecurring: boolean;
  day?: number | null;
  claimed: boolean;
}

const API_BASE = get_data_uri("GET_REWARDS");

const DailyRewardsScreen = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [claimedReward, setClaimedReward] = useState<Reward | null>(null);

  const navigation = useNavigation<NavigationProp>();

  const { hashPower, setHashPower, addHashPower } = useHashPower();

  const { user } = useAuth();

  const user_id = user?.id;

  // Fetch rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch(`${API_BASE}?userId=${user_id}`);
        const data = await res.json();
        if (data.success) {
          setRewards(data.rewards);
        }
      } catch (err) {
        console.error("Error fetching rewards", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const handleClaim = async (rewardId: string, reward_amount: any) => {
    try {
      const res = await fetch(`${API_BASE}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user_id, rewardId }),
      });

      const data = await res.json();

      addHashPower(parseInt(reward_amount));

      if (data.success) {
        // Update UI
        setRewards((prev) =>
          prev.map((r) =>
            r._id === rewardId ? { ...r, claimed: true } : r
          )
        );

        setClaimedReward(data.reward);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2500);
      } else {
        alert(data.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error("Error claiming reward", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="white" size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Daily Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      <StatusBar barStyle="light-content" backgroundColor="#15213B" />

      <ScrollView contentContainerStyle={styles.scrollView}>
        {rewards.map((reward) => (
          <View key={reward._id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>
                {reward.rewardType}
              </Text>
              <Text style={styles.rewardAmount}>
                + {reward.amount} GH/s
              </Text>
            </View>

            {reward.claimed ? (
              <View style={[styles.claimButton, styles.claimedButton]}>
                <Text style={styles.claimedText}>Claimed</Text>
              </View>
            ) : (
              <LinearGradient
                colors={["#4F46E5", "#9333EA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimButton}
              >
                <TouchableOpacity
                  style={styles.claimTouchable}
                  onPress={() => handleClaim(reward._id, reward.amount)}
                >
                  <Text style={styles.claimText}>Claim</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Claim Popup with Lottie */}
      <Modal transparent visible={showPopup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <LottieView
              source={{
                uri: "https://lottie.host/6c2ebe48-6e55-4edb-9c0b-6fd48360beae/AyZ7cmF141.json",
              }}
              autoPlay
              loop={false}
              style={{ width: 250, height: 250 }}
            />
            <Text style={styles.modalText}>
              {claimedReward
                ? `${claimedReward.rewardType} Claimed!`
                : "Reward Claimed!"}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DailyRewardsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15213B",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  topTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    padding: 16,
    paddingTop: 60,
  },
  rewardCard: {
    backgroundColor: "rgba(240, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  rewardAmount: {
    color: "#34D399",
    fontSize: 14,
  },
  claimButton: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 100,
  },
  claimTouchable: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  claimText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  claimedButton: {
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  claimedText: {
    color: "#9CA3AF",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  modalText: {
    marginTop: 12,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
