import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../components/types';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import noTxAnimation from '../assets/animations/no-data.json';
import { useAuth } from '../auth/AuthProvider';
import { get_data_uri } from '../config/api';

interface Transaction {
  type: string;
  method: string;
  date: string;
  amountNumeric?: { $numberDecimal: string };
  isPositive: boolean;
}

async function getBTCPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      { params: { ids: "bitcoin", vs_currencies: "usd" } }
    );
    return res.data.bitcoin.usd;
  } catch (err) {
    console.error("Error fetching BTC price:", err.message);
    return 0;
  }
}

const WalletScreen = () => {
  const { user } = useAuth();
  const [btcBalance, setBtcBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUSD, setShowUSD] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [displayedBalance, setDisplayedBalance] = useState<string>('Loading...');
  const [balanceLoading, setBalanceLoading] = useState(false);

  type WalletNav = StackNavigationProp<RootStackParamList, 'Wallet'>;
  const navigation = useNavigation<WalletNav>();

  // Fetch BTC balance from server
  const fetchBalance = useCallback(async () => {
    try {
      if (!user?.id) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      const res = await fetch(
        `${get_data_uri("GET_WALLET_BALANCE")}?userId=${user.id}`
      );
      const data = await res.json();

      if (res.ok && data.balance) {
        const btcVal = parseFloat(
          data.balance.BTC?.$numberDecimal ?? data.balance.BTC ?? "0"
        );
        setBtcBalance(btcVal);
      }
    } catch (err) {
      console.error("Error fetching BTC balance:", err);
    }
  }, [user?.id, navigation]);

  // Fetch user transactions from server
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${get_data_uri('CREATE_WITHDRAWAL')}/user/${user.id}`);
      const data = await res.json();

      console.log("API RESPONSE: ", data);

      if (res.ok && Array.isArray(data)) {
        const txns: Transaction[] = data.map((txn: any) => ({
          type: txn.asset,
          method: txn.chain,
          date: txn.created_at,
          amountNumeric: txn.amountNumeric,
          isPositive: parseFloat(txn.amountNumeric?.$numberDecimal ?? '0') >= 0,
        }));
        setTransactions(txns);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    }
  }, [user.id]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBalance();
      await fetchTransactions();
    } catch (err) {
      console.error("Error loading wallet data", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function updateBalance() {
      if (showUSD) {
        setBalanceLoading(true);
        const price = await getBTCPrice();
        setDisplayedBalance(`$${btcBalance * price}`);
        setBalanceLoading(false);
      } else {
        setDisplayedBalance(`${btcBalance.toFixed(12)} BTC`);
      }
    }
    updateBalance();
  }, [btcBalance, showUSD]);

  const onRefresh = async () => {
    await loadData();
  };

  const handleDeposit = () => navigation.navigate('DepositScreen');
  const handleWithdraw = () => navigation.navigate('WithdrawScreen');
  const handleViewAll = () => console.log('View All Transactions');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15213B" />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Balance Box */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Your Current Balance</Text>
          <Text
            style={styles.balanceAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {displayedBalance}
          </Text>
          <Text style={styles.balanceChange}>Mining earnings</Text>

          <TouchableOpacity
            style={styles.convertButton}
            onPress={() => setShowUSD(!showUSD)}
            disabled={balanceLoading}
          >
            <Text style={styles.convertText}>
              {balanceLoading ? "Loading..." : showUSD ? "Show in BTC" : "Convert to USD"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <TouchableOpacity style={styles.buttonTouchable} onPress={handleDeposit}>
              <Text style={styles.buttonText}>+ Deposit Funds</Text>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={['#4F46E5', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <TouchableOpacity style={styles.buttonTouchable} onPress={handleWithdraw}>
              <Text style={styles.buttonText}>- Withdraw Funds</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionContainer}>
          <Text style={styles.transactionHeader}>Transaction History</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <LottieView
                source={noTxAnimation}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
            </View>
          ) : (
            <>
              {transactions.map((txn, index) => (
                <View
                  key={index}
                  style={[
                    styles.transactionRow,
                    index !== 0 && styles.transactionRowBorderTop,
                  ]}
                >
                  <View>
                    <Text style={styles.transactionType}>{txn.type}</Text>
                    <Text style={styles.transactionMethod}>Method: {txn.method}</Text>
                    <Text style={styles.transactionDate}>{txn.date}</Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: txn.isPositive ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {txn["amountNumeric"]?.$numberDecimal ?? '0'}
                  </Text>
                </View>
              ))}

              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                <Text style={styles.viewAllText}>View All Transactions</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15213B',
  },
  scrollView: {
    padding: 16,
    paddingTop: 60
  },
  balanceBox: {
    backgroundColor: 'rgba(240, 255, 255, 0.17)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  balanceChange: {
    color: '#34D399',
    fontSize: 14,
    marginTop: 10,
  },
  convertButton: {
    marginTop: 12,
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  convertText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionContainer: {
    backgroundColor: '#1F2A44',
    padding: 16,
    borderRadius: 12,
  },
  transactionHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionType: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '500',
  },
  transactionMethod: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 2,
  },
  transactionDate: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  viewAllButton: {
    marginTop: 16,
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '500',
  },
  transactionRowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
    marginTop: 16,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
