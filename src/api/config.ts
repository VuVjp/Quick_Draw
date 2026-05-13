import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the machine's IP address if running in development with Expo
// This allows physical devices to connect to the local server
const getBaseUrl = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5000/api`;
    }
    // Fallback for emulators
    return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
  }
  
  // Production URL
  return 'https://api.quickdraw.app/api'; 
};

export const API_BASE_URL = getBaseUrl();
