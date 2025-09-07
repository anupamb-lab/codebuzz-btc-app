import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import { useAuth } from '../auth/AuthProvider';
import { get_data_uri } from '../config/api';
import LottieView from 'lottie-react-native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'BalanceHistoryScreen'>;

interface BalanceDecimal {
  $numberDecimal: string;
}
interface BalanceObject {
  BTC: number | BalanceDecimal;
  USDT: number | BalanceDecimal;
  USDC: number | BalanceDecimal;
  BNB: number | BalanceDecimal;
  LTC: number | BalanceDecimal;
}
interface BalanceHistory {
  _id: string;
  date: string;
  balances: BalanceObject;
}

const BalanceHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const user_id = user?.id;

  const [history, setHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${get_data_uri('GET_BALANCE_HISTORY')}?userId=${user_id}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setHistory(data.balances || []);
      }
    } catch (err) {
      console.error('Error fetching balance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatBalance = (val: number | BalanceDecimal, decimals = 6) => {
    if (typeof val === 'object' && '$numberDecimal' in val) {
      return parseFloat(val.$numberDecimal || '0').toFixed(decimals);
    }
    return typeof val === 'number' ? val.toFixed(decimals) : '0.00';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Balance History</Text>
        <View style={{ width: 24 }} /> {/* spacer */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#53D3F6" style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <View style={styles.noRecordsBox}>
          <LottieView
            source={{ uri: 'https://lottie.host/014c662a-e804-42de-a029-486d14645e9c/rcfStinxUX.lottie' }}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.noRecordsText}>No records yet, Keep mining!!</Text>
        </View>
      ) : (
        history.map((item) => {
          const { BTC, USDT, USDC, BNB, LTC } = item.balances;
          const dateStr = new Date(item.date).toLocaleDateString();

          return (
            <View key={item._id} style={styles.historyBox}>
              <Text style={styles.dateText}>{dateStr}</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.label}>BTC</Text>
                <Text style={styles.value}>{formatBalance(BTC, 8)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.label}>USDT</Text>
                <Text style={styles.value}>{formatBalance(USDT, 2)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.label}>USDC</Text>
                <Text style={styles.value}>{formatBalance(USDC, 2)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.label}>BNB</Text>
                <Text style={styles.value}>{formatBalance(BNB, 6)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.label}>LTC</Text>
                <Text style={styles.value}>{formatBalance(LTC, 6)}</Text>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity
        onPress={async () => {
          navigation.goBack()
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#53D3F6', '#BD85FC', '#F472B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    paddingVertical: Platform.OS === 'ios' ? 80 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
  },
  value: {
    color: '#53D3F6',
    fontSize: 14,
    fontWeight: '600',
  },
  noRecordsBox: {
    alignItems: 'center',
    marginTop: 100,
  },
  noRecordsText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    minHeight: 40,
    marginTop: Platform.OS === 'ios' ? 150 : 250,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BalanceHistoryScreen;
