import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import { testApiConnectivity, getApiInfo } from '../utils/testApi';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { Image } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
const { width, height } = Dimensions.get('window');

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Initialize Google Sign-In when component mounts
  // React.useEffect(() => {
  //   initializeGoogleSignIn();
  // }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      // Call backend API using new configuration
      const data = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
        }),
      });

      setIsLoading(false);

      if (data.success) {
        console.log("Login Success Data: ", data);

        // Check if user's email is verified
        if (data.user && data.user.emailVerified) {
          // Email verified - authenticate user and go to referral screen
          await login(data.token, data.user);
          navigation.replace('ReferralScreen', {
                token: data?.token,
                user: data.user,
                fromLogin: false
              });
        } else {
          // Email not verified - go to TwofactorOTP (or dashboard based on your preference)
          navigation.replace('TwofactorOTP', {
            token: data.token,
            user: data.user,
          });
        }
      } else {
        console.log("Login Failed Data: ", data);

        // Check if email verification is required (status 403)
        if (data.emailVerified === false && data.user) {
          console.log("Redirecting to email verification screen");
          // Direct redirect to email verification screen without alert
          navigation.replace('OTPVerification', {
            email: email.toLowerCase(),
            type: 'email_verification',
            user: data.user,
            fromLogin: true
          });
        } else {
          Alert.alert('Error', data.message || 'Login failed');
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Network error. Please check your connection.');
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('SignUp' as never);
  };

  const handleTestApi = async () => {
    const apiInfo = getApiInfo();
    const result = await testApiConnectivity();

    Alert.alert(
      'API Test Result',
      `URL: ${result.url}\nStatus: ${result.success ? 'Connected' : 'Failed'}\nMessage: ${result.message}\n\nConfig: ${apiInfo.isLocal ? 'Local' : 'Production'}`,
      [{ text: 'OK' }]
    );
  };

  const handleSocialLoginSuccess = async (userData: any) => {
    try {
      // Authenticate user with the auth context
      await login(userData.token, userData.user);

      // Always navigate to referral screen after social login
      Alert.alert(
        'Login Successful',
        `Welcome ${userData.user?.name || 'User'}!`,
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.replace('ReferralScreen', {
                token: userData.user?.token,
                user: userData.user,
                fromLogin: false
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Social login success handler error:', error);
      Alert.alert('Error', 'Failed to complete login. Please try again.');
    }
  };

  const handleSocialLoginError = (error: string) => {
    Alert.alert('Social Login Error', error, [{ text: 'OK' }]);
  };

  const handleResendVerification = async (email: string) => {
    try {
      const data = await apiRequest(API_ENDPOINTS.RESEND_VERIFICATION, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (data.success) {
        Alert.alert(
          'Success',
          'Verification email sent successfully. Please check your email.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/bg_pattern1.png')}
      style={[styles.backgroundImage, { backgroundColor: '#1B202C' }]}
      resizeMode="cover">

      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.content}>
            {/* Bitcoin Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.bitcoinLogo}>
                <Image
                  source={require('../assets/images/main_app_icon.png')}
                  style={styles.bitcoinImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoTagline}>Cloud Mining Made Simple</Text>
            </View>

            <View style={styles.screenContainer}>
              {/* Gradient Form Box */}
              <LinearGradient
                colors={['#1B202CAA', '#2E3646AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formBox}
              >

                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../assets/images/icon_input_box_user.png')}
                        style={styles.inputIconImage}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="EMAIL"
                        placeholderTextColor="#aaaaaa"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError('');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor="#00d4ff"
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../assets/images/icon_input_box_pass.png')}
                        style={styles.inputIconImage}
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="PASSWORD"
                        placeholderTextColor="#aaaaaa"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError('');
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor="#00d4ff"
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin} 
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2ACFEF', '#BD85FC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButtonGradient}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'SIGNING IN...' : 'LOG IN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Sign Up Link */}
                  <TouchableOpacity style={styles.signUpContainer} onPress={handleSignUpPress}>
                    <Text style={styles.signUpText}>
                      Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={() => navigation.navigate('ForgotPassword', {screen_heading: 'Forgot Password'})}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>


              </LinearGradient>

              {/* <SocialLoginButtons
                onSuccess={handleSocialLoginSuccess}
                onError={handleSocialLoginError}
                disabled={isLoading}
              /> */}

            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>BitPlayPro</Text>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  formBox: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    minHeight: Platform.OS === 'ios' ? "58%" : "45%",
  },

  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, 
    paddingHorizontal: 20, 
    paddingVertical: 30
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: '15%',
  },

  bitcoinLogo: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bitcoinImage: {
    width: '100%',
    height: '100%',
  },
  bitcoinSymbol: {
    fontSize: 80,
    color: '#8b45ff',
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 1,
    marginTop: 30
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 55,
    width: Platform.OS === 'ios' ? '90%' : '100%'
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#8a8a8a',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
    margin: 0,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
  loginButton: {
    borderRadius: 25,
    overflow: "hidden",
    width: Platform.OS === 'ios' ? '45%' : '50%', 
    alignSelf: "center",
    marginVertical: 10,
    marginBottom: Platform.OS === 'ios' ? '10%' : "5%",
    marginLeft: Platform.OS === 'ios' ? '-10%' : 0,
    marginTop: 30
  },

  loginButtonGradient: {
    height: Platform.OS === 'ios' ? 40 : 50,       
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },

  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loginButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    marginLeft: Platform.OS === 'ios' ? '-10%' : 0
  },
  forgotPasswordText: {
    color: '#42B0FF',
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: Platform.OS === 'ios' ? '8%' : 0
  },
  signUpContainer: {
    alignItems: 'center',
    marginLeft: Platform.OS === 'ios' ? '-10%' : 0
  },
  signUpText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
  },
  signUpLink: {
    color: '#42B0FF',
    fontWeight: '600',
  },
  socialContainer: {
    alignItems: 'center'
  },
  socialText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 20,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  facebookButton: {
    backgroundColor: '#3b5998',
  },
  googleButton: {
    backgroundColor: '#dd4b39',
  },
  linkedinButton: {
    backgroundColor: '#0077b5',
  },
  socialIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '400',
  },
  testApiButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  testApiText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  inputIconImage: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  logoTagline: {
    fontSize: 16,
    color: '#42B0FF',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  }
});

export default LoginScreen;
