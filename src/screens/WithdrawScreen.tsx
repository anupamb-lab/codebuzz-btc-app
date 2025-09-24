import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  RefreshControl,
  Platform,
  Alert,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useAuth } from "../auth/AuthProvider";
import { get_data_uri } from "../config/api";

const currencies = [
  { code: "USD", label: "United States Dollar", method: "Bank Transfer", redirect: "BankTransferPage" },
  { code: "BTC", label: "Bitcoin", method: "Crypto", redirect: "BitcoinPage" },
  { code: "BTC", label: "SpeedWallet", method: "Crypto", redirect: "SpeedWalletPage" },
  { code: "BTC", label: "ZDB-Wallet", method: "Crypto", redirect: "ZdbWalletPage" },
  { code: "BTC", label: "MUUN", method: "Crypto", redirect: "MuunWalletPage" },
  { code: "USDT", label: "BEP20", method: "Crypto", redirect: "UsdtPage" },
  { code: "USDC", label: "BEP20", method: "Crypto", redirect: "UsdcPage" },
];

const WithdrawScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(currencies[0]);
  const [method, setMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");

  const [currencyDropdownVisible, setCurrencyDropdownVisible] = useState(false);

  const { user } = useAuth();
  const initials = user?.name ? user.name[0].toUpperCase() : "U";

  const [balanceUSD, setBalanceUSD] = useState(0);
  const [btcPrice, setBtcPrice] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch wallet balance when screen loads
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    const btc_price = await getBTCPrice();
    await fetchBalance(btc_price);
    setRefreshing(false);
  };

  const fetchBalance = async (btc_price: any) => {
    try {
      const url = `${get_data_uri("GET_WALLET_BALANCE")}?userId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("User Balance: ", data);

      if (res.ok && data.balance) {
        let usdValue = parseFloat(data.balance.USD ?? "0");

        // Convert BTC → USD
        const btcVal = parseFloat(
          data.balance.BTC?.$numberDecimal ?? data.balance.BTC ?? "0"
        );
        if (!isNaN(btcVal)) {
          usdValue += btcVal * btc_price;
        }

        // Convert USDT/USDC → USD
        const usdtVal = parseFloat(
          data.balance.USDT?.$numberDecimal ?? data.balance.USDT ?? "0"
        );
        const usdcVal = parseFloat(
          data.balance.USDC?.$numberDecimal ?? data.balance.USDC ?? "0"
        );
        const btcDepVal = parseFloat(
          data.balance.BTC_DEPOSIT?.$numberDecimal ?? data.balance.BTC_DEPOSIT ?? "0"
        );

        usdValue += isNaN(usdtVal) ? 0 : usdtVal;
        usdValue += isNaN(usdcVal) ? 0 : usdcVal;

        if (!isNaN(btcDepVal)) {
          usdValue += btcDepVal * btc_price;
        }

        console.log("User Balance - USDValue: ", usdValue);

        setBalanceUSD(usdValue);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  const getBTCPrice = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        { params: { ids: "bitcoin", vs_currencies: "usd" } }
      );
      setBtcPrice(res.data.bitcoin.usd);
      return res.data.bitcoin.usd;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching BTC price:", err.message);
      } else {
        console.error("Unknown error fetching BTC price:", err);
      }
    }
  };

  // Validation
  const amountNum = parseFloat(amount || "0");
  const exceedsBalance = amountNum > balanceUSD;
  const belowMin = amountNum < 10;

  // Auto-set method
  useEffect(() => {
    setMethod(currency.method);
  }, [currency]);

  // Handle Withdraw
  const handleWithdraw = async () => {
    // if (exceedsBalance) {
    //   alert("Insufficient balance.");
    //   return;
    // }
    // if (belowMin) {
    //   alert("Minimum withdrawal is $10.");
    //   return;
    // }

    try {
      const res = await fetch(get_data_uri("CREATE_WITHDRAWAL"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          asset: currency.code,
          chain: method === "Crypto" ? currency.code : "BANK",
          toAddress: notes,
          amountNumeric: amountNum,
        }),
      });

      if (res.ok) {

        if (currency.redirect) {
          if (currency.label === 'SpeedWallet') {
            handle_speed_wallet(amountNum, user.id, notes);
          } else {
            alert("Please Use SpeedWallet, rest under development!");
          }

          // navigation.navigate(currency.redirect);
          alert("Withdrawal request created successfully!");

        } else {
          navigation.goBack(); // fallback
        }

        navigation.goBack();
      } else {
        const err = await res.json();
        alert("Failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Withdraw</Text>
        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => navigation.navigate("MyProfileScreen")}
        >
          <Text style={styles.profileInitial}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        <View style={styles.box}>
          <Text style={styles.boxHeading}>Withdraw Details</Text>

          {/* Amount */}
          <Text style={styles.label}>Amount to Withdraw</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g., 500.00"
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
            style={[
              styles.input,
              exceedsBalance && { borderColor: "red", borderWidth: 1 },
            ]}
          />
          {exceedsBalance && (
            <Text style={{ color: "red", marginTop: 4 }}>
              Max withdrawable: ${balanceUSD.toFixed(2)}
            </Text>
          )}
          {belowMin && (
            <Text style={{ color: "orange", marginTop: 4 }}>
              Minimum withdrawal amount is $10
            </Text>
          )}

          {/* Currency Dropdown */}
          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setCurrencyDropdownVisible(true)}
          >
            <Text style={styles.dropdownText}>{`${currency.code} - ${currency.label}`}</Text>
            <Icon name="arrow-drop-down" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* Withdraw Method (auto-selected) */}
          <Text style={styles.label}>Withdraw Method</Text>
          <View style={[styles.dropdownTrigger, { backgroundColor: "#334155" }]}>
            <Text style={styles.dropdownText}>{method}</Text>
          </View>

          {/* Notes */}
          <Text style={styles.label}>Account Details / Wallet Address</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter bank account or wallet address"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textArea]}
            multiline
          />

          {/* Confirm Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWithdraw}
            style={{ borderRadius: 10, overflow: "hidden", marginTop: 12 }}
          >
            <LinearGradient
              colors={["#9333EA", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>Confirm Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal
        transparent
        visible={currencyDropdownVisible}
        animationType="fade"
        onRequestClose={() => setCurrencyDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setCurrencyDropdownVisible(false)}
        >
          <View style={styles.modalDropdown}>
            {currencies.map((item) => (
              <TouchableOpacity
                key={`${item.code}-${item.label}`}
                onPress={() => {
                  setCurrency(item);
                  setCurrencyDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownOption}>{`${item.code} - ${item.label}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#15213B" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  topBarTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: { color: "white", fontWeight: "bold", fontSize: 14 },
  scrollView: { padding: 16 },
  box: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  boxHeading: { color: "#E2E8F0", fontSize: 16, fontWeight: "600", marginBottom: 16 },
  label: { color: "#CBD5E1", fontSize: 14, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    color: "#F1F5F9",
    marginBottom: 15,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  dropdownText: { color: "#F1F5F9", fontSize: 14 },
  confirmButton: { justifyContent: "center", alignItems: "center", minHeight: 48 },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 32,
  },
  modalDropdown: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
  },
  dropdownOption: {
    padding: 12,
    color: "#E2E8F0",
    fontSize: 14,
  },
});

