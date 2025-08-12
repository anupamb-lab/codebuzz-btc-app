import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';
import { useAuth } from '../auth/AuthProvider';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MyProfileScreen'>;

const MyProfileScreen = () => {
    const navigation = useNavigation<NavigationProp>();

  const { user, logout } = useAuth();

  console.log('MyProfileScreen - User data:', user);

  const initials = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Profile</Text>
        <View style={{ width: 24 }} /> {/* Spacer to center title */}
      </View>

      {/* Profile Info Box */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
      </View>

      {/* Account Settings Box */}

      <View style={styles.settingsBox}>
        <Text style={styles.boxHeader}>Account Settings</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            navigation.navigate('ForgotPassword', {
              screen_heading: 'Change Password'
            });
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            // TODO: Implement UpdateEmail screen
            console.log('Update Email clicked');
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Update Email Address</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            navigation.navigate('TwoFactorScreen');
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Two-Factor Authentication</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            navigation.navigate('NotificationPreferencesScreen');
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Notification Preferences</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

      </View>

      {/* Support Box */}

      <View style={styles.settingsBox}>
        <Text style={styles.boxHeader}>Support</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            console.log('Help Center clicked');
            console.log('Navigation object:', navigation);
            console.log('Attempting to navigate to FAQScreen...');
            navigation.navigate('FAQScreen' as never);
            console.log('Navigation call completed');
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Help Center & FAQ</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            console.log('Contact Support clicked');
            console.log('Navigation object:', navigation);
            console.log('Attempting to navigate to SupportScreen...');
            navigation.navigate('SupportScreen' as any);
            console.log('Navigation call completed');
          }}
        >
          <View style={styles.rowLine} />
          <Text style={styles.rowText}>Contact Us</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

      </View>

      {/* Logout Button */}
      <LinearGradient
        colors={['#53D3F6', '#BD85FC', '#F472B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.logoutButton}
      >
        <TouchableOpacity onPress={ async () => {
          await logout();
        }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  profileBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: 'royalblue',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    textAlign: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  email: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  settingsBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  boxHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  rowLine: {
    position: 'absolute',
    top: 0,
    height: 1,
    backgroundColor: '#333',
    width: '100%',
  },
  rowText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
    marginLeft: 4,
  },
  logoutButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyProfileScreen;
