import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../components/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type NavigationProp = StackNavigationProp<RootStackParamList, 'TwoFactorScreen'>;

const TwoFactorScreen = () => {
 const navigation = useNavigation<NavigationProp>();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleToggle2FA = () => {
    const newStatus = !is2FAEnabled;
    setIs2FAEnabled(newStatus);
    Alert.alert(
      'Two-Factor Authentication',
      newStatus ? '2FA has been enabled.' : '2FA has been disabled.'
    );

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar stays fixed */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content scrolls below it */}
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

          <TouchableOpacity
            onPress={handleToggle2FA}
            activeOpacity={0.8}
            style={{ borderRadius: 12, overflow: 'hidden', marginTop: 20 }}
          >
            <LinearGradient
              colors={['#2ACFEF', '#BD85FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonContainer}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>
                  {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: Platform.OS === 'ios' ? 0 : 24,
    
    flexGrow: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: Platform.OS === 'ios' ? 0 : 20,
    marginHorizontal: Platform.OS === 'ios' ? 16: 0,
    elevation: 3,
    paddingTop: 25,
    minHeight: Platform.OS === 'ios' ? '33%' : '25%'
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
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Platform.OS === 'ios' ? 20 : 0,
    marginRight: Platform.OS === 'ios' ? 20 : 0,
  },

  buttonInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 70 : 30
  },
});

export default TwoFactorScreen;
