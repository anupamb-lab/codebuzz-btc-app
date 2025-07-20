import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../components/types';

const screenWidth = Dimensions.get('window').width;

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
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backRow}>
          <Icon name="chevron-back" size={24} color="white" />
          <Text style={styles.topBarTitle}>Achievements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.badgeCount}>
              <Text style={{ color: 'white' }}>7</Text>
              <Text style={{ color: '#9CA3AF' }}>/21</Text>
            </Text>
            <Icon name="trophy" size={20} color="#FFD700" style={{ marginHorizontal: 4 }} />
            <Text style={styles.headerText}>Achievement Badges</Text>
            <Icon name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </View>

          <Text style={styles.subText}>
            Unlock achievements to gain extra rewards
          </Text>

          <Text style={styles.sectionTitle}>Achievements in Process</Text>

          {achievements.map((item, index) => {
            const percentage = item.goal === 0 ? 0 : item.progress / item.goal;

            return (
              <View key={index} style={styles.achievementCard}>
                <View style={styles.achievementHeader}>
                  <Icon name="medal-outline" size={24} color="#E11D48" />
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
    paddingBottom: 10,
    backgroundColor: '#0F172A',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarTitle: {
    color: 'white',
    fontSize: 18,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#1E293B',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeCount: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  subText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  achievementCard: {
    marginBottom: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementSub: {
    color: '#9CA3AF',
    fontSize: 12,
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
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#00FFA6',
  },
  divider: {
    marginTop: 12,
    borderBottomColor: '#475569',
    borderBottomWidth: 1,
  },
});
