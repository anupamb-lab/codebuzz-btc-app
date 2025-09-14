import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Clipboard,
  Platform,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { get_data_uri } from '../config/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import { useNavigation } from '@react-navigation/native';

const paymentMethods = [
  { key: 'crypto', label: 'Pay with Crypto', icon: 'logo-bitcoin' },
  { key: 'card', label: 'Credit/Debit Card', icon: 'card-outline' },
  { key: 'bank', label: 'Bank Deposit', icon: 'business-outline' },
];

const coinOptions = ['BTC', 'USDT', 'USDC'];
const chainOptions = ['BTC', 'BEP20'];

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MakePaymentScreen'>;
    
const navigation = useNavigation<LoginScreenNavigationProp>();

const MakePaymentScreen = ({route}) => {
  const { package_name, package_hashrate, package_id, package_cost, package_maintenance } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('crypto');
  const [btcAddress, setBtcAddress] = useState('1A1zP1eP5QGefi2DMPtFtL5SLmv7DivfNa');
  const [amountBTC, setAmountBTC] = useState('0.0015');
  const [btcUSDValue, setBtcUSDValue] = useState('');
  const [coin, setCoin] = useState('USDT');
  const [chain, setChain] = useState('BEP20');

  const total_plan_cost = parseFloat(package_cost) + parseFloat(package_maintenance);

  useEffect(() => {
    fetchLiveBTCPrice();
  }, [amountBTC]);

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

  const fetchLiveBTCPrice = async () => {
    try {
      const btcPrice = await getBTCPrice();
      const usdEquivalent = (parseFloat(amountBTC) * btcPrice).toFixed(2);
      setBtcUSDValue(usdEquivalent);
    } catch (err) {
      console.log(err);
    }
  };

  const renderCryptoForm = () => (
    <View style={styles.formBox}>
      <Text style={styles.formTitle}>Pay with {coin} ({chain})</Text>
      <Text style={styles.formSub}>Send the exact amount to the address below. Your order will be processed after network confirmation.</Text>

      <Text style={styles.inputLabel}>Coin Type</Text>
      <View style={styles.dropdownContainer}>
        <Picker selectedValue={coin} onValueChange={setCoin} style={styles.picker}>
          {coinOptions.map((c) => (
            <Picker.Item label={c} value={c} key={c} />
          ))}
        </Picker>
      </View>

      <Text style={styles.inputLabel}>Network</Text>
      <View style={styles.dropdownContainer}>
        <Picker selectedValue={chain} onValueChange={setChain} style={styles.picker}>
          {chainOptions.map((c) => (
            <Picker.Item label={c} value={c} key={c} />
          ))}
        </Picker>
      </View>

      <Text style={styles.inputLabel}>BTC Address</Text>
      <View style={styles.inputRow}>
        <TextInput value={btcAddress} style={styles.textInput} editable={false} />
        <TouchableOpacity onPress={() => Clipboard.setString(btcAddress)}>
          <Icon name="copy-outline" size={20} color="#22D3EE" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Amount (BTC):</Text>
      <TextInput
        style={styles.textInput}
        value={amountBTC}
        onChangeText={setAmountBTC}
        keyboardType="decimal-pad"
      />
      <Text style={styles.formSub}>Equivalent to ${btcUSDValue} USD (rate may vary)</Text>

      <TouchableOpacity style={styles.qrBox}>
        <Text style={styles.qrText}>QR Code</Text>
        <Text style={styles.qrSub}>Scan QR code to pay</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8}>
        <LinearGradient
          colors={["#22D3EE", "#C084FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.confirmButton}
        >
          <View style={styles.confirmButtonInner}>
            <Text style={styles.confirmButtonText}>I've Made The Payment</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCardForm = () => (
    <View style={styles.formBox}>
      <Text style={styles.formTitle}>Pay with Credit/Debit Card</Text>
      <Text style={styles.formSub}>You’ll be redirected to a secure payment gateway to complete your transaction.</Text>
    </View>
  );

  const renderBankForm = () => (
    <View style={styles.formBox}>
      <Text style={styles.formTitle}>Pay via Bank Deposit</Text>
      <Text style={styles.formSub}>Please transfer the total amount to our bank account and upload proof of payment on the dashboard.</Text>
    </View>
  );

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'crypto': return renderCryptoForm();
      case 'card': return renderCardForm();
      case 'bank': return renderBankForm();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Make a Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ paddingHorizontal: Platform.OS === 'ios' ? 13 : 16 }}>
        {/* Order Summary */}
        <LinearGradient
          colors={["#334155", "#1E293B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orderSummary}
        >
          <View style={styles.orderSummaryContent}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{package_name} ${package_hashrate}</Text>
              <Text style={styles.summaryText}>${package_cost}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Service Fee</Text>
              <Text style={styles.summaryText}>${package_maintenance}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { fontWeight: '600' }]}>
                Total Amount Due
              </Text>
              <Text
                style={[
                  styles.summaryText,
                  { fontWeight: '600', color: '#22D3EE' },
                ]}
              >
                ${total_plan_cost}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodBox}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.key}
                onPress={() => setSelectedMethod(method.key)}
                style={[styles.methodCard, selectedMethod === method.key && styles.methodCardActive]}
              >
                <Icon
                  name={method.icon}
                  size={18}
                  color={selectedMethod === method.key ? '#06B6D4' : 'white'}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={{
                    color: selectedMethod === method.key ? '#06B6D4' : 'white',
                    fontSize: 12,
                  }}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Form */}
        {renderPaymentForm()}
      </ScrollView>
    </View>
  );
};

export default MakePaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: Platform.OS === 'ios' ? 50 : 20
  },
  topTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  orderSummary: {
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
  },
  orderSummaryContent: {
    padding: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 8,
  },
  paymentMethodBox: {
    backgroundColor: 'rgba(240,255,255,0.14)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    width: 120,
  },
  methodCardActive: {
    backgroundColor: 'rgba(240,255,255,0.2)',
    borderColor: '#06B6D4',
    borderWidth: 1,
  },
  formBox: {
    backgroundColor: 'rgba(240,255,255,0.14)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  formTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
  },
  formSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1E293B',
    color: 'white',
    padding: 10,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  qrBox: {
    backgroundColor: '#1E293B',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 16,
  },
  qrText: {
    color: 'white',
    fontSize: 16,
  },
  qrSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  confirmButton: {
    borderRadius: 10,
    marginTop: 20,
    overflow: 'hidden',
  },

  confirmButtonInner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    color: 'white',
  },
});
function setError(arg0: string) {
  throw new Error('Function not implemented.');
}

function setLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

