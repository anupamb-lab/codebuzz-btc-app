import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSession, saveSession, clearSession, getUser, logoutApi } from './auth';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth, {
  AppleRequestOperation,
  AppleRequestScope,
} from '@invertase/react-native-apple-authentication';

type AuthContextType = {
  authenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (token: string, user: object) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const token = await getSession();
      const userData = await getUser();
      setAuthenticated(!!token);
      setUser(userData);
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (token: string, user: object) => {
    await saveSession(token, user);
    setAuthenticated(true);
    setUser(user);
  };

  const logout = async () => {
    try {
      await logoutApi();
      await auth().signOut();
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('Server logout failed, clearing session anyway.');
    } finally {
      await clearSession();
      setAuthenticated(false);
      setUser(null);
    }
  };

  /** -------------------
   *  GOOGLE LOGIN
   *  ------------------- */
  const loginWithGoogle = async () => {
    try {
      // Ensure Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in and get ID token
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) throw new Error('Google Sign-In failed: No ID token returned.');

      // Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;

      const token = await firebaseUser.getIdToken();
      const userData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photo: firebaseUser.photoURL,
        provider: 'google',
      };

      await saveSession(token, userData);
      setAuthenticated(true);
      setUser(userData);
    } catch (error: any) {
      console.error('Google login failed:', error);
    }
  };

  /** -------------------
   *  APPLE LOGIN
   *  ------------------- */
  const loginWithApple = async () => {
    try {
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: AppleRequestOperation.LOGIN,
        requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
      });

      if (!appleAuthResponse.identityToken) {
        throw new Error('Apple Sign-In failed: No identity token.');
      }

      // Create a Firebase credential with the token
      const { identityToken, nonce } = appleAuthResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(appleCredential);
      const firebaseUser = userCredential.user;

      const token = await firebaseUser.getIdToken();
      const userData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        provider: 'apple',
      };

      await saveSession(token, userData);
      setAuthenticated(true);
      setUser(userData);
    } catch (error: any) {
      console.error('Apple login failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, loading, user, login, logout, loginWithGoogle, loginWithApple }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
