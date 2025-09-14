import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { useAuth } from '../auth/AuthProvider';
import { Sidebar } from '../components/Sidebar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';

import { HOMEBANNER_AD_UNIT_ID, showRewardedAd } from '../services/googleAds';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, get_data_uri } from '../config/api';
import LottieView from 'lottie-react-native';
import miningCardAnimation from '../assets/animations/mining-card.json';
import { useHashPower } from "../stores/HashPowerStore";
import messaging from '@react-native-firebase/messaging';

const MAX_ADS = 10;
const BASE_HASHPOWER_PER_AD = 5;
const BTC_PER_HASHPOWER_PER_SEC = 0.000000000001;
const MAX_MINING_DURATION = 24 * 60 * 60 * 1000;
const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Page'>;

const Page: React.FC = () => {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [btcBalance, setBtcBalance] = useState(0);
  const { hashPower, setHashPower, addHashPower } = useHashPower();
  const [adsWatched, setAdsWatched] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isMiningEnabled, setIsMiningEnabled] = useState(true);

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceRef = useRef(btcBalance);
  const miningAnimationRef = useRef<LottieView>(null);

  const [user_referrals, setUserReferrals] = useState(0);

  interface Activity {
    type: string;
    amount: number;
    crypto: string;
  }

  const [recent_activity_list, setRecentActivityList] = useState<Activity[]>([]);

  async function saveFcmTokenToBackend(id: any, token: string) {
    try {
      const fcm_uri = get_data_uri('CREATE_FCM');

      console.log("FCMHome - URL: ", fcm_uri);

      const response = await fetch(fcm_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          token: token
        }),
      });

      // console.log("FCMHome - API Response: ", response);
      // console.log("FCMHome - API Response JSON : ", response.json());

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("FCMHome - Non-JSON response:", text);
        throw new Error("FCMHome - Invalid response from server");
      }

    } catch (error) {
      console.log("FCMHome - Error: ", error);
    }
  }

  useEffect(() => {
    if (!user) return;

    const getToken = async () => {
      const token = await messaging().getToken();
      console.log("FirebaseLG - FCM Token:", token);

      await saveFcmTokenToBackend(user.id, token);
    };

    getToken();

    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log("FirebaseLG - New FCM Token:", token);
      await saveFcmTokenToBackend(user.id, token);
    });

    return unsubscribe;
  }, [user]);

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

  const { show, loading, loaded } = showRewardedAd(handleReward);

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
  // Save Local State
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
    <View style={styles.container}>
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)}/>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
              <Text style={styles.subWelcomeText}>Your mining dashboard</Text>
            </View>
            <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
              <Icon name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Balance Card */}
        <TouchableOpacity onPress={() => navigation.navigate('BalanceHistoryScreen')} style={styles.balanceCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceLeft}>
                <Icon5 name="bitcoin" size={32} color="#FFFFFF" />
                <View style={styles.balanceTextContainer}>
                  {/* <Text style={styles.balanceLabel}>Total Balance</Text> */}
                  <Text style={styles.balanceAmount}>
                    {loadingBalance ? "Loading..." : btcBalance?.toFixed(8) + " BTC"}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
{/* Notification Banner (like circled section) */}
<View style={styles.notificationBanner}>
  <Icon name="volume-high" size={20} color="#22D3EE" style={{ marginRight: 8 }} />
  <Text style={styles.notificationText} numberOfLines={1}>
    *****2826 purchased 200 Gh/s power
  </Text>
</View>

        {/* Mining Power Section */}
        <View style={styles.miningSection}>
  {/* Header Row */}
  <View style={styles.miningHeader}>
    <View style={styles.miningTitleContainer}>
      <Icon name="pickaxe" size={20} color="#22D3EE" />
      <Text style={styles.miningTitle}>Mining Power</Text>
    </View>

    {/* Toggle */}
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>
        {isMiningEnabled ? 'Activated' : 'Activate'}
      </Text>
      <Switch
        value={isMiningEnabled}
        onValueChange={setIsMiningEnabled}
        trackColor={{ false: '#374151', true: '#22D3EE' }}
        thumbColor={isMiningEnabled ? '#fff' : '#9CA3AF'}
      />
    </View>
  </View>

  {/* Mining Power + Hashrate in one line */}
  <View style={styles.hashrateRow}>
    {/* <Text style={styles.hashrateLabel}>Total Mining Power</Text> */}
    <Text style={styles.hashrateValue}>
      {hashPower.toLocaleString()} GH/s
    </Text>
  </View>
</View>


        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="credit-card-multiple" size={26} color="#FFFFFF" />
            <Text style={styles.statValue}>$0.00</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="account-heart" size={26} color="#FFFFFF" />
            <Text style={styles.statValue}>{user_referrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DailyRewardsScreen')}
          >
            <LinearGradient
              colors={['#22D3EE', '#C084FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Icon name="gift" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Free Rewards</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Store')}
          >
            <LinearGradient
              colors={['#22D3EE', '#C084FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Icon name="crown" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Premium Miners</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Portfolio Performance */}
        <View style={styles.portfolioSection}>
          <Text style={styles.sectionTitle}>Portfolio Performance</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Icon name="chart-line" size={40} color="#22D3EE" />
              <Text style={styles.chartText}>Performance Chart</Text>
              <Text style={styles.chartSubtext}>Coming soon</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('DepositScreen')}
          >
            <Icon name="plus-circle" size={28} color="#10B981" />
            <Text style={styles.quickActionText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('WithdrawScreen')}
          >
            <Icon name="minus-circle" size={28} color="#EF4444" />
            <Text style={styles.quickActionText}>Withdraw</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Icon name="credit-card-multiple" size={28} color="#3B82F6" />
            <Text style={styles.quickActionText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recent_activity_list.length === 0 ? (
            <View style={styles.emptyActivity}>
              <LottieView
                source={{ uri: 'https://lottie.host/7b3e44d0-5de2-4434-9731-45dcf7f12b7a/cwLLBxENUP.json' }}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>Start mining to see your progress</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recent_activity_list.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon name="bitcoin" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityType}>{activity.type}</Text>
                    <Text style={styles.activityCrypto}>{activity.crypto}</Text>
                  </View>
                  <Text style={styles.activityAmount}>+${activity.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
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


export default Page;

// Styles
const styles = StyleSheet.create({
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  
  notificationText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subWelcomeText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  menuButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  balanceCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  miningSection: {
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  
  miningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  miningTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  miningTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#22D3EE',
    fontWeight: '500',
  },
  
  hashrateRow: {
    alignItems: 'center',
  },
  
  hashrateLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  
  hashrateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22D3EE',
    marginBottom: 4,
  },
  hashrateDisplay: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    minHeight: Platform.OS === 'ios' ? 45 : 55,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  premiumCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumTextContainer: {
    marginLeft: 16,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  portfolioSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
  },
  chartText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
    fontWeight: '600',
  },
  chartSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
  },
  activitySection: {
    marginBottom: 24,
  },
  emptyActivity: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activityCrypto: {
    fontSize: 14,
    color: '#94A3B8',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});