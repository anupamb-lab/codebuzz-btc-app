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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  type: string;
  method: string;
  date: string;
  amount: string;
  isPositive: boolean;
}

const BTC_TO_USD = 120000;

const WalletScreen = () => {
  const [btcBalance, setBtcBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUSD, setShowUSD] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  type WalletNav = StackNavigationProp<RootStackParamList, 'Wallet'>;
  const navigation = useNavigation<WalletNav>();

  const loadData = useCallback(async () => {
    try {
      const storedBtc = await AsyncStorage.getItem("btcBalance");
      if (storedBtc) {
        setBtcBalance(parseFloat(storedBtc));
      }

      const storedTxns = await AsyncStorage.getItem("transactions");
      if (storedTxns) {
        setTransactions(JSON.parse(storedTxns));
      }
    } catch (e) {
      console.error("Error loading wallet data", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeposit = () => navigation.navigate('DepositScreen');
  const handleWithdraw = () => navigation.navigate('WithdrawScreen');
  const handleViewAll = () => console.log('View All Transactions');

  const displayedValue = showUSD
    ? `$${((btcBalance / 4) * BTC_TO_USD).toFixed(4)}`
    : `${(btcBalance / 4).toFixed(12)} BTC`;

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
          <Text style={styles.balanceAmount}>{displayedValue}</Text>
          <Text style={styles.balanceChange}>Mining earnings</Text>

          <TouchableOpacity
            style={styles.convertButton}
            onPress={() => setShowUSD(!showUSD)}
          >
            <Text style={styles.convertText}>
              {showUSD ? "Show in BTC" : "Convert to USD"}
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
              <Text style={styles.emptyText}>No transactions yet</Text>
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
                    {txn.amount}
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
