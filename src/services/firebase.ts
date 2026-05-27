// src/services/firebase.ts
// Centralized Firebase initialization using the modular v9+ API
import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export const app = getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
