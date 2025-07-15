/**
 * Social Authentication Service
 * Handles Google, Facebook, and Telegram authentication
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, API_ENDPOINTS } from '../config/api';

// Social Auth Configuration
export const SOCIAL_CONFIG = {
  google: {
    webClientId: '208180617255-55cskucs1brpodjt1grruv4a5ha8p9j0.apps.googleusercontent.com', // Replace with your Google Web Client ID
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  },
  facebook: {
    appId: '562940163421308', // Replace with your Facebook App ID
    permissions: ['public_profile', 'email'],
  },
};

// Initialize Facebook SDK
export const initializeFacebookSDK = () => {
  try {
    Settings.initializeSDK();
    console.log('Facebook SDK initialized successfully');
  } catch (error) {
    console.log('Facebook SDK initialization failed:', error);
  }
};

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: '1041648646860-lmiast9jtve78qvnd1sfgsfkocoif2oa.apps.googleusercontent.com', // From google-services.json
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    console.log('Google Sign-In initialized successfully');
  } catch (error) {
    console.log('Google Sign-In initialization failed:', error);
  }
};

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices();

    // Attempt to sign in
    const userInfo = await GoogleSignin.signIn();

    console.log('Google Sign-In Success:', userInfo);

    // Extract user data
    const userData = {
      id: userInfo.user.id,
      name: userInfo.user.name,
      email: userInfo.user.email,
      photo: userInfo.user.photo,
      provider: 'google',
      accessToken: userInfo.idToken,
    };

    // Send to backend for authentication
    return await authenticateWithBackend(userData);
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);

    // Handle specific Google Sign-in errors
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
    } else if (error.code === '10' || error.message?.includes('DEVELOPER_ERROR')) {
      // DEVELOPER_ERROR - OAuth configuration issue
      throw new Error('Google Sign-in is not properly configured. Please use Facebook, Telegram, or email/password login.');
    } else {
      throw new Error(error.message || 'Google sign-in failed');
    }
  }
};

// Facebook Sign-In
export const signInWithFacebook = async () => {
  try {
    const result = await LoginManager.logInWithPermissions(SOCIAL_CONFIG.facebook.permissions);
    
    if (result.isCancelled) {
      throw new Error('Facebook sign-in was cancelled');
    }

    // Get access token
    const data = await AccessToken.getCurrentAccessToken();
    
    if (!data) {
      throw new Error('Failed to get Facebook access token');
    }

    // Fetch user profile
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${data.accessToken}`
    );
    const userProfile = await response.json();

    console.log('Facebook Sign-In Success:', userProfile);

    // Extract user data
    const userData = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      photo: userProfile.picture?.data?.url,
      provider: 'facebook',
      accessToken: data.accessToken,
    };

    // Send to backend for authentication
    return await authenticateWithBackend(userData);
  } catch (error: any) {
    console.error('Facebook Sign-In Error:', error);
    throw new Error('Facebook sign-in failed: ' + error.message);
  }
};

// Telegram Sign-In (Demo Implementation)
export const signInWithTelegram = async () => {
  try {
    // For demo purposes, we'll simulate a Telegram login
    // In a real app, you would implement Telegram OAuth flow

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Telegram Sign-In',
        'This is a demo Telegram authentication. In a real app, this would open Telegram OAuth.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('Telegram sign-in cancelled')),
          },
          {
            text: 'Demo Login',
            onPress: async () => {
              try {
                // Simulate Telegram user data
                const userData = {
                  id: 'telegram_demo_' + Date.now(),
                  name: 'Telegram Demo User',
                  email: 'telegram.demo@example.com',
                  photo: 'https://via.placeholder.com/150/0088cc/ffffff?text=TG',
                  provider: 'telegram',
                  accessToken: 'demo_telegram_token_' + Date.now(),
                };

                console.log('Telegram Demo Sign-In Success:', userData);

                // Send to backend for authentication
                const result = await authenticateWithBackend(userData);
                resolve(result);
              } catch (error: any) {
                console.error('Telegram Demo Authentication Error:', error);
                reject(error);
              }
            },
          },
        ]
      );
    });
  } catch (error: any) {
    console.error('Telegram Sign-In Error:', error);
    throw new Error('Telegram sign-in failed: ' + error.message);
  }
};

// Authenticate with backend
const authenticateWithBackend = async (userData: any) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.SOCIAL_LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        provider: userData.provider,
        providerId: userData.id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
        accessToken: userData.accessToken,
      }),
    });

    // Store authentication data
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));

    // Store referral code separately for easy access
    if (response.user.referralCode) {
      await AsyncStorage.setItem('userReferralCode', response.user.referralCode);
    }

    return response;
  } catch (error: any) {
    console.error('Backend Authentication Error:', error);
    throw new Error('Failed to authenticate with server: ' + error.message);
  }
};

// Sign out from all social providers
export const signOutFromSocial = async () => {
  try {
    // Google Sign-Out
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
        console.log('Google Sign-Out successful');
      }
    } catch (error) {
      console.log('Google Sign-Out error:', error);
    }

    // Facebook Sign-Out
    LoginManager.logOut();

    // Clear stored data
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');

    console.log('Successfully signed out from all social providers');
  } catch (error: any) {
    console.error('Social Sign-Out Error:', error);
    throw new Error('Failed to sign out: ' + error.message);
  }
};

// Check if user is signed in to any social provider
export const checkSocialSignInStatus = async () => {
  try {
    let isGoogleSignedIn = false;
    try {
      isGoogleSignedIn = await GoogleSignin.isSignedIn();
    } catch (error) {
      console.log('Google Sign-in status check error:', error);
      isGoogleSignedIn = false;
    }
    const token = await AsyncStorage.getItem('userToken');

    return {
      isSignedIn: isGoogleSignedIn || !!token,
      hasToken: !!token,
      googleSignedIn: isGoogleSignedIn,
    };
  } catch (error: any) {
    console.error('Check Social Sign-In Status Error:', error);
    return {
      isSignedIn: false,
      hasToken: false,
      googleSignedIn: false,
    };
  }
};

export default {
  initializeFacebookSDK,
  initializeGoogleSignIn,
  signInWithGoogle,
  signInWithFacebook,
  signInWithTelegram,
  signOutFromSocial,
  checkSocialSignInStatus,
};
