// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { initializeGoogleAds } from './src/services/googleAds';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import TwofactorOTP from './src/screens/TwofactorOTP';
import ReferralScreen from './src/screens/referral_code';
import { RootStackParamList } from './src/components/types';
import AllActivity from './src/screens/AllActivity';
import InternalReferralScreen from './src/screens/MainReferralScreen';
import WalletScreen from './src/screens/Wallet';
import DepositScreen from './src/screens/DepositScreen';
import WithdrawScreen from './src/screens/WithdrawScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import FAQScreen from './src/screens/FAQScreen';
import SupportScreen from './src/screens/SupportScreen';
import StoreScreen from './src/screens/Store';
import MakePaymentScreen from './src/screens/PaymentScreen';
import CustomQuote from './src/screens/CustomQuote';
import DeleteAccountScreen from './src/screens/DeleteAccount';
import NotificationScreen from './src/screens/NotificationsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import WatchVideoScreen from './src/screens/WatchVideoScreen';
import TwoFactorScreen from './src/screens/TwoFactorScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import DailyRewardsScreen from './src/screens/DailyRewardsScreen';
import CryptoDepositScreen from './src/screens/CryptoDepositScreen';
import BalanceHistoryScreen from './src/screens/BalanceHistoryScreen';
import { HashPowerProvider } from "./src/stores/HashPowerStore";

import messaging from '@react-native-firebase/messaging';

const RootStack = createStackNavigator<RootStackParamList>();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FirebaseLG - Message handled in the background:', remoteMessage);
});

const AppNavigator = () => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {authenticated ? (
        <>
        <RootStack.Screen name="Main" component={MainTabNavigator} />
        <RootStack.Screen name="BalanceHistoryScreen" component={BalanceHistoryScreen} />
        <RootStack.Screen name="DailyRewardsScreen" component={DailyRewardsScreen} />
        <RootStack.Screen name="MyProfileScreen" component={MyProfileScreen} />
        <RootStack.Screen name="AllActivity" component={AllActivity} />
        <RootStack.Screen name="InternalReferral" component={InternalReferralScreen} />
        <RootStack.Screen name="Store" component={StoreScreen} />
        <RootStack.Screen name="Wallet" component={WalletScreen} />
        <RootStack.Screen name="DepositScreen" component={DepositScreen} />
        <RootStack.Screen name="CryptoDepositScreen" component={CryptoDepositScreen} />
        <RootStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
        <RootStack.Screen name="FAQScreen" component={FAQScreen} />
        <RootStack.Screen name="SupportScreen" component={SupportScreen} />
        <RootStack.Screen name="MakePaymentScreen" component={MakePaymentScreen} />
        <RootStack.Screen name="CustomQuote" component={CustomQuote} />
        <RootStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <RootStack.Screen name="NotificationScreen" component={NotificationScreen} />
        <RootStack.Screen name="AchievementsScreen" component={AchievementsScreen} />
        <RootStack.Screen name="WatchVideoScreen" component={WatchVideoScreen} />
        <RootStack.Screen name="TwoFactorScreen" component={TwoFactorScreen} />
        <RootStack.Screen name="NotificationPreferencesScreen" component={NotificationPreferencesScreen} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <RootStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <RootStack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
        <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <RootStack.Screen name="ReferralScreen" component={ReferralScreen} />
        </>
      ) : (
        <>
          <RootStack.Screen name="SignUp" component={SignUpScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <RootStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <RootStack.Screen name="TwofactorOTP" component={TwofactorOTP} />
          <RootStack.Screen name="ReferralScreen" component={ReferralScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Firebase Authorization status:', authStatus);
    }
  }

  useEffect(() => {
    // Initialize social SDKs
    initializeGoogleAds();
    requestUserPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FirebaseLG - Foreground message received:', remoteMessage);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <HashPowerProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </NavigationContainer>
      </HashPowerProvider>
    </AuthProvider>
  );
};

export default App;
