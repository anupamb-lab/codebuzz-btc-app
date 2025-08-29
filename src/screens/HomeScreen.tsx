import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { LineChart, Grid } from 'react-native-svg-charts';
// import * as shape from 'd3-shape';
import { useAuth } from '../auth/AuthProvider';
import { Sidebar } from '../components/Sidebar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';

import { HOMEBANNER_AD_UNIT_ID, showRewardedAd } from '../services/googleAds';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const MAX_ADS = 10;
const BASE_HASHPOWER_PER_AD = 5;
const BTC_PER_HASHPOWER_PER_SEC = 0.000000000001;

const Page: React.FC = () => {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const data = [50, 10, 40, 95, 85, 91, 35];

  const [btcBalance, setBtcBalance] = useState(0);
  const [hashPower, setHashPower] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);

  type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Page'>;

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleReward = async (amount: number, type: string) => {
    console.log(`User earned reward: ${amount} ${type}`);

    if (adsWatched >= MAX_ADS) return;

    const newAdsCount = adsWatched + 1;
    const newHashPower = hashPower + BASE_HASHPOWER_PER_AD;

    setAdsWatched(newAdsCount);
    setHashPower(newHashPower);

    await AsyncStorage.setItem("adsWatched", newAdsCount.toString());
    await AsyncStorage.setItem("hashPower", newHashPower.toString());
  };

  const { show, loading, loaded } = showRewardedAd(handleReward);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBtc = await AsyncStorage.getItem("btcBalance");
        const storedHash = await AsyncStorage.getItem("hashPower");
        const storedAds = await AsyncStorage.getItem("adsWatched");
        const lastTimestamp = await AsyncStorage.getItem("lastTimestamp");

        const btc = storedBtc ? parseFloat(storedBtc) : 0;
        const hash = storedHash ? parseInt(storedHash) : 0;
        const ads = storedAds ? parseInt(storedAds) : 0;

        if (lastTimestamp) {
          const now = Date.now();
          const elapsed = Math.floor((now - parseInt(lastTimestamp)) / 1000);
          const mined = elapsed * hash * BTC_PER_HASHPOWER_PER_SEC;
          setBtcBalance(btc + mined);
        } else {
          setBtcBalance(btc);
        }

        setHashPower(hash);
        setAdsWatched(ads);
      } catch (e) {
        console.error("Error loading mining state", e);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("btcBalance", btcBalance.toString());
        await AsyncStorage.setItem("hashPower", hashPower.toString());
        await AsyncStorage.setItem("adsWatched", adsWatched.toString());
        await AsyncStorage.setItem("lastTimestamp", Date.now().toString());
      } catch (e) {
        console.error("Error saving mining state", e);
      }
    };

    saveData();
  }, [btcBalance, hashPower, adsWatched]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setBtcBalance(prev => prev + hashPower * BTC_PER_HASHPOWER_PER_SEC);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hashPower]);

  return (
    <View style={{ flex: 1 }}>
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)}/>

      <ScrollView style={styles.container}>
        <View style={styles.topBar}>
          
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Icon name="menu" size={30} color={'#fff'} />
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <Text style={styles.username}>{user?.name}</Text>
            <Icon name="account-circle" size={40} color={'#9333EA'} />
          </View>
        </View>

        <LinearGradient
          colors={['#1A202C', '#2D3748']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
          <Text style={styles.subText}>Your digital assets at glance.</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#70ecffff', '#a694b8ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btcBox}
        >
          <Icon name="bitcoin" size={28} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btcText}>{btcBalance.toFixed(12)} BTC</Text>
        </LinearGradient>

        <View style={styles.buttonRow}>
          <GradientButton icon="gift" onPress={() => navigation.navigate('DailyRewardsScreen')} text="Daily Rewards" />
          <GradientButton
            icon="play-circle"
            text={loading ? "Loading..." : adsWatched >= MAX_ADS ? "Max Videos Reached" : "Watch Video"}
            onPress={show}
            disabled={loading || adsWatched >= MAX_ADS}
          />
        </View>
        <GradientButtonB icon="credit-card-outline" onPress={() => navigation.navigate('Store')} text="Paid Plans" fullWidth />

        <View style={styles.cardRow}>
          <StatCard icon="currency-usd" value="$12.50" label="Daily Profit" />
          <StatCard 
            icon="chart-line" 
            value={`${hashPower.toLocaleString()} TH/s`} 
            label="Current Hashrate" 
          />
          <StatCard icon="speedometer" value="98%" label="Efficiency" />
        </View>

        <View style={styles.cardRow}>
          <InfoCard icon="wallet" value="$0" label="Total Wallet Balance" onPress={() => {
            navigation.navigate('Wallet');
          }}
          />

          <InfoCard icon="account-group" value="0" label="Total Referrals" onPress={() => {
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
          {/* Temporary placeholder for chart - will add back when SVG packages are fixed */}
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
          <ActionCard icon="cash-minus" label="Withdraw Funds" />
          <ActionCard icon="cash-plus" label="Deposit Funds" />
        </View>

        <View style={styles.recentBox}>
          <Text style={styles.sectionTitleRC}>Recent Activity</Text>

          {[50.64, 850.64, 150.64, 920.64].map((value, index) => (
            <View key={index} style={styles.transactionRow}>
              <View>
                <Text style={styles.transactionType}>Deposit</Text>
                <Text style={styles.transactionCrypto}>0.001 BTC</Text>
              </View>
              <Text style={styles.transactionValue}>+${value.toFixed(2)}</Text>
            </View>
          ))}

          <GradientButtonB text="View All Activity" 
            fullWidth 
            onPress={() => {

              navigation.navigate('AllActivity');

            }}
          />
          
        </View>
      </ScrollView>

      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={HOMEBANNER_AD_UNIT_ID}
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
  <LinearGradient
    colors={['#22D3EE', '#C084FC']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gradientButton, { width: '48%' }]}
  >
    <TouchableOpacity style={styles.buttonContent} activeOpacity={0.8} onPress={onPress} disabled={disabled}>
      {icon && <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  </LinearGradient>
);

const GradientButtonB: React.FC<GradientButtonProps> = ({ icon, text, onPress }) => (
  <LinearGradient
    colors={['#22D3EE', '#C084FC']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gradientButtonB, { width: '100%' }]}
  >
    <TouchableOpacity style={styles.buttonContent} activeOpacity={0.8}  onPress={onPress}>
      {icon && <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  </LinearGradient>
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

const ActionCard: React.FC<ActionCardProps> = ({ icon, label }) => (
  <View style={styles.actionCard}>
    <Icon name={icon} size={40} color="#22D3EE" />
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

export default Page;

// Styles
const styles = StyleSheet.create({
  btcBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btcText: {
    fontSize: 28,
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
    padding: 16,
    marginVertical: 16,
    paddingBottom: 20,
    marginBottom: 20
  },
  welcomeText: {
    fontSize: 25,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter'
  },
  subText: {
    color: '#e0e0e0',
    marginTop: 6,
    fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  gradientButton: {
    borderRadius: 40,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gradientButtonB: {
    borderRadius: 40,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 12,
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
    padding: 16,
    marginVertical: 16,
    height: 300,
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
  chart: {
    height: 180,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    color: '#22D3EE',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  chartPlaceholderSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
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