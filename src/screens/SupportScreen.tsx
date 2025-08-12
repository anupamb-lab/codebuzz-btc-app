import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Image } from 'react-native';
import { get_data_uri } from '../config/api';
import { useAuth } from '../auth/AuthProvider';

const SupportScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    user: user?.id,
    name: '',
    email: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch(get_data_uri('CREATE_SUPPORT_TICKET'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Invalid response from server");
      }

      if (data.success) {
        Alert.alert('Success', 'Your message has been sent successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setFormData({ user: '', name: '', email: '', message: '' });
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to send message');
      }
    } catch (error) {
      console.log("Error: ", error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
 <ImageBackground
      source={require('../assets/images/bg_support.png')}
      style={[styles.backgroundImage, { backgroundColor: '#0F172A' }]}
      resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

    <SafeAreaView style={styles.container}>      
      <View style={styles.header}>
              <Text style={styles.headerTitle}>SUPPORT</Text>
              <View style={styles.placeholder} />
            </View>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Support Icon */}
                    <View style={styles.logoContainer}>
                      <View style={styles.supportLogo}>
                        <Image
                          source={require('../assets/images/icon_support.png')}
                          style={styles.supportImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>

        {/* Form */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.subtitle}>
            Have questions or need help? Send us a message and we'll get back to you as soon as possible.
          </Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-MAIL</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MESSAGE</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={formData.message}
              onChangeText={(value) => handleInputChange('message', value)}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6465F1', '#A755F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'SENDING...' : 'SEND'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Background Decoration */}
        <View style={styles.backgroundDecoration}>
          {[...Array(8)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.decorativeElement,
                {
                  top: `${15 + index * 12}%`,
                  left: `${5 + (index % 3) * 45}%`,
                  opacity: 0.05,
                  transform: [{ rotate: `${index * 30}deg` }],
                },
              ]}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
     </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#00d4ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
   backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  iconText: {
    fontSize: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3d3d54',
  },
  messageInput: {
    height: 120,
    paddingTop: 15,
  },
  submitButton: {
    marginTop: 5,
    borderRadius: 10,
    overflow: 'hidden',
    height: 48,
    width: 150,
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomSpacing: {
    height: 50,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  decorativeElement: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#00d4ff',
    borderRadius: 15,
  },
  supportLogo: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
   supportImage: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '3deg' }],
  },
   logoContainer: {
    alignItems: 'center',
    marginTop: 75,
  },

});

export default SupportScreen;
