import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../components/types';
import { useNavigation } from '@react-navigation/native';

const transactions = [
  {
    type: 'Deposit',
    method: 'Bank Transfer',
    date: '2025-07-06 14:32',
    amount: '+$500.00',
    isPositive: true,
  },
  {
    type: 'Subscription Fee',
    method: 'Card Payment',
    date: '2025-07-05 10:12',
    amount: '-$29.99',
    isPositive: false,
  },
  {
    type: 'Sent Payment',
    method: 'Crypto (BTC)',
    date: '2025-07-04 18:00',
    amount: '-$100.00',
    isPositive: false,
  },
  {
    type: 'Deposit',
    method: 'Bank Transfer',
    date: '2025-07-06 14:32',
    amount: '+$1500.00',
    isPositive: true,
  },
  {
    type: 'Deposit',
    method: 'Bank Transfer',
    date: '2025-07-06 14:32',
    amount: '+$300.00',
    isPositive: true,
  },
];

const WalletScreen = () => {
  const handleDeposit = () => {
    navigation.navigate('DepositScreen');
  };

  const handleWithdraw = () => {
    navigation.navigate('WithdrawScreen');
  };

  const handleViewAll = () => {
    console.log('View All Transactions');
  };

    type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;
  
    const navigation = useNavigation<LoginScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15213B" />
      <ScrollView contentContainerStyle={styles.scrollView}>

        {/* Balance Box */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Your Current Balance</Text>
          <Text style={styles.balanceAmount}>$12,345.67</Text>
          <Text style={styles.balanceChange}>+2.5% today</Text>
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
          {transactions.map((txn, index) => (
                <View
                key={index}
                style={[
                    styles.transactionRow,
                    index !== 0 && styles.transactionRowBorderTop, // Add border if not the first
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
    backgroundColor: 'rgba(240, 255, 255, 0.17)', // azure with opacity
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
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceChange: {
    color: '#34D399',
    fontSize: 14,
    marginTop: 4,
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
});
