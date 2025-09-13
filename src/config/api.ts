/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Production API URL (Render deployment) - Working live server

const SERVER_URL = 'https://dashboard.bitplaypro.com'
const PRODUCTION_API_URL = `${SERVER_URL}/mobile_api`;

// Development API URLs (for local testing with cloud database)
const DEVELOPMENT_API_URLS = {
  LOCAL_IP: 'http://192.168.2.204:5000/api',
  LOCALHOST: 'http://localhost:5000/api',
  ANDROID_EMULATOR: 'http://10.0.2.2:5000/api',
};

// Use production Render backend with cloud database (MongoDB Atlas)
// This provides live server with cloud data persistence - fully deployed solution
export const API_BASE_URL = PRODUCTION_API_URL;

export const DATA_ENDPOINTS = {
  CREATE_WITHDRAWAL: "/api/withdrawals",
  GET_BALANCE_HISTORY: "/api/wallet/history",
  SET_WALLET_BALANCE: '/api/wallet/balance',
  GET_WALLET_BALANCE: '/api/wallet/balance',
  GET_DEPOSIT_ADDRESS: '/api/deposit-address',
  GET_FAQS: '/api/faqs',
  GET_REWARDS: '/api/daily-rewards',
  GET_SUBSCRIPTIONS: '/api/subscriptionplans',
  CREATE_SUPPORT_TICKET: '/api/help/create',
  REFERRALS: '/api/referrals',
  CREATE_FCM: '/api/firebase_tokens/create'
} as const;

type DataEndpointKey = keyof typeof DATA_ENDPOINTS;

export const get_data_uri = (endpoint: DataEndpointKey): string => {
  return `${SERVER_URL}${DATA_ENDPOINTS[endpoint]}`;
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  REFERRALS: '/api/referrals',
  SOCIAL_LOGIN: '/api/auth/social-login',
  ME: '/api/auth/me',
  FORGOT_PASSWORD: '/api/auth/forgotpassword',
  RESET_PASSWORD: '/api/auth/resetpassword', // PUT /api/auth/resetpassword/:resettoken
  VERIFY_EMAIL: '/api/auth/verify-email', // GET /api/auth/verify-email/:token
  VERIFY_EMAIL_OTP: '/api/auth/verify-email-otp', // GET /api/auth/verify-email-otp/:otp
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  
  // Health Check
  HEALTH: '/api/health',

  // Support (if implemented)
  SUPPORT_CONTACT: '/api/support/contact',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// API Configuration
export const API_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function for making API requests
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = getApiUrl(endpoint);

  const config: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers,
    },
  };

  console.log('API Request:', {
    url,
    method: config.method || 'GET',
    headers: config.headers,
  });

  try {
    const response = await fetch(url, config);

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const data = await response.json();

    // Special handling for 403 status (email verification required)
    if (response.status === 403 && data.emailVerified === false) {
      console.log('Email verification required - returning data for handling');
      return data; // Return data instead of throwing error
    }

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      console.error('API Error Response:', data);
      throw new Error(errorMessage);
    }

    console.log('API Success Response:', data);
    return data;
  } catch (error: any) {
    console.error('API Request Error:', {
      message: error.message,
      url,
      error,
    });

    // Provide more specific error messages
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check your internet connection and make sure the server is running.`);
    }

    throw error;
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getApiUrl,
  apiRequest,
  get_data_uri,
  DATA_ENDPOINTS
};
