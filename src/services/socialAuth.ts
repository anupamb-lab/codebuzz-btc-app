/**
 * Social Authentication Service
 * Handles Google, Facebook, and LinkedIn authentication
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, API_ENDPOINTS } from '../config/api';

// Social Auth Configuration
export const SOCIAL_CONFIG = {
  google: {
    webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID', // Replace with your Google Web Client ID
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  },
  facebook: {
    appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your Facebook App ID
    permissions: ['public_profile', 'email'],
  },
  linkedin: {
    clientId: 'YOUR_LINKEDIN_CLIENT_ID', // Replace with your LinkedIn Client ID
    redirectUri: 'https://your-app.com/auth/linkedin/callback',
    scopes: ['r_liteprofile', 'r_emailaddress'],
  },
};

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  GoogleSignin.configure(SOCIAL_CONFIG.google);
};

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
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
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
    } else {
      throw new Error('Google sign-in failed: ' + error.message);
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

// LinkedIn Sign-In (using demo implementation)
export const signInWithLinkedIn = async () => {
  try {
    // For demo purposes, we'll simulate a LinkedIn login
    // In a real app, you would implement OAuth flow with WebView

    return new Promise((resolve, reject) => {
      Alert.alert(
        'LinkedIn Sign-In',
        'This is a demo LinkedIn authentication. In a real app, this would open LinkedIn OAuth.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('LinkedIn sign-in cancelled')),
          },
          {
            text: 'Demo Login',
            onPress: async () => {
              try {
                // Simulate LinkedIn user data
                const userData = {
                  id: 'linkedin_demo_' + Date.now(),
                  name: 'LinkedIn Demo User',
                  email: 'linkedin.demo@example.com',
                  photo: 'https://via.placeholder.com/150/0077b5/ffffff?text=LI',
                  provider: 'linkedin',
                  accessToken: 'demo_linkedin_token_' + Date.now(),
                };

                console.log('LinkedIn Demo Sign-In Success:', userData);

                // Send to backend for authentication
                const result = await authenticateWithBackend(userData);
                resolve(result);
              } catch (error: any) {
                reject(error);
              }
            },
          },
        ]
      );
    });
  } catch (error: any) {
    console.error('LinkedIn Sign-In Error:', error);
    throw new Error('LinkedIn sign-in failed: ' + error.message);
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
    if (await GoogleSignin.isSignedIn()) {
      await GoogleSignin.signOut();
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
    const isGoogleSignedIn = await GoogleSignin.isSignedIn();
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
  initializeGoogleSignIn,
  signInWithGoogle,
  signInWithFacebook,
  signInWithLinkedIn,
  signOutFromSocial,
  checkSocialSignInStatus,
};