async function handle_speed_withdraw(inv_id: any) {
  try {
    const speed_payment_uri = get_data_uri("PROCESS_SPEED_TRANSACTION");

    console.log("SpeedWallet - PaymentURI: ", speed_payment_uri);

    const response = await fetch(speed_payment_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice: inv_id,
      }),
    });

    console.log("SpeedWallet - PaymentRESPONSE: ", response);

    const data = await response.json();

    console.log("SpeedWallet - PaymentRESPONSE-DATA: ", data);

  } catch (error) {
    console.error('Speed Wallet error:', error);
    Alert.alert('Error', 'Something went wrong while initiating Speed Wallet.');
  }
}

function isValidSpeedLN(address: string) {
  const regex = /^[a-zA-Z0-9_-]+@speed\.app$/;
  return regex.test(address);
}

async function handle_speed_wallet(amountUSD: any, userId: any, speed_wallet_address: any) {
  try {
    const speed_wallet_uri = get_data_uri("CREATE_SPEED_TRANSACTION");

    console.log("SpeedWallet - URI: ", speed_wallet_uri);

    const new_speed_wallet = speed_wallet_address.lower()

    const is_speed_valid = isValidSpeedLN(new_speed_wallet);

    console.log("SpeedWallet - WalletAddress: ", new_speed_wallet);

    if (!is_speed_valid) {
      alert('Please enter a valid speed wallet address');
      return;
    }

    const response = await fetch(speed_wallet_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountUSD,
        currency: 'USD',
        target_currency: 'SATS',
        payment_methods: ['lightning'],
        metadata: { user_id: userId },
        speed_wallet_address: new_speed_wallet
      }),
    });

    console.log("SpeedWallet - RESPONSE: ", response);

    const data = await response.json();

    console.log("SpeedWallet - RESPONSE-DATA: ", data);

    // if (!data || !data.payment_method_options?.lightning?.payment_request) {
    //   Alert.alert('Error', 'Unable to create Speed payment.');
    //   return;
    // }

    // const paymentRequest = data.payment_method_options.lightning.payment_request;
    // const deepLink = `speed://pay?invoice=${encodeURIComponent(paymentRequest)}`;

    // console.log("SpeedWallet - PAYMENT-REQ: ", paymentRequest);
    // console.log("SpeedWallet - DEEPLINK: ", deepLink);

    // handle_speed_withdraw(paymentRequest);

    // const supported = await Linking.canOpenURL(deepLink);
    // if (supported) {
    //   await Linking.openURL(deepLink);
    // } else {
    //   Alert.alert(
    //     'Speed Wallet Not Installed',
    //     'Please install Speed Wallet to complete the withdrawal.'
    //   );
    // }

  } catch (error) {
    console.error('Speed Wallet error:', error);
    Alert.alert('Error', 'Something went wrong while initiating Speed Wallet.');
  }
}

