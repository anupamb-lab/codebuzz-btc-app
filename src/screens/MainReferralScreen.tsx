import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute  } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import { testApiConnectivity, getApiInfo } from '../utils/testApi';
// Social sharing imports removed - not needed for referral screen
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { Image, Linking, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuth } from '../auth/AuthProvider';
import { getReferralCode } from '../auth/auth';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

interface InternalReferralScreenProps {}

const InternalReferralScreen: React.FC<InternalReferralScreenProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState<string>('13AD67');
  const { login } = useAuth();

    const route = useRoute();

  type InternalReferralScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InternalReferral'>;

  const navigation = useNavigation<InternalReferralScreenNavigationProp>();

    const copyReferralCode = () => {
        Clipboard.setString(userReferralCode);
        Alert.alert('Copied!', 'Referral code copied to clipboard', [{ text: 'OK' }]);
    };

    const handleInvite = async () => {
        try {
            const result = await Share.share({
            message: `Join me using my referral code ${userReferralCode} and earn rewards! 🚀`,
            });

            if (result.action === Share.sharedAction) {
            if (result.activityType) {
                console.log('Shared via:', result.activityType);
            } else {
                console.log('Shared successfully');
            }
            } else if (result.action === Share.dismissedAction) {
            console.log('Share dismissed');
            }
        } catch (error) {
            console.error('Error sharing:', error);
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
          <View style={styles.content}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => 
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    })
                } style={styles.backButton}>
                    <Icon name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}></Text>
            </View>


            {/* Bitcoin Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.bitcoinLogo}>
                <Image
                  source={require('../assets/images/icon_referral_screen.png')}
                  style={styles.bitcoinImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.screenContainer}>

                {/* Referral Code Box */}
                <Text style={styles.referralTitle}>REFERRAL CODE</Text>
                <TouchableOpacity onPress={copyReferralCode}>
                    <LinearGradient
                        colors={['#1B202CAA', '#2E3646AA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.referralBox}
                    >
                        <Text style={styles.referralCode}>{userReferralCode}</Text>
                        <View style={styles.underline} />
                        <Text style={styles.tapToCopy}>Tap to copy</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Invite Section */}
                <LinearGradient
                    colors={['#1B202CAA', '#2E3646AA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.formBox}
                >
                    <View style={styles.formContainer}>
                    <Text style={styles.earnText}>
                        Earn up to 50$ for each referral that uses the app for more than 5 days.{' '}
                        <Text style={styles.learnMore}>Learn more</Text>
                    </Text>

                    <LinearGradient
                        colors={['#2ACFEF', '#BD85FC']}
                        style={styles.loginButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity
                        style={styles.loginButtonInner}
                        onPress={handleInvite}
                        disabled={isLoading}
                        >
                        <Text style={styles.loginButtonText}>
                            {isLoading ? 'Loading...' : 'INVITE'}
                        </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                    </View>
                </LinearGradient>

                {/* Share From Section */}
                <LinearGradient
                    colors={['#1B202CAA', '#2E3646AA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shareBox}
                >
                    <Text style={styles.shareTitle}>Share from</Text>
                    <View style={styles.iconRow}>
                    <TouchableOpacity
                    onPress={() => Linking.openURL(`whatsapp://send?text=Join me using my referral code: ${userReferralCode}`)}
                    >
                        <Image source={require('../assets/images/icon_wa.png')} style={styles.shareIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => Linking.openURL(`sms:?body=Join me using my referral code: ${userReferralCode}`)}
                    >
                        <Image source={require('../assets/images/icon_sms.png')} style={styles.shareIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => Linking.openURL(`tg://msg?text=Join me using my referral code: ${userReferralCode}`)}
                    >
                        <Image source={require('../assets/images/icon_tel.png')} style={styles.shareIcon} />
                    </TouchableOpacity>
                    
                    </View>
                </LinearGradient>

                </View>

          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
  },

  bitcoinLogo: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bitcoinImage: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '3deg' }],
  },
  bitcoinSymbol: {
    fontSize: 80,
    color: '#8b45ff',
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 1,
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
  loginButton: {
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    height: 45,
    width: 160,
    alignSelf: 'center',
  },
  loginButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotPasswordText: {
    color: '#42B0FF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
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
    bottom: 30,
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
referralTitle: {
  color: '#4ACDFC',
  fontSize: 14,
  marginBottom: 6,
  marginLeft: 10,
},

referralBox: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  alignItems: 'center',
  marginBottom: 20,
  alignSelf: 'center',
  borderRadius: 15,
},

referralCode: {
  fontSize: 40,
  color: '#4ACDFC',
  fontWeight: 'bold',
},

underline: {
  width: '100%',
  height: 1,
  backgroundColor: '#fff',
  marginTop: 5
},

tapToCopy: {
  color: '#ffffff',
  fontSize: 10,
  opacity: 0.7,
  marginTop: 5,
  textAlign: 'center',
},

earnText: {
  color: '#fff',
  fontSize: 13,
  marginBottom: 20,
  lineHeight: 18,
},

learnMore: {
  color: '#6AF3FC',
  textDecorationLine: 'underline',
},

shareBox: {
  width: '85%',
  alignSelf: 'center',
  padding: 15,
  marginVertical: 25,
  borderRadius: 12,
},

shareTitle: {
  color: '#fff',
  fontSize: 12,
  marginBottom: 10,
},

iconRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 10,
},

shareIcon: {
  width: 40,
  height: 40,
  resizeMode: 'contain',
},

skipButton: {
  alignSelf: 'center',
  paddingHorizontal: 25,
  paddingVertical: 8,
  borderRadius: 30,
  marginTop: 20,
},

skipButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},
headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 5,
  backgroundColor: 'transparent',
},

backButton: {
  marginRight: 5,
},

headerTitle: {
  fontSize: 20,
  color: '#fff',
  fontWeight: '600',
},
});

export default InternalReferralScreen;
