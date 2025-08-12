import React, { useState } from 'react';
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

export default function NotificationPreferencesScreen({ navigation }: any) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [smsNotif, setSmsNotif] = useState(false);

  const handleSave = async () => {
    try {
    //   const res = await fetch('https://example.com/api/notifications/preferences', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       email: emailNotif,
    //       push: pushNotif,
    //       sms: smsNotif,
    //     }),
    //   });

    //   const data = await res.json();

      if (true) {
        Alert.alert('Success', 'Notification preferences updated successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Hoi');
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
