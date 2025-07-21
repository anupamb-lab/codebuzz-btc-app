import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';

const { height: screenHeight } = Dimensions.get('window');

const achievements = [
  {
    title: 'Lv. 1 Deputy',
    progress: 0,
    goal: 150,
    metric: 'Reward Points Used',
    reward: '+50 Pts',
  },
  {
    title: 'Lv. 3',
    progress: 21,
    goal: 30,
    metric: 'Flights Booked',
    reward: '+50 Pts',
  },
  {
    title: 'Lv. 4 Aviator',
    progress: 0,
    goal: 150,
    metric: 'Reward Points Used',
    reward: '+50 Pts',
  },
  {
    title: 'Lv. 3',
    progress: 21,
    goal: 30,
    metric: 'Flights Booked',
    reward: '+50 Pts',
  },
];

const AchievementsScreen = () => {
  type SidebarNavigationProp = StackNavigationProp<RootStackParamList, 'AchievementsScreen'>;
  
  const navigation = useNavigation<SidebarNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.reset({index: 0, routes: [{ name: 'Main' }],})} style={styles.backRow}>
          <Icon name="chevron-back" size={20} color="white" />
          <Text style={styles.topBarTitle}>ACHIEVEVEMENTS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.bigCount}>7/21</Text>
            <Image
              source={require('../assets/images/trophy.png')}
              style={styles.trophyIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Achievement Badges</Text>
          <Text style={styles.subText}>
            Unlock achievements to gain extra rewards
          </Text>

          <View style={styles.dividerTop} />
          <Text style={styles.sectionTitle}>Achievements in Process</Text>

          {achievements.map((item, index) => {
            const percentage = item.goal === 0 ? 0 : item.progress / item.goal;
            return (
              <View key={index} style={styles.achievementCard}>
                <View style={styles.achievementHeader}>
                  <Image
                    source={require('../assets/images/medal.png')}
                    style={styles.avatar}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.achievementTitle}>{item.title}</Text>
                    <Text style={styles.achievementSub}>
                      {item.progress}/{item.goal} {item.metric}
                    </Text>
                  </View>
                  <View style={styles.rewardBox}>
                    <Text style={styles.rewardText}>{item.reward}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressWrapper}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage * 100}%` },
                    ]}
                  />
                </View>

                {/* Separator */}
                <View style={styles.divider} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default AchievementsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    minHeight: screenHeight * 0.85,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigCount: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  trophyIcon: {
    width: 36,
    height: 36,
    marginLeft: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  subText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  dividerTop: {
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  achievementCard: {
    marginTop: 25,
    marginBottom: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  achievementTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  rewardBox: {
    marginLeft: 'auto',
    backgroundColor: '#62B195',
    borderColor: '#00FFA6',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressWrapper: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginTop: 10,
    marginLeft: 40,
    overflow: 'hidden',
    width: 200
  },
  progressFill: {
    height: 6,
    backgroundColor: '#00FFA6',
  },
  divider: {
    marginTop: 20,
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
  },
});
