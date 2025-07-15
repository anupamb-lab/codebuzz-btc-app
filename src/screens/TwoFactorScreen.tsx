import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../components/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'TwoFactorScreen'>;

const TwoFactorScreen = () => {
 const navigation = useNavigation<NavigationProp>();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // default, ideally fetch from API

  const handleToggle2FA = () => {
    const newStatus = !is2FAEnabled;
    setIs2FAEnabled(newStatus);
    Alert.alert(
      'Two-Factor Authentication',
      newStatus ? '2FA has been enabled.' : '2FA has been disabled.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={['#1B202CAA', '#2E3646AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.title}>Two-Factor Authentication (2FA)</Text>

        <Text style={styles.description}>
          {is2FAEnabled
            ? 'You have enabled Two-Factor Authentication. Your account is now more secure.'
            : 'You have not enabled Two-Factor Authentication. Enable it to add an extra layer of security to your account.'}
        </Text>

        <LinearGradient
          colors={['#2ACFEF', '#BD85FC']}
          style={styles.buttonContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.buttonInner} onPress={handleToggle2FA}>
            <Text style={styles.buttonText}>
              {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    backgroundColor: '#0F172A', // Matches your theme
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    color: '#4ACDFC',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'center',
    width: 200,
  },
  buttonInner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TwoFactorScreen;
