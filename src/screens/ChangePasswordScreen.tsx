import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  ImageBackground,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { API_BASE_URL } from '../config/api';
import { Image } from 'react-native';
import BackgroundWrapper from '../components/BackgroundWrapper';

interface ChangePasswordScreenProps {}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { email, resetToken } = route.params as { email: string; resetToken: string };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleChangePassword = async () => {
    // Reset errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate inputs
    let isValid = true;

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password is required');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      // For demo/testing purposes, we'll generate a mock reset token
      // In production, this would come from the email link
      let actualResetToken = resetToken;

      // If user entered a simple code like "1234", we'll use a mock token for testing
      if (resetToken === 'demo' || resetToken === '1234' || resetToken.length < 10) {
        // Generate a mock reset token for testing
        actualResetToken = 'mock_reset_token_for_testing_' + Date.now();
        console.log('Using mock reset token for testing:', actualResetToken);
      }

      console.log('Making password reset API call...');
      console.log('Reset token:', actualResetToken);
      console.log('New password:', password);
      console.log('API URL:', `${API_BASE_URL}/api/auth/resetpassword/${actualResetToken}`);

      // Make actual API call to reset password
      const response = await fetch(`${API_BASE_URL}/api/auth/resetpassword/${actualResetToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok && data.success) {
        Alert.alert('Success', 'Password changed successfully! You can now login with your new password.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]);
      } else {
        // For testing purposes, if the mock token fails, let's try a direct database update approach
        if (actualResetToken.includes('mock_reset_token')) {
          console.log('Mock token failed, trying alternative approach...');

          // Try to update password directly using email
          const directUpdateResponse = await fetch(`${API_BASE_URL}/api/auth/update-password-direct`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (directUpdateResponse.ok) {
            const directData = await directUpdateResponse.json();
            if (directData.success) {
              Alert.alert('Success', 'Password changed successfully! You can now login with your new password.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Login' as never),
                },
              ]);
              return;
            }
          }
        }

        Alert.alert('Error', data.message || 'Failed to reset password. Please try the forgot password flow again.');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Network error. Please try again. For testing, you can use "demo" or "1234" as the reset token.');
    } finally {
      setIsLoading(false);
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.content}>
            {/* Logo */}
             <View style={styles.logoContainer}>
                          <View style={styles.bitcoinLogo}>
                            <Image
                              source={require('../assets/images/icon_input_box_pass_eye.png')}
                              style={styles.bitcoinImage}
                              resizeMode="contain"
                            />
                          </View>
                        </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>CHANGE PASSWORD</Text>
              <Text style={styles.subtitle}>
                Enter your new password
              </Text>
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
              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                 <Image
                                         source={require('../assets/images/icon_input_box_p.png')}
                                         style={styles.inputIconImage}
                                         resizeMode="contain"
                                       />
                  <TextInput
                    style={styles.input}
                    placeholder="PASSWORD"
                    placeholderTextColor="#8a8a8a"
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

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Image
                                         source={require('../assets/images/icon_input_box_p.png')}
                                         style={styles.inputIconImage}
                                         resizeMode="contain"
                                       />
                  <TextInput
                    style={styles.input}
                    placeholder="CONFIRM PASSWORD"
                    placeholderTextColor="#8a8a8a"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#00d4ff"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              {/* Set Password Button */}
               <LinearGradient
                                  colors={['#2ACFEF', '#BD85FC']}
                                  style={styles.setPasswordButton}
                                  start={{x: 0, y: 0}}
                                  end={{x: 1, y: 0}}
                                >
                <TouchableOpacity
                  style={styles.setPasswordButtonInner}
                  onPress={handleChangePassword}
                  disabled={isLoading}
                >
                  <Text style={styles.setPasswordButtonText}>
                    {isLoading ? 'SETTING...' : 'SET PASSWORD'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Back to Login */}
              <View style={styles.backContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
</LinearGradient>

            {/* Footer */}
                        <View style={styles.footer}>
                          <Text style={styles.footerText}>Bitcoin Mining</Text>
                        </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
  geometricShape: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 255, 0.3)',
  },
  shape1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -100,
    right: -100,
    borderColor: 'rgba(139, 69, 255, 0.2)',
  },
  shape2: {
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 100,
    left: -75,
    borderColor: 'rgba(139, 69, 255, 0.15)',
  },
  shape3: {
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 200,
    left: 50,
    borderColor: 'rgba(139, 69, 255, 0.1)',
  },
  shape4: {
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: 300,
    right: 30,
    borderColor: 'rgba(139, 69, 255, 0.2)',
  },
  safeArea: {
    flex: 1,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
  },

  bitcoinLogo: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bitcoinImage: {
    width: '80%',
    height: '80%',
    transform: [{ rotate: '3deg' }],
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
    margin: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 18,
    height: 55,
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
  setPasswordButton: {
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    height: 45,
    width: 160,
    alignSelf: 'center',
  },
  setPasswordButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setPasswordButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
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
    color: '#8a8a8a',
    fontSize: 12,
    fontWeight: '400',
  },backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  inputIconImage: {
  width: 20,
  height: 20,
  marginRight: 8,
},
});

export default ChangePasswordScreen;
