import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ImageBackground,
  ScrollView
} from 'react-native';
import { get_data_uri } from '../config/api';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';

export default function NotificationPreferencesScreen({ navigation }: any) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [smsNotif, setSmsNotif] = useState(false);

  const { user } = useAuth();

  const user_id = user?.id;

  useEffect(() => {
    const FetchNottificationPrefs = async () => {
      if (!user_id) {
        return;
      }

      try {
        const user_pref_uri = get_data_uri("NOTIFICATION_PREFS");
        console.log("UserNotificationPref - URI: ", user_pref_uri);
        
        const res = await axios.get(`${user_pref_uri}/${user_id}`);
        console.log("UserNotificationPref - Response: ", res.data);
        
        setEmailNotif(res.data.user_preferences.email || false);
        setPushNotif(res.data.user_preferences.push || false);
        setSmsNotif(res.data.user_preferences.sms || false);
      } catch (err: any) {
        console.error("Error fetching User Preference:", err.message);
      }
    };

    FetchNottificationPrefs();
  }, [user_id]);

  const handleSave = async () => {
    try {
      const notification_pref_uri = `${get_data_uri("NOTIFICATION_PREFS")}/${user_id}`;
      const res = await fetch(notification_pref_uri, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNotif,
          push: pushNotif,
          sms: smsNotif,
        }),
      });

      const data = await res.json();

      console.log("UpdatingNotificationPref - Response Data: ", data);

      if (res.ok) {
        Alert.alert('Success', 'Notification preferences updated successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/bg_faq.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Email Notifications</Text>
            <Switch
              trackColor={{ false: '#334155', true: '#22D3EE' }}
              thumbColor={'#f1f5f9'}
              value={emailNotif}
              onValueChange={setEmailNotif}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Push Notifications</Text>
            <Switch
              trackColor={{ false: '#334155', true: '#22D3EE' }}
              thumbColor={'#f1f5f9'}
              value={pushNotif}
              onValueChange={setPushNotif}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SMS Notifications</Text>
            <Switch
              trackColor={{ false: '#334155', true: '#22D3EE' }}
              thumbColor={'#f1f5f9'}
              value={smsNotif}
              onValueChange={setSmsNotif}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backArrow: {
    color: 'white',
    fontSize: 22,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 30, // keeps it visually centered
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
