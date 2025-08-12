import { StackNavigationProp } from '@react-navigation/stack';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../components/types';
import { useNavigation } from '@react-navigation/native';
import { get_data_uri } from '../config/api';
import axios from 'axios';

interface SubscriptionItem {
  _id: string;
  name: string;
  hashrate: number;
  duration: number;
  maintenance_cost: number;
  plan_cost: number;
}

const StoreScreen = () => {


    const [SubscriptionData, setSubscriptionData] = useState<SubscriptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    type SubscriptionResponse = {
      success: boolean;
      plans: SubscriptionItem[];
    };

    useEffect(() => {
      const fetchSubscriptions = async () => {
        try {
          const response = await axios.get<SubscriptionResponse>(
            get_data_uri('GET_SUBSCRIPTIONS')
          );
          setSubscriptionData(response.data.plans);
        } catch (err) {
          console.error(err);
          setError('Failed to load FAQ data');
        } finally {
          setLoading(false);
        }
      };

      fetchSubscriptions();
    }, []);

    type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Store'>;
    
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handlePurchase = (plan) => {
      navigation.navigate('MakePaymentScreen', { package_id: plan.id });
    };

    const getRandomColor = (): string => {
      const colors = [
        '#FF5733',
        '#33FF57',
        '#5168ccff',
        '#FF33A1',
        '#FFD433', 
        '#8E33FF',
        '#33FFF3', 
        '#3fdd8eff', 
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Store</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Purchase Hashrate Box */}
        <LinearGradient
          colors={['rgba(240,255,255,0.14)', 'rgba(240,255,255,0.23)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <Text style={styles.headerTitle}>Purchase Hashrate</Text>
          <Text style={styles.headerSubtitle}>
            Grow your mining power with our{'\n'}competitive contracts.
          </Text>
        </LinearGradient>

        {/* Available Contracts */}
        <Text style={styles.sectionTitle}>Available Contracts</Text>
        {SubscriptionData.map((plan, index) => {
          const fcolor = getRandomColor();

          return (
            <View key={index} style={styles.planCard}>
              <View style={styles.planHeader}>
                <MaterialIcon name="flash" color={fcolor} size={18} style={{ marginRight: 6 }} />
                <Text style={styles.planTitle}>{plan.name}</Text>
              </View>

              <Text style={styles.planSub}>Hashrate: {`${plan.hashrate} TH/s`}</Text>
              <Text style={styles.planSub}>Duration: {`${plan.duration} Months`}</Text>
              <Text style={styles.planSub}>Daily Maintenance: {`$ ${plan.maintenance_cost}/day`}</Text>

              <View style={styles.planFooter}>
                <Text style={[styles.planPrice, { color: fcolor }]}>{`$${plan.plan_cost}.00`}</Text>

                <TouchableOpacity onPress={() => handlePurchase(plan)}>
                  <LinearGradient
                    colors={['#22D3EE', '#C084FC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.planButton}
                  >
                    <Text style={styles.planButtonText}>Purchase Plan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        )}

        {/* Custom Hashrate Plan */}
        <View style={styles.customBox}>
          <View style={styles.customHeader}>
            <MaterialIcon name="tools" color="#FBBF24" size={18} style={{ marginRight: 6 }} />
            <Text style={styles.customTitle}>Custom Hashrate Plan</Text>
          </View>
          <Text style={styles.customSubtitle}>
            Need a specific hashrate or duration? Contact us{'\n'}for a custom quote tailored to your needs.
          </Text>
          <TouchableOpacity style={styles.customButton} onPress={ () => {
            navigation.navigate("CustomQuote")
          }}>
            <Text style={styles.customButtonText}>Request Custom Quote</Text>
          </TouchableOpacity>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorksBox}>
          <Text style={styles.howTitle}>How It Works</Text>
          {[
            'Choose a hashrate contract that suits your needs.',
            'Complete the secure payment process.',
            'Your mining power is activated instantly.',
            'Track your earnings daily on your dashboard.',
          ].map((item, idx) => (
            <Text key={idx} style={styles.howBullet}>
              {`\u2022 ${item}`}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default StoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  backArrow: {
    color: 'white',
    fontSize: 24,
  },
  topBarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#E2E8F0',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  planSub: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 4,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  planButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  customBox: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 24,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customTitle: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: '600',
  },
  customSubtitle: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 12,
  },
  customButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  customButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  howItWorksBox: {
    backgroundColor: 'rgba(240,255,255,0.27)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  howTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  howBullet: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
});
