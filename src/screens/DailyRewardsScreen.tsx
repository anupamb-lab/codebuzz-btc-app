import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { RootStackParamList } from "../components/types";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/Ionicons';

interface Reward {
  id: number;
  title: string;
  amount: string;
  claimed: boolean;
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'DailyRewardsScreen'>;

const DailyRewardsScreen = () => {
  const [rewards, setRewards] = useState<Reward[]>([
    { id: 1, title: "Daily Login Bonus", amount: "+10 Coins", claimed: false },
    { id: 2, title: "Hashrate Booster", amount: "+0.000002 BTC", claimed: false },
    { id: 3, title: "Loyalty Reward", amount: "+5 Coins", claimed: false },
  ]);

  const handleClaim = (id: number) => {
    setRewards((prev) =>
      prev.map((reward) =>
        reward.id === id ? { ...reward, claimed: true } : reward
      )
    );
  };

  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
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
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardAmount}>{reward.amount}</Text>
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
                  onPress={() => handleClaim(reward.id)}
                >
                  <Text style={styles.claimText}>Claim</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        ))}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
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
});
