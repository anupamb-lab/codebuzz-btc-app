import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Easing,
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

interface GradientButtonProp {
  text: string;
  fullWidth?: boolean;
  onPress?: () => void;
  disabled?: boolean; 
}

interface FAQItem {
  _id: string;
  name: string;
  message: string;
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

const GradientButton: React.FC<GradientButtonProp> = ({ text, onPress }) => (
  <TouchableOpacity 
    style={{ flex: 1, borderRadius: 2, overflow: "hidden" }}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <LinearGradient
      colors={['#22D3EE', '#C084FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientClaimButton}
    >
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
  const [btcReferralBalance, setBtcRefBalance] = useState(0);
  const [userBalance, setUserWalletBalance] = useState(0);
  const [userBalanceBTC, setUserBTCWalletBalance] = useState(0);
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

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [faqVisible, setFaqVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  interface Activity {
    type: string;
    method: string;
    amount: string;
    amountNumeric?: { $numberDecimal: string };
    crypto: string;
    date: string;
    isPositive: boolean;
  }

  const animatedHeight = useRef(new Animated.Value(0)).current;

  type FAQResponse = {
    success: boolean;
    faqs: FAQItem[];
  };

  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await axios.get<FAQResponse>(
          get_data_uri('GET_FAQS')
        );
        setFaqData(response.data.faqs);
      } catch (err) {
        console.error(err);
        setError('Failed to load FAQ data');
      }
    };

    fetchFAQ();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.includes(item._id);

    return (
      <View key={item._id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(item._id)}
          activeOpacity={0.7}
        >
          <Text style={styles.questionText}>{item.name}</Text>
          <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            ▼
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{item.message}</Text>
          </View>
        )}
      </View>
    );
  };

  const toggleFAQ = () => {
    const toValue = faqVisible ? 0 : contentHeight;

    setFaqVisible(!faqVisible);

    Animated.timing(animatedHeight, {
      toValue,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

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

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const init = async () => {
        if (!user?.id) return;
        try {
          setIsLoading(true);
          await logToFile('Home focused - reloading data');

          const local_time = new Date().toLocaleString();

          console.log("Current Time: ", encodeURIComponent(local_time))

          const [balanceRes, userDetailsRes, txnsRes, referralsRes] = await Promise.all([
            fetch(`${get_data_uri("GET_WALLET_BALANCE")}?userId=${user.id}`),
            fetch(`${get_data_uri("USERMININGDETAILS")}/${user.id}?local_time=${encodeURIComponent(local_time)}`),
            fetch(`${get_data_uri("GET_RECENT_TRANSACTIONS")}/${user.id}`),
            fetch(`${get_data_uri("REFERRALS")}?code=${encodeURIComponent(user.referralCode)}`)
          ]);

          const [balanceData, userData, txnsData, refData] = await Promise.all([
            balanceRes.json(),
            userDetailsRes.json(),
            txnsRes.json(),
            referralsRes.json()
          ]);

          if (!isMounted) return;

          const btcDeposited = parseFloat(balanceData?.balance?.BTC_DEPOSIT?.$numberDecimal ?? 0);
          const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: { ids: "bitcoin", vs_currencies: "usd" }
          });
          const btcPrice = priceRes.data.bitcoin.usd;

          setUserBTCWalletBalance(btcDeposited);

          setUserWalletBalance(parseFloat(((btcDeposited * btcPrice)/4).toFixed(2)));

          const details = userData.mining_details;
          const user_calculatedBTC = parseFloat(userData?.calculated_btc ?? 0);
          setBtcBalance(user_calculatedBTC);
          setHashPower(parseFloat(details.hashpower ?? 0));
          setAdsWatched(parseFloat(details.rewarded_ads_watched ?? 0));
          setIsMiningEnabled(!!details.mining_isactive);
          setStartTime(details.start_time ?? null);
          setServerTimeRemaining(userData?.time_remaining ?? 0);

          if (Array.isArray(txnsData?.transactions)) {
            setRecentActivity(txnsData.transactions);
          }

          setUserReferrals(Number(refData?.count) || 0);
        } catch (err) {
          console.error("Error reloading on focus:", err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      init();

      return () => {
        isMounted = false;
      };
    }, [user])
  );

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
      : `Claim (${adsWatched}/${MAX_ADS})`


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
            <View style={styles.balanceContent}>
                <View style={styles.balanceLeft}>
                  <Icon5 name="bitcoin" size={25} color="#ffb700ff" />
                  <View style={styles.balanceTextContainer}>
                    <Text style={styles.balanceAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}>
                      {isLoading ? "Loading..." : btcBalance?.toFixed(16) + " BTC"}
                    </Text>
                  </View>
                </View>
              </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {/* Box 1 - Earning Details */}
          <TouchableOpacity 
            style={styles.detailBox}
            onPress={() => navigation.navigate('BalanceHistoryScreen')}
            >
            <View style={styles.detailLeft}>
              <Text
                style={styles.detailBTCValue}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                <Text style={styles.detailBTCNumber}>
                  {userBalanceBTC?.toFixed(16)}
                </Text>
                <Text style={styles.detailBTCUnit}> BTC</Text>
              </Text>
              <Text style={styles.detailSubtitle}>Earning Details</Text>
            </View>

            <Icon name="chevron-right" size={20} color="#9CA3AF" style={styles.detailArrow} />
          </TouchableOpacity>

          {/* Box 2 - Invitation Rewards */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("InternalReferral")}
            style={styles.detailBox}
            >
            <View style={styles.detailLeft}>
              <Text
                style={styles.detailBTCValue}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                <Text style={styles.detailBTCNumber}>
                  {btcReferralBalance?.toFixed(16)}
                </Text>
                <Text style={styles.detailBTCUnit}> BTC</Text>
              </Text>
              <Text style={styles.detailSubtitle}>Invitation Rewards</Text>
            </View>

            <Icon name="chevron-right" size={20} color="#9CA3AF" style={styles.detailArrow} />
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
              <Icon name="pickaxe" size={15} color="#22D3EE" />
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
              {hashPower.toLocaleString()}{" "}
              <Text style={styles.hashrateUnit}>Gh/s</Text>
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

        <View style={styles.claimRow}>
          {/* Box 1 - Gift Claim */}
          <TouchableOpacity style={styles.claimBox}>
            {/* Top Row */}
            <View style={styles.claimTopRow}>
              <View style={styles.iconCorner}>
                <Icon name="gift" size={16} color="#fff" />
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Icon name="information" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* +100% Claim Tag */}
            <View style={styles.bonusTag}>
              <Text style={styles.bonusTagText}>+100% Claim</Text>
            </View>

            {/* Power Row */}
            <View style={styles.powerRow}>
              <Text style={styles.powerValue}>3</Text>
              <Text style={styles.powerUnit}> Gh/s</Text>
            </View>

            {/* Claim Button */}
            <GradientButton onPress={() => show() } text = "Claim" />
          </TouchableOpacity>

          {/* Box 2 - Video Claim */}
          <TouchableOpacity 
            style={styles.claimBox}
            onPress={() => show()}
            >
            {/* Top Row */}
            <View style={styles.claimTopRow}>
              <View style={styles.iconCorner}>
                <Icon name="video" size={16} color="#fff" />
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Icon name="information" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* +100% Claim Tag */}
            <View style={styles.bonusTag}>
              <Text style={styles.bonusTagText}>+100% Claim</Text>
            </View>

            {/* Power Row */}
            <View style={styles.powerRow}>
              <Text style={styles.powerValue}>5</Text>
              <Text style={styles.powerUnit}> Gh/s</Text>
            </View>

            {/* Claim Button */}
            <GradientButton onPress={() => show()} text = {buttonLabel} />
          </TouchableOpacity>
        </View>

        <View style={styles.gradientButtonContainer}>
          <GradientButtonB icon="gift" onPress={() => navigation.navigate('DailyRewardsScreen')} text="Claim Daily Rewards" fullWidth />
        </View>

        <View style={styles.FAQHeading}>
          <Text style={styles.sectionTitle}>FAQ</Text>
        </View>

        <View style={styles.faqSection}>
          <View
            style={[
              styles.faqContainer,
              faqVisible ? styles.faqContainerExpanded : styles.faqContainerCollapsed,
            ]}
          >
            {/* Header Button */}
            <TouchableOpacity
              style={styles.faqHeaderButton}
              onPress={toggleFAQ}
              activeOpacity={0.8}
            >
              <Text style={styles.faqHeaderText}>FAQs</Text>
              <Animated.Text
                style={[
                  styles.faqArrow,
                  {
                    transform: [
                      {
                        rotate: animatedHeight.interpolate({
                          inputRange: [0, contentHeight],
                          outputRange: ['0deg', '90deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ▶
              </Animated.Text>
            </TouchableOpacity>

            {/* Animated expanding section */}
            <Animated.View style={[styles.faqExpandedArea, { height: animatedHeight }]}>
              {/* The visible FAQ content */}
              {faqVisible && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {faqData.length > 0 ? (
                    faqData.map(renderFAQItem)
                  ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : (
                    <Text style={styles.loadingText}>Loading FAQs...</Text>
                  )}
                  <View style={styles.bottomSpacing} />
                </ScrollView>
              )}

              {/* Invisible layout measurer */}
              <View
                style={styles.hiddenContentWrapper}
                onLayout={(e) => {
                  const { height } = e.nativeEvent.layout;
                  setContentHeight(height);
                }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {faqData.length > 0 ? (
                    faqData.map(renderFAQItem)
                  ) : null}
                </ScrollView>
              </View>
            </Animated.View>
          </View>
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
    marginTop: 20
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
    marginBottom: 4,
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
    justifyContent: 'center',
    paddingVertical: 8,
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
  balanceLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },

  balanceTextContainer: {
    marginLeft: 6,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  balanceAmount: {
    fontSize: 20,
    fontWeight: 500,
    color: '#fff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  miningSection: {
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 16,
    marginBottom: 4,
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
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  toggleLabel: {
    fontSize: 13,
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
    color: '#fff',
  },

  switchWrapperSmall: {
    borderRadius: 16,
    transform: [{ scale: 0.7 }],
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
    marginBottom: Platform.OS === 'ios' ? 65 : 110
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
  gradientClaimButton: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    minHeight: Platform.OS === 'ios' ? 35 : 40,
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

  // Top Boxes 

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },

  detailBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  detailLeft: {
    flex: 1,
    justifyContent: 'center',
  },

  detailBTCValue: {
    flexShrink: 1,
    textAlign: 'left',
  },

  detailBTCNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  detailBTCUnit: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 13,
  },

  detailSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },

  detailArrow: {
    marginLeft: 8,
    alignSelf: 'center',
  },

  // Claim Boxes

  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
    marginBottom: 20
  },

  claimBox: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 150,
  },

  claimTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconCorner: {
    width: 35,
    height: 35,
    backgroundColor: '#3784efff',
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bonusTag: {
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 35
  },

  bonusTagText: {
    color: '#FBBF24',
    fontWeight: '600',
    fontSize: 12,
  },

  powerRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'baseline',
  },

  powerValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  powerUnit: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },

  claimButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: 'center',
  },

  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // FAQs

  FAQHeading: {
    marginTop: 10
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingTop: 30
  },
  bottomSpacing: {
    height: 50,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#202024ff',
  },
  answerText: {
    color: '#b0b0b0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 15,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  faqItem: {
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#2d2d44',
    overflow: 'hidden',
  },
  expandIcon: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  faqSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 80
  },


  faqArrowRotated: {
    transform: [{ rotate: '90deg' }],
  },

  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  faqContainer: {
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderRadius: 14,
  },

  faqContainerCollapsed: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  faqContainerExpanded: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  faqHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  faqHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  faqArrow: {
    color: '#9CA3AF',
    fontSize: 16,
  },

  faqExpandedArea: {
    overflow: 'hidden',
    backgroundColor: '#334155',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },

  hiddenContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },

  hashrateUnit: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: 'normal',
  },

});