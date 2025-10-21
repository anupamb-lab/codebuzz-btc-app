import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';

import { HOMEBANNER_AD_UNIT_ID, showRewardedAd } from '../services/googleAds';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { API_ENDPOINTS, get_data_uri } from '../config/api';
import LottieView from 'lottie-react-native';
import miningCardAnimation from '../assets/animations/mining-card.json';
import { useHashPower } from "../stores/HashPowerStore";
import messaging from '@react-native-firebase/messaging';
import { Image } from 'react-native';
import axios from 'axios';
import RNFS from 'react-native-fs';

const MAX_ADS = 10;
const BASE_HASHPOWER_PER_AD = 5;
const BTC_PER_HASHPOWER_PER_SEC = 0.0000000000000001;
const MAX_MINING_DURATION = 24 * 60 * 60 * 1000;
// const MAX_MINING_DURATION = 60 * 1000;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Page'>;

interface GradientButtonProps {
  icon?: string;
  text: string;
  fullWidth?: boolean;
  onPress?: () => void;
  disabled?: boolean; 
}

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

const useCountdown = (initialSeconds: number) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  // Reset when new initialSeconds arrives
  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  // Tick down each second
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format to HH:MM:SS
  const formatTime = (s: number) => {
    const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
    const mins = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return {
    formatted: formatTime(timeLeft),
    seconds: timeLeft,
  };
};

