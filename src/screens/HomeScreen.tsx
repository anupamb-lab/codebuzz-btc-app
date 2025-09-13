import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../auth/AuthProvider";
import { Sidebar } from "../components/Sidebar";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../components/types";

import { HOMEBANNER_AD_UNIT_ID, showRewardedAd } from "../services/googleAds";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get_data_uri } from "../config/api";
import LottieView from "lottie-react-native";
import miningCardAnimation from "../assets/animations/mining-card.json";
import { useHashPower } from "../stores/HashPowerStore";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Page">;

const MAX_ADS = 10;
const BASE_HASHPOWER_PER_AD = 5;
const BTC_PER_HASHPOWER_PER_SEC = 0.000000000001;
const MAX_MINING_DURATION = 24 * 60 * 60 * 1000;

interface GradientButtonProps {
  icon?: string;
  text: string;
  fullWidth?: boolean;
  onPress?: () => void;
  disabled?: boolean; 
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

interface InfoCardProps {
  icon: string;
  value: string;
  label: string;
  onPress?: () => void;
}

interface ActionCardProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

const Page: React.FC = () => {

  interface Activity {
    type: string;
    amount: number;
    crypto: string;
  }

  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { hashPower, setHashPower, addHashPower } = useHashPower();

  const [btcBalance, setBtcBalance] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [user_referrals, setUserReferrals] = useState(0);
  const [recent_activity_list, setRecentActivityList] = useState<Activity[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceRef = useRef(btcBalance);
  const miningAnimationRef = useRef<LottieView>(null);

  // -----------------------------
  // Reward Handler (Ad Watched)
  // -----------------------------
  const handleReward = async () => {
    if (adsWatched >= MAX_ADS) return;

    const newAdsCount = adsWatched + 1;
    setAdsWatched(newAdsCount);

    // update hashPower via global store
    addHashPower(BASE_HASHPOWER_PER_AD);

    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      await AsyncStorage.setItem("startTime", now.toString());
    }

    await AsyncStorage.setItem("adsWatched", newAdsCount.toString());
  };

  const { show, loading } = showRewardedAd(handleReward);

  // -----------------------------
  // Load State from AsyncStorage
  // -----------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user?.id) return;

        const storedAds = await AsyncStorage.getItem("adsWatched");
        const storedStart = await AsyncStorage.getItem("startTime");
        const storedBtc = await AsyncStorage.getItem("btcBalance");

        setAdsWatched(storedAds ? parseInt(storedAds) : 0);

        if (storedStart) {
          const start = parseInt(storedStart);
          const now = Date.now();
          if (now - start < MAX_MINING_DURATION) {
            setStartTime(start);
          }
        }

        if (storedBtc) {
          setBtcBalance(parseFloat(storedBtc));
        }

        await fetchBalance();
      } catch (e) {
        console.error("Error loading mining state", e);
      }
    };

    loadData();
  }, [user]);

  // -----------------------------
  // Save Local State (btc + ads + startTime only)
  // -----------------------------
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("btcBalance", btcBalance.toString());
        await AsyncStorage.setItem("adsWatched", adsWatched.toString());
        if (startTime) {
          await AsyncStorage.setItem("startTime", startTime.toString());
        }
      } catch (e) {
        console.error("Error saving mining state", e);
      }
    };

    saveData();
  }, [btcBalance, adsWatched, startTime]);

  // -----------------------------
  // Mining Logic
  // -----------------------------
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const isMiningActive =
      hashPower > 0 && startTime && Date.now() - startTime < MAX_MINING_DURATION;

    if (isMiningActive) {
      intervalRef.current = setInterval(() => {
        setBtcBalance((prev) => {
          const updated = prev + hashPower * BTC_PER_HASHPOWER_PER_SEC;
          balanceRef.current = updated;
          return updated;
        });
      }, 1000);

      miningAnimationRef.current?.play();
    } else {
      miningAnimationRef.current?.pause();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hashPower, startTime]);

  // -----------------------------
  // API Calls
  // -----------------------------
  const fetchBalance = async () => {
    try {
      const fetch_balance_uri = `${get_data_uri(
        "GET_WALLET_BALANCE"
      )}?userId=${user.id}`;
      console.log("Fetch Balance URL: ", fetch_balance_uri);

      const res = await fetch(fetch_balance_uri);
      const data = await res.json();

      if (res.ok && data.balance) {
        const btcValue = parseFloat(
          data.balance.BTC?.$numberDecimal ?? data.balance.BTC ?? "0"
        );
        const safeVal = isNaN(btcValue) ? 0 : btcValue;

        setBtcBalance(safeVal);
        balanceRef.current = safeVal;
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const syncBalance = async () => {
    try {
      const res = await fetch(get_data_uri("SET_WALLET_BALANCE"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          asset: "BTC",
          amount: balanceRef.current,
        }),
      });

      const data = await res.json();
      console.log("Setting Balance in DB: ", balanceRef.current);
      console.log("API RESPONSE: ", data);
    } catch (err) {
      console.error("Error syncing balance:", err);
    }
  };

  // Sync balance periodically (every 30s)
  useEffect(() => {
    balanceRef.current = btcBalance;
  }, [btcBalance]);

  useEffect(() => {
    const syncInterval = setInterval(syncBalance, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  // -----------------------------
  // Referrals
  // -----------------------------
  const get_referrals = async () => {
    try {
      const fetch_referrals_uri = `${get_data_uri("REFERRALS")}?code=${encodeURIComponent(
        user.referralCode
      )}`;

      const res = await fetch(fetch_referrals_uri, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setUserReferrals(Number(data.count) || 0);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  useEffect(() => {
    get_referrals();
  }, []);

  // -----------------------------
  // UI helpers
  // -----------------------------
  const isMiningActive =
    hashPower > 0 && startTime && Date.now() - startTime < MAX_MINING_DURATION;

  const buttonLabel = loading
    ? "Loading..."
    : adsWatched >= MAX_ADS
    ? "Max Videos Reached"
    : isMiningActive
    ? `Increase 5 GH/s`
    : "Start Mining";

  return (
    <View style={{ flex: 1 }}>
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)}/>

      <ScrollView style={styles.container}>
        {/* <View style={styles.topBar}>
          
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Icon name="menu" size={30} color={'#fff'} />
          </TouchableOpacity>
        </View> */}

        <LinearGradient
          colors={['#1A202C', '#2D3748']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeText}>
            Welcome back, {user?.name}!
          </Text>
          <Text style={styles.subText}>
            Your digital assets at glance.
          </Text>
        </LinearGradient>

        <TouchableOpacity onPress={() => navigation.navigate('BalanceHistoryScreen')}>
        <LinearGradient
          colors={['#70ecffff', '#a694b8ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btcBox}
        >
          <LottieView
            ref={miningAnimationRef}
            source={miningCardAnimation}
            loop
            style={{ width: 60, height: 60 }}
          />
          <Text style={styles.btcText}>
            {loadingBalance 
              ? "Loading..." 
              : btcBalance?.toFixed(12) + " BTC"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

        <View style={styles.buttonRow}>
          <GradientButton icon="gift" onPress={() => navigation.navigate('DailyRewardsScreen')} text="Claim Free Miners" />
          <GradientButton
            icon="play-circle"
            text={buttonLabel}
            onPress={show}
            disabled={loading || adsWatched >= MAX_ADS}
          />
        </View>
        <GradientButtonB icon="credit-card-outline" onPress={() => navigation.navigate('Store')} text="Premium Miners" fullWidth />

        <View style={styles.cardRow}>
          <StatCard icon="currency-usd" value="$0" label="Daily Profit" />
          <StatCard 
            icon="chart-line" 
            value={`${hashPower.toLocaleString()} GH/s`} 
            label="Current Hashrate" 
          />
          <StatCard icon="speedometer" value="98%" label="Efficiency" />
        </View>

        <View style={styles.cardRow}>
          <InfoCard icon="wallet" value="$0" label="Total Wallet Balance" onPress={() => {
            navigation.navigate('Wallet');
          }}
          />

          <InfoCard icon="account-group" value={user_referrals.toString()} label="Total Referrals" onPress={() => {
            navigation.navigate('InternalReferral');
          }}/>
        </View>

        <LinearGradient
          colors={['#1A202C', '#2D3748']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portfolioBox}
        >
          <Text style={styles.sectionTitle}>Portfolio Performance</Text>

          {/* Temporary placeholder for chart */}
          <View style={styles.chart}>
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-line" size={40} color="#22D3EE" />
              <Text style={styles.chartPlaceholderText}>Portfolio Chart</Text>
              <Text style={styles.chartPlaceholderSubtext}>Chart will be restored soon</Text>
            </View>
          </View>

          <View style={styles.filters}>
            {['1D', '1W', '1M', '1Y', 'ALL'].map((filter) => (
              <View key={filter} style={styles.filterBox}>
                <Text style={styles.filterText}>{filter}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.cardRow}>
          <ActionCard icon="cash-minus" label="Withdraw Funds" onPress={() => {
            navigation.navigate('WithdrawScreen');
          }}/>
          <ActionCard icon="cash-plus" label="Deposit Funds" onPress={() => {
            navigation.navigate('DepositScreen');
          }}/>
        </View>

        <View style={styles.recentBox}>
          <Text style={styles.sectionTitleRC}>Recent Activity</Text>

          {recent_activity_list.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <LottieView
                source={{ uri: 'https://lottie.host/7b3e44d0-5de2-4434-9731-45dcf7f12b7a/cwLLBxENUP.json' }}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
              />
              <Text style={{ color: '#aaa', fontSize: 16, marginTop: 10 }}>
                No transactions, deposit now
              </Text>
            </View>
          ) : (
            <>
              {recent_activity_list.map((activity, index) => (
                <View key={index} style={styles.transactionRow}>
                  <View>
                    <Text style={styles.transactionType}>{activity.type}</Text>
                    <Text style={styles.transactionCrypto}>{activity.crypto}</Text>
                  </View>
                  <Text style={styles.transactionValue}>+${activity.amount.toFixed(2)}</Text>
                </View>
              ))}

              <GradientButtonB
                text="View All Activity"
                fullWidth
                onPress={() => {
                  navigation.navigate('AllActivity');
                }}
              />
            </>
          )}
        </View>

      </ScrollView>

      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={HOMEBANNER_AD_UNIT_ID ?? ""}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
  );
};

const GradientButton: React.FC<GradientButtonProps> = ({ icon, text, onPress, disabled = false }) => (
  <TouchableOpacity
    style={{ flex: 1, borderRadius: 40, overflow: "hidden" }}
    activeOpacity={0.8}
    onPress={onPress}
    disabled={disabled}
  >
    <LinearGradient
      colors={['#22D3EE', '#C084FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradientButton, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
    >
      {text === "Claim Free Miners" ? (
        <LottieView
          source={{
            uri: "https://lottie.host/6c2ebe48-6e55-4edb-9c0b-6fd48360beae/AyZ7cmF141.json",
          }}
          autoPlay
          loop
          style={[styles.headerAnimation, { width: 38, height: 38, marginTop: "-5%", marginRight: "-2%" }]}
        />
      ) : (
        icon && <Icon name={icon} size={18} color="#fff" style={[styles.buttonIcon]} />
      )}
      <Text style={styles.buttonText}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const GradientButtonB: React.FC<GradientButtonProps> = ({ icon, text, onPress }) => (
  <TouchableOpacity 
    style={{ flex: 1, borderRadius: 40, overflow: "hidden" }}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <LinearGradient
      colors={['#22D3EE', '#C084FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientButton}
    >
      {icon && <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
      <Text style={styles.buttonText}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color = '#22D3EE' }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);


const InfoCard: React.FC<InfoCardProps> = ({ icon, value, label, onPress }) => (
  <TouchableOpacity
    style={styles.infoCard}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Icon name={icon} size={48} color="#0891B2" />
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActionCard: React.FC<ActionCardProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
    <Icon name={icon} size={40} color="#22D3EE" />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default Page;

// Styles
const styles = StyleSheet.create({
  btcBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20,
    minHeight:  Platform.OS === 'ios' ? 70 : 80,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  headerAnimation: {
    width: 30,
    height: 30,
  },
  btcText: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111827',
    marginBottom: 30
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 30,
    backgroundColor: '#111827'
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 16,
    marginRight: 6,
    color: '#fff'
  },
  welcomeCard: {
    borderRadius: 16,
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 10,
    paddingBottom: 20,
    marginBottom: 20,
    marginTop: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    minHeight: Platform.OS === 'ios' ? 120 : 80,
  },
  welcomeText: {
    fontSize: 25,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginLeft: 20
  },
  subText: {
    color: '#e0e0e0',
    marginTop: 6,
    fontSize: 16,
    marginLeft: 20
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  gradientButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    minHeight: Platform.OS === 'ios' ? 45 : 55,
  },

  gradientButtonB: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    marginBottom: 12,
    minHeight: Platform.OS === 'ios' ? 80 : 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    alignSelf: "center",
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    gap: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#fff',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  infoValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
    color: "#0891B2",
    textAlign: 'center',
    fontFamily: 'Inter'
  },
  infoLabel: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    fontFamily: 'Inter'
  },
  portfolioBox: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'ios' ? 5 : 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    minHeight: Platform.OS === 'ios' ? 290 : 220,

    // Shadows for iOS/Android
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  chart: {
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  chartPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  chartPlaceholderText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 8,
    fontWeight: "600",
  },

  chartPlaceholderSubtext: {
    fontSize: 12,
    color: "#A0AEC0",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff'
  },
  sectionTitleRC: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff'
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  filterBox: {
    backgroundColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    color: '#D1D5DB'
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: "#fff",
    fontWeight: 'bold'
  },
  recentBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 60,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionType: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 14,
  },
  transactionCrypto: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
});