import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const currencies = ['USD - United States Dollar', 'BTC - Bitcoin', 'USDT - TRC20'];
const methods = ['Bank Transfer', 'Crypto', 'Payment Gateway'];

const DepositScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [method, setMethod] = useState(methods[0]);
  const [notes, setNotes] = useState('');

  const [currencyDropdownVisible, setCurrencyDropdownVisible] = useState(false);
  const [methodDropdownVisible, setMethodDropdownVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Deposit</Text>
        <TouchableOpacity style={styles.profileCircle} onPress={() => {
            navigation.navigate('MyProfileScreen')
        }}>
          <Text style={styles.profileInitial}>JD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Deposit Details Box */}
        <View style={styles.box}>
          <Text style={styles.boxHeading}>Deposit Details</Text>

          <Text style={styles.label}>Amount to Deposit</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g., 500.00"
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {/* Currency Dropdown */}
          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setCurrencyDropdownVisible(true)}>
            <Text style={styles.dropdownText}>{currency}</Text>
            <Icon name="arrow-drop-down" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* Method Dropdown */}
          <Text style={styles.label}>Deposit Method</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setMethodDropdownVisible(true)}>
            <Text style={styles.dropdownText}>{method}</Text>
            <Icon name="arrow-drop-down" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.label}>Transaction Reference / Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Bank confirmation number, specific instructions"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
          />

          {/* Confirm Button */}
          <TouchableOpacity onPress={() => console.log('Deposit confirmed')}>
            <LinearGradient
              colors={['#9333EA', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>Confirm Deposit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Important Notes */}
        <View style={styles.box}>
          <Text style={styles.boxHeading}>Important Notes for Deposit</Text>
          {[
            'Deposits may take 1-5 business days to clear depending on the method.',
            'Please ensure the name on the deposit account matches your wallet name.',
            'Minimum deposit amount is $5.00.',
            'For Crypto deposits, double-check the wallet address and network.',
          ].map((note, i) => (
            <View key={i} style={styles.noteItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal transparent visible={currencyDropdownVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setCurrencyDropdownVisible(false)}
        >
          <View style={styles.modalDropdown}>
            {currencies.map((item, index) => (
              <TouchableOpacity
                key={index}
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

      {/* Method Modal */}
      <Modal transparent visible={methodDropdownVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMethodDropdownVisible(false)}
        >
          <View style={styles.modalDropdown}>
            {methods.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setMethod(item);
                  setMethodDropdownVisible(false);
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

export default DepositScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15213B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topBarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollView: {
    padding: 16,
  },
  box: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  boxHeading: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: '#F1F5F9',
    marginBottom: 15
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  dropdownText: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  confirmButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bullet: {
    color: '#CBD5E1',
    marginRight: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  noteText: {
    color: '#CBD5E1',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 32,
  },
  modalDropdown: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
  },
  dropdownOption: {
    padding: 12,
    color: '#E2E8F0',
    fontSize: 14,
  },
});
