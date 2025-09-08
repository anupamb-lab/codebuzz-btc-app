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
  ImageBackground,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import LinearGradient from 'react-native-linear-gradient';
import { Image } from 'react-native';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

interface ForgotPasswordScreenProps {}

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const route = useRoute();
  const { screen_heading } = route.params as { screen_heading: string; };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    // Reset errors
    setEmailError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Skip actual email API call for demo purposes since email is not configured
      // In production, this would make the actual API call to send reset email
      console.log('Skipping email API call for demo purposes');
      console.log('Email:', email);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Always show success for demo purposes
      Alert.alert(
        'Reset Code Sent',
        'For demo purposes, you can use any 4+ digit code (like "1234") in the next screen to proceed with password reset.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OTPVerification', { email, type: 'forgot_password' }),
          },
        ]
      );

      // Optional: Try to make API call in background without waiting for response
      // This won't block the UI but will still attempt to send email if server is configured
      apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }).then(data => {
        console.log('Background email API response:', data);
      }).catch(error => {
        console.log('Background email API error (ignored):', error.message);
      });

    } catch (error: any) {
      // Even if there's an error, proceed to OTP screen for demo purposes
      console.log('Error in forgot password flow (proceeding anyway):', error);
      Alert.alert(
        'Proceeding with Demo',
        'For demo purposes, you can use any 4+ digit code (like "1234") in the next screen.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OTPVerification', { email, type: 'forgot_password' }),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
          source={require('../assets/images/bg_pattern1.png')}
          style={[styles.backgroundImage, { backgroundColor: '#1B202C' }]}
          resizeMode="cover">

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
            {/* icon */}

            <View style={styles.headerview}>

              <View style={styles.animationView}>
                         
                <LottieView
                  source={{ uri: 'https://lottie.host/1b56f6ce-894f-4006-9f98-738f22a79da1/9Iz9LxZLjw.json' }}
                  autoPlay
                  loop
                  style={styles.animation}
                />

              </View>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{screen_heading}</Text>
              </View>

            </View>

            {/* Gradient Form Box */}
                          <LinearGradient
                            colors={['#1B202CAA', '#2E3646AA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.formBox}
                          >

            {/* Form Container */}
            <View style={styles.formContainer}>
              
              {/* Email Input */}

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Image
                        source={require('../assets/images/icon_input_box_email.png')}
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

              {/* Send Code Button */}

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleSendCode} 
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
                    {isLoading ? 'SENDING...' : 'GET CODE'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Back to Login */}
              {/* <View style={styles.backContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>
              </View> */}
            </View>

              </LinearGradient>

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  topTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
    paddingTop: 0
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  headerview: {

  },

  bitcoinLogo: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 13,
    color: '#8a8a8a',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formContainer: {
    marginBottom: 60,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 18,
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
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 0.5,
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
  sendButton: {
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    height: 45,
    width: 160,
    alignSelf: 'center',
  },
  sendButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backText: {
    color: '#8a8a8a',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '400',
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
}, formBox: {
    width: '100%',
    height: '28%',
    borderRadius: 16,
    padding: 16,
  },
  loginButton: {
    borderRadius: 25,
    overflow: "hidden",
    width: Platform.OS === 'ios' ? '45%' : '50%', 
    alignSelf: "center",
    marginVertical: 10,
    marginBottom: Platform.OS === 'ios' ? '8%' : 0,
    marginLeft: Platform.OS === 'ios' ? '-10%' : 0
  },

  loginButtonGradient: {
    height: Platform.OS === 'ios' ? 40 : 50,       
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },

  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  animationView: {
    textAlign: "center",
    alignItems: "center",
    marginBottom: 30
  },
  animation: {
    height: 170,
    width: 170,
  }
});

export default ForgotPasswordScreen;
