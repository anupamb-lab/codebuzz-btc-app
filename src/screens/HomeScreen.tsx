import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';

interface GradientButtonProps {
  icon?: string;
  text: string;
  fullWidth?: boolean;
}

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  color?: string;
}

interface InfoCardProps {
  icon: string;
  value: string;
  label: string;
}

interface ActionCardProps {
  icon: string;
  label: string;
}

const Page: React.FC = () => {
  const data = [50, 10, 40, 95, 85, 91, 35];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Icon name="menu" size={30} color={'#fff'} />
        <View style={styles.profileContainer}>
          <Text style={styles.username}>Peter Doe</Text>
          <Icon name="account-circle" size={40} color={'#9333EA'} />
        </View>
      </View>

      <LinearGradient
        colors={['#1A202C', '#2D3748']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.welcomeCard}
      >
        <Text style={styles.welcomeText}>Welcome back, Peter!</Text>
        <Text style={styles.subText}>Your digital assets at glance.</Text>
      </LinearGradient>

      <View style={styles.buttonRow}>
        <GradientButton icon="gift" text="Daily Rewards" />
        <GradientButton icon="play-circle" text="Watch Videos" />
      </View>
      <GradientButtonB icon="credit-card-outline" text="Paid Plans" fullWidth />

      <View style={styles.cardRow}>
        <StatCard icon="currency-usd" value="$12.50" label="Daily Profit" />
        <StatCard icon="chart-line" value="200 TH/s" label="Current Hashrate" />
        <StatCard icon="speedometer" value="98%" label="Efficiency" />
      </View>

      <View style={styles.cardRow}>
        <InfoCard icon="wallet" value="$0" label="Total Wallet Balance" />
        <InfoCard icon="account-group" value="0" label="Total Referrals" />
      </View>

      <LinearGradient
        colors={['#1A202C', '#2D3748']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioBox}
      >
        <Text style={styles.sectionTitle}>Portfolio Performance</Text>
        <LineChart
          style={styles.chart}
          data={data}
          svg={{ stroke: '#22D3EE', strokeWidth: 3, fill: 'rgba(34, 211, 238, 0.3)' }}
          contentInset={{ top: 20, bottom: 20 }}
          curve={shape.curveNatural}
        >
          <Grid svg={{ stroke: 'rgba(255,255,255,0.05)' }} />
        </LineChart>
        <View style={styles.filters}>
          {['1D', '1W', '1M', '1Y', 'ALL'].map((filter) => (
            <View key={filter} style={styles.filterBox}>
              <Text style={styles.filterText}>{filter}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.cardRow}>
        <ActionCard icon="cash-minus" label="Withdraw Funds" />
        <ActionCard icon="cash-plus" label="Deposit Funds" />
      </View>

      <View style={styles.recentBox}>
        <Text style={styles.sectionTitleRC}>Recent Activity</Text>

        {[50.64, 850.64, 150.64, 920.64].map((value, index) => (
          <View key={index} style={styles.transactionRow}>
            <View>
              <Text style={styles.transactionType}>Deposit</Text>
              <Text style={styles.transactionCrypto}>0.001 BTC</Text>
            </View>
            <Text style={styles.transactionValue}>+${value.toFixed(2)}</Text>
          </View>
        ))}

        <GradientButtonB text="View All Activity" fullWidth />
      </View>
    </ScrollView>
  );
};

const GradientButton: React.FC<GradientButtonProps> = ({ icon, text }) => (
  <LinearGradient
    colors={['#22D3EE', '#C084FC']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gradientButton, { width: '48%' }]}
  >
    <TouchableOpacity style={styles.buttonContent} activeOpacity={0.8}>
      {icon && <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  </LinearGradient>
);

const GradientButtonB: React.FC<GradientButtonProps> = ({ icon, text }) => (
  <LinearGradient
    colors={['#22D3EE', '#C084FC']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gradientButtonB, { width: '100%' }]}
  >
    <TouchableOpacity style={styles.buttonContent} activeOpacity={0.8}>
      {icon && <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  </LinearGradient>
);

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color = '#22D3EE' }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoCard: React.FC<InfoCardProps> = ({ icon, value, label }) => (
  <View style={styles.infoCard}>
    <Icon name={icon} size={48} color="#0891B2" />
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const ActionCard: React.FC<ActionCardProps> = ({ icon, label }) => (
  <View style={styles.actionCard}>
    <Icon name={icon} size={40} color="#22D3EE" />
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

export default Page;

// Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111827'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: '#111827'
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 16,
    marginRight: 6,
    color: '#fff'
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    paddingBottom: 20,
    marginBottom: 20
  },
  welcomeText: {
    fontSize: 25,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter'
  },
  subText: {
    color: '#e0e0e0',
    marginTop: 6,
    fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  gradientButton: {
    borderRadius: 40,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gradientButtonB: {
    borderRadius: 40,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    gap: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#fff',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  infoValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
    color: "#0891B2",
    textAlign: 'center',
    fontFamily: 'Inter'
  },
  infoLabel: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
    fontFamily: 'Inter'
  },
  portfolioBox: {
    borderRadius: 20,
    padding: 16,
    marginVertical: 16,
    height: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff'
  },
  sectionTitleRC: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff'
  },
  chart: {
    height: 180,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  filterBox: {
    backgroundColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    color: '#D1D5DB'
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: "#fff",
    fontWeight: 'bold'
  },
  recentBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionType: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 14,
  },
  transactionCrypto: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
});