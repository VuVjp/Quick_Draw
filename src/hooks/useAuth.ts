// src/hooks/useAuth.ts
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useUserStore } from '../store/useUserStore';

const AUTH_SESSION_KEY = 'user_token';

async function saveAuthSession(session: any) {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    // update in-memory store as well
    try {
        useUserStore.getState().setSession(session);
    } catch { }
}

GoogleSignin.configure({
    webClientId: '866423356627-1gne0up397e58aki2of6foc41nj7k0si.apps.googleusercontent.com', // Firebase Console → Auth → Google → Web Client ID
});

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function signInWithGoogle() {
        setLoading(true);
        setError(null);
        try {
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            const idToken =
                (signInResult as any).idToken ??           // version cũ
                (signInResult as any).data?.idToken ??     // version mới
                null;
            const credential = auth.GoogleAuthProvider.credential(idToken);
            const result = await auth().signInWithCredential(credential);

            // Lưu user vào Firestore nếu lần đầu
            await firestore().collection('users').doc(result.user.uid).set({
                displayName: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                isGuest: false,
                createdAt: firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            const sess = {
                displayName: result.user.displayName || '',
                email: result.user.email || '',
                uid: result.user.uid,
            };
            await saveAuthSession(sess);

            return result.user;
        } catch (e: any) {
            if (e.code === statusCodes.SIGN_IN_CANCELLED) {
                setError(null); // User tự huỷ — không cần báo lỗi
            } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setError('Google Play Services không khả dụng');
            } else {
                setError('Đăng nhập Google thất bại');
                console.error('[Google SignIn]', e);
            }
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function signInAsGuest(displayName: string) {
        setLoading(true);
        setError(null);
        try {
            const result = await auth().signInAnonymously();
            await result.user.updateProfile({ displayName });

            await firestore().collection('users').doc(result.user.uid).set({
                displayName,
                isGuest: true,
                createdAt: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            const guestSess = { displayName, email: '', uid: result.user.uid };
            await saveAuthSession(guestSess);

            return result.user;
        } catch (e: any) {
            setError('Không thể đăng nhập khách');
            console.error('[Guest SignIn]', e);
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function signOut() {
        try {
            const user = auth().currentUser;
            if (!user?.isAnonymous) {
                try {
                    await GoogleSignin.signOut();
                } catch (e) {
                    // ignore google sign out errors
                    console.warn('Google signOut failed', e);
                }
            }
            await auth().signOut();
        } catch (e) {
            console.error('Auth signOut error', e);
        } finally {
            try {
                await AsyncStorage.removeItem(AUTH_SESSION_KEY);
            } catch (e) {
                console.error('Failed to remove auth token', e);
            }

            try {
                // prefer clearSession if available
                const st = useUserStore.getState();
                if (st.clearSession) await st.clearSession();
                else st.setSession(null);
            } catch {
                // swallow errors
            }
        }
    }

    return { signInWithGoogle, signInAsGuest, signOut, loading, error };
}