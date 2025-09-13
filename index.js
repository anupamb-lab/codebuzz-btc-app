/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Firebase FCM message received in background:', remoteMessage);
});

AppRegistry.registerComponent('BitPlayPro', () => App);