const Page: React.FC = () => {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [btcBalance, setBtcBalance] = useState(0);
  const [userBalance, setUserWalletBalance] = useState(0);
  const { hashPower, setHashPower, addHashPower, resetHashPower } = useHashPower();
  const [adsWatched, setAdsWatched] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isMiningEnabled, setIsMiningEnabled] = useState(false);
  const [serverTimeRemaining, setServerTimeRemaining] = useState(0);

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const balanceRef = useRef(btcBalance);
  const miningAnimationRef = useRef<LottieView>(null);

  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [user_referrals, setUserReferrals] = useState(0);
  const [timer, setTimer] = useState(0);

  const { formatted: formattedTimer, seconds: timerSecs } = useCountdown(serverTimeRemaining);

  interface Activity {
    type: string;
    method: string;
    amount: string;
    amountNumeric?: { $numberDecimal: string };
    crypto: string;
    date: string;
    isPositive: boolean;
  }

  const logToFile = async (message: string) => {
    const logFilePath = `${RNFS.DocumentDirectoryPath}/app_log.txt`;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    await RNFS.appendFile(logFilePath, logEntry, 'utf8');
    console.log(message);
  };

  const firstlaunchlog = () => {

    logToFile('App launched');
    logToFile(`Start time: ${Date.now()}`);

    logToFile(`--------------- Initial Values ---------------`);

    logToFile(`Initial HashPower: ${hashPower}`);
    logToFile(`UserID: ${!user?.id}`);
    logToFile(`BTC Balance: ${btcBalance}`);
    logToFile(`User Balance: ${userBalance}`);
    logToFile(`Ads Watched: ${adsWatched}`);
    logToFile(`Mining Enabled ? - ${isMiningEnabled}`);

    logToFile(`----------------------------------------------`);

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

  // -----------------------------
  // Reward Handler (Ad Watched)
  // -----------------------------
  const handleReward = async () => {
    setIsMiningEnabled(true);

    if (adsWatched >= MAX_ADS) return;

    const newAdsCount = adsWatched + 1;
    setAdsWatched(newAdsCount);

    // update hashPower via global store
    const updatedHashPower = hashPower + BASE_HASHPOWER_PER_AD;
    console.log("Reward CallBack Fired: ", hashPower);
    addHashPower(BASE_HASHPOWER_PER_AD);

    if (!startTime) {
    const now = Date.now();
    setStartTime(now);
    }

    console.log("Rewarded Callback SyncingData!!");

    await syncUserData(updatedHashPower, newAdsCount, true);
};

  const { show, loading, loaded } = showRewardedAd(handleReward);

  // -----------------------------
  // Load State
  // -----------------------------

  // useEffect(() => {
  //   if (intervalRef.current) clearInterval(intervalRef.current);

  //   const isMiningActive =
  //     isMiningEnabled && hashPower > 0 && startTime;

  //   console.log("Date Condition - Max Duration: ", MAX_MINING_DURATION);
  //   console.log("Date Condition - Current Time: ", Date.now());
  //   console.log("Date Condition - startTime: ", startTime);
  //   console.log("Date Condition - Total Mining Time: ", (Date.now() - startTime!));
  //   console.log("Date Condition - Overall: ", Date.now() - startTime! < MAX_MINING_DURATION);
  //   console.log("Date Condition - MiningActive ?: ", isMiningActive);
  //   console.log("Date Condition - MiningEnabled ?: ", isMiningEnabled);
    
  // }, [hashPower, startTime, isMiningEnabled]);

  useEffect(() => {
    let isMounted = true;

    const local_time = new Date().toLocaleString();
    const offset = new Date().getTimezoneOffset();
    console.log("User Local Time: ", local_time, offset);

    setHashPower(0);
    setIsMiningEnabled(false);

    const init = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        await logToFile('App launched');

        // Get FCM token
        const token = await messaging().getToken();
        await fetch(get_data_uri('CREATE_FCM'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, token }),
        });

        // --- Wait for all API calls ---
        const [balanceRes, userDetailsRes, txnsRes, referralsRes] = await Promise.all([
          fetch(`${get_data_uri("GET_WALLET_BALANCE")}?userId=${user.id}`),
          fetch(`${get_data_uri("USERMININGDETAILS")}/${user.id}`),
          fetch(`${get_data_uri("GET_RECENT_TRANSACTIONS")}/${user.id}`),
          fetch(`${get_data_uri("REFERRALS")}?code=${encodeURIComponent(user.referralCode)}`)
        ]);

        // Parse JSON after confirming responses are ready
        const [balanceData, userData, txnsData, refData] = await Promise.all([
          balanceRes.json(),
          userDetailsRes.json(),
          txnsRes.json(),
          referralsRes.json()
        ]);

        // --- Wait conditionally: only proceed if all required data exists ---
        if (!balanceData || !userData?.mining_details) {
          console.warn("Data not ready yet, waiting...");
          return; // Exit early, don't set state
        }

        // Wallet balance
        const btcDeposited = parseFloat(balanceData?.balance?.BTC_DEPOSIT?.$numberDecimal ?? 0);

        // Fetch BTC price
        const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
          params: { ids: "bitcoin", vs_currencies: "usd" }
        });
        const btcPrice = priceRes.data.bitcoin.usd;

        if (!isMounted) return;

        setUserWalletBalance(parseFloat(((btcDeposited * btcPrice)/4).toFixed(2)));

        // User details
        const details = userData.mining_details;
        const user_calculatedBTC = parseFloat(userData?.calculated_btc ?? 0);
        setBtcBalance(user_calculatedBTC);

        console.log("UserDetails #1: ", details, !!details.mining_isactive, "OLD BTC COUNT: ", user_calculatedBTC);

        setHashPower(parseFloat(details.hashpower ?? 0));
        setAdsWatched(parseFloat(details.rewarded_ads_watched ?? 0));
        setIsMiningEnabled(!!details.mining_isactive);
        setStartTime(details.start_time ?? null);
        setServerTimeRemaining(userData?.time_remaining ?? 0);

        // Transactions
        if (Array.isArray(txnsData?.transactions)) {
          setRecentActivity(txnsData.transactions);
        }

        // Referrals
        setUserReferrals(Number(refData?.count) || 0);

      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isMiningEnabled && hashPower > 0) {
      intervalRef.current = setInterval(() => {
        setBtcBalance(prev => {
          const updated = prev + hashPower * BTC_PER_HASHPOWER_PER_SEC;
          balanceRef.current = updated;
          return updated;
        });
      }, 1000);
      miningAnimationRef.current?.play();

      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      ).start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMiningEnabled, hashPower]);

  async function getBTCPrice() {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        { params: { ids: "bitcoin", vs_currencies: "usd" } }
      );
      return res.data.bitcoin.usd;
    } catch (err: any) {
      console.error("Error fetching BTC price:", err.message);
      return 0;
    }
  }

  // -----------------------------
  // API Calls
  // -----------------------------

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${get_data_uri('GET_RECENT_TRANSACTIONS')}/${user.id}`);
      const data = await res.json();

      // console.log("RecentTransactions - RAW: ", res);
      console.log("RecentTransactions - RESPONSE: ", data);

      if (res.ok && Array.isArray(data.transactions)) {
        const txns: Activity[] = data.transactions.map((txn: any) => ({
          type: txn.type,
          method: txn.method,
          date: txn.date,
          amount: txn.amount,
          amountNumeric: txn.amountNumeric,
          isPositive: parseFloat(txn.amountNumeric?.$numberDecimal ?? '0') >= 0,
        }));

        // console.log("TXNs: ", txns);

        setRecentActivityList(txns);
      } else {
        setRecentActivityList([]);
      }
    } catch (err) {
      console.error("Error fetching RecentTransactions:", err);
      setRecentActivityList([]);
    }
  }, [user?.id]);

    const blinkAnim = useRef(new Animated.Value(0)).current;

    const backgroundColor = blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#111827", "#22D3EE"], // dark -> cyan blink
    });

    const syncUserData = async (
      hp?: number,
      ads?: number,
      mining_status?: boolean
    ) => {
      try {

        const offset = new Date().getTimezoneOffset();
        const local_time = new Date().toLocaleString();

        var starttime = null;
        var endtime = null;

        var local_start_time = null;
        var local_end_time = null;

        if (isMiningEnabled) {
          starttime = Date.now();
          endtime = null;

          local_start_time = local_time;
          local_end_time = null;
        } else {
          starttime = null;
          endtime = Date.now();

          local_start_time = null;
          local_end_time = local_time;
        }
        
        const user_mining_data = {
          user_id: user.id,
          hashpower: hp ?? hashPower,              
          mining_isactive: mining_status ?? isMiningEnabled,
          rewarded_ads_watched: ads ?? adsWatched, 
          random_ads_watched: 0,
          start_time: starttime,
          stop_time: endtime,
          local_start_time: local_start_time,
          local_end_time: local_end_time,
          offset: offset
        };

        const set_user_data_uri = get_data_uri("USERMININGDETAILS");

        console.log("UserData - Setting UserData: ", user_mining_data);

        console.log("UserData - Setting UserData URI: ", user_mining_data);

        const res = await fetch(set_user_data_uri, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user_mining_data),
        });
  
        const data = await res.json();
        console.log("User Details - Setting Data in DB: ", balanceRef.current);
        console.log("User Details - API RESPONSE: ", data);
      } catch (err) {
        console.error("Error syncing user details:", err);
      }
    };

  const buttonLabel = loading
    ? "Loading..."
    : adsWatched >= MAX_ADS
      ? "Max Videos Reached"
      : `Increase 5 GH/s (${adsWatched}/${MAX_ADS})`


  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={styles.splashText}>Loading data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
              <Text style={styles.subWelcomeText}>Your mining dashboard</Text>
            </View>
          </View>
        </View>

        {/* Main Balance Card */}
        <View style={styles.shadowWrapper}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('BalanceHistoryScreen')} 
            style={styles.balanceCard}
          >
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
                    <Text style={styles.balanceAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}>
                      {isLoading ? "Loading..." : btcBalance?.toFixed(16) + " BTC"}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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

            {/* Activate text */}
            <Text style={styles.toggleLabel}>
              {isMiningEnabled ? 'Activated' : 'Activate'}
            </Text>
          </View>

          {/* Mining Power + Toggle inline */}
          <View style={styles.hashrateRow}>
            <Text style={styles.hashrateValue}>
              {hashPower.toLocaleString()} GH/s
            </Text>

            {/* Smaller toggle aligned right */}
            <Animated.View style={[styles.switchWrapperSmall, { backgroundColor }]}>
              <Switch
                style={styles.toggleSwitchSmall}
                value={isMiningEnabled}
                onValueChange={(newValue) => {
                  if (loading) {
                    Alert.alert(
                      "Please wait for Ads to load",
                      "Try again in some seconds.",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                          onPress: () => setIsMiningEnabled(false),
                        },
                        {
                          text: "OK",
                          onPress: () => {
                            setIsMiningEnabled(false);
                          },
                        },
                      ],
                      { cancelable: false }
                    );
                  } else {

                    if (newValue) {
                      Alert.alert(
                        "Mining Enabled",
                        "Watch an ad to start mining.",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setIsMiningEnabled(false),
                          },
                          {
                            text: "OK",
                            onPress: () => {
                              setIsMiningEnabled(true);
                              show();
                            },
                          },
                        ],
                        { cancelable: false }
                      );
                    } else {
                      setIsMiningEnabled(false);
                      syncUserData(undefined, undefined, false);
                      Alert.alert("Mining Disabled", "Mining has been turned off.");
                    }

                  }
                }}
                trackColor={{ false: "#374151", true: "#22D3EE" }}
                thumbColor={isMiningEnabled ? "#fff" : "#9CA3AF"}
              />
            </Animated.View>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("Wallet")}
          >
            <Icon name="credit-card-multiple" size={26} color="#FFFFFF" />
            <Text style={styles.statValue}>${userBalance}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("InternalReferral")}
          >
            <Icon name="account-heart" size={26} color="#FFFFFF" />
            <Text style={styles.statValue}>{user_referrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </TouchableOpacity>
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
              style={[styles.actionButtonGradient, styles.rewardButtonGradient]}
            >
              <View style={styles.rewardButtonContent}>
                <View style={styles.rewardTopRow}>
                  <Icon name="gift" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Free Rewards</Text>
                </View>
                <Text style={styles.rewardTimerText}>{formattedTimer}</Text>
              </View>
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
        <View style={styles.gradientButtonContainer}>
          <GradientButtonB icon="play-circle" onPress={() => show()} text={buttonLabel} fullWidth />
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
            <View style={styles.iconBox}>
              <Image
                source={require('../assets/images/home_deposit.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickActionText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('WithdrawScreen')}
          >
            <View style={styles.iconBox}>
              <Image
                source={require('../assets/images/home_withdrawal.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickActionText}>Withdraw</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={styles.iconBox}>
              <Image
                source={require('../assets/images/home_wallet.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
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
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityType}>{activity.type}</Text>
                    <Text style={styles.activityCrypto}>{activity.method} - {activity.amount}</Text>
                  </View>
                  <Text style={styles.activityAmount}>
                    {activity.isPositive ? "+" : "-"}${parseFloat(activity.amountNumeric?.$numberDecimal ?? "0").toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <View style={styles.bannerWrapper}>
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={HOMEBANNER_AD_UNIT_ID ?? ""}
            size={BannerAdSize.ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      </View>
    </View>
  );
};


export default Page;

// Styles
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  splashText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  toggle_switch: {
    transform: [{ scaleX: 0.5 }, { scaleY: 0.5 }]
  },
  iconBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 25,
    height: 28,
    paddingBottom: 5
  },
  iconImage: {
    width: 35,
    height: 35,
  },
  switchWrapper: {
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  gradientButtonContainer: {
    marginBottom: 15

  },
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
    paddingTop: Platform.OS === 'ios' ? 20 : 5
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
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Platform.OS === 'ios' ? 15 : 0,
    paddingLeft: Platform.OS === 'ios' ? 20 : 0,
    paddingRight: Platform.OS === 'ios' ? 20 : 0
  },
  shadowWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderRadius: 20,
    marginVertical: 12,
  },

  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  balanceGradient: {
    padding: Platform.OS === 'ios' ? 5 : 20,
    minHeight: 80,
    borderRadius: 20,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceTextContainer: {
    marginLeft: 8,
    flex: 1,
    alignItems: 'flex-end',
    maxWidth: '85%'
  },
  balanceLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: Platform.OS === 'ios' ? 17 : 25,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
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
    marginBottom: 8,
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

  toggleLabel: {
    fontSize: 14,
    color: '#22D3EE',
    fontWeight: '500',
  },

  hashrateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hashrateValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22D3EE',
  },

  switchWrapperSmall: {
    borderRadius: 16,
    transform: [{ scale: 0.8 }],
  },

  toggleSwitchSmall: {
    transform: [{ scale: 0.8 }],
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
    gap: Platform.OS === 'ios' ? 8 : 4,
    minHeight: Platform.OS === 'ios' ? 54 : 55,
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
    fontSize: 13,
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
  },
  activitySection: {
    marginBottom: Platform.OS === 'ios' ? 65 : 110,
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
    fontSize: 12,
    color: '#94A3B8',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  bannerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  bannerContainer: {
    width: '100%',
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
  gradientButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    minHeight: Platform.OS === 'ios' ? 45 : 55,
  },
  rewardButtonGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rewardButtonContent: {
    alignItems: 'center',
  },

  rewardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  rewardTimerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E0E7FF',
    marginTop: 2,
    opacity: 0.9,
  },
});