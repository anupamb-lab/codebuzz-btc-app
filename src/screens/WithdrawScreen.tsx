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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useAuth } from "../auth/AuthProvider";
import { get_data_uri } from "../config/api";

const currencies = [
  "USD - United States Dollar",
  "BTC - Bitcoin",
  "USDT - BEP20",
  "USDC - BEP20",
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
    await getBTCPrice();
    await fetchBalance();
    setRefreshing(false);
  };

  const fetchBalance = async () => {
    try {
      const url = `${get_data_uri("GET_WALLET_BALANCE")}?userId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.balance) {
        let usdValue = parseFloat(data.balance.USD ?? "0");

        // Convert BTC → USD
        const btcVal = parseFloat(
          data.balance.BTC?.$numberDecimal ?? data.balance.BTC ?? "0"
        );
        if (!isNaN(btcVal)) {
          usdValue += btcVal * btcPrice;
        }

        // Convert USDT/USDC → USD
        const usdtVal = parseFloat(
          data.balance.USDT?.$numberDecimal ?? data.balance.USDT ?? "0"
        );
        const usdcVal = parseFloat(
          data.balance.USDC?.$numberDecimal ?? data.balance.USDC ?? "0"
        );

        usdValue += isNaN(usdtVal) ? 0 : usdtVal;
        usdValue += isNaN(usdcVal) ? 0 : usdcVal;

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
    } catch (err) {
      console.error("Error fetching BTC price:", err.message);
    }
  };

  // Validation
  const amountNum = parseFloat(amount || "0");
  const exceedsBalance = amountNum > balanceUSD;
  const belowMin = amountNum < 10;

  // Auto-set method
  useEffect(() => {
    if (currency === "USD - United States Dollar") {
      setMethod("Bank Transfer");
    } else {
      setMethod("Crypto");
    }
  }, [currency]);

  // Handle Withdraw
  const handleWithdraw = async () => {
    if (exceedsBalance) {
      alert("Insufficient balance.");
      return;
    }
    if (belowMin) {
      alert("Minimum withdrawal is $10.");
      return;
    }

    try {
      const res = await fetch(get_data_uri("CREATE_WITHDRAWAL"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          asset: currency.split(" - ")[0],
          chain: method === "Crypto" ? currency.split(" - ")[0] : "BANK",
          toAddress: notes,
          amountNumeric: amountNum,
        }),
      });

      if (res.ok) {
        alert("Withdrawal request created successfully!");
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
            <Text style={styles.dropdownText}>{currency}</Text>
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
                key={item}
                onPress={() => {
                  setCurrency(item);
                  setCurrencyDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownOption}>{item}</Text>
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
