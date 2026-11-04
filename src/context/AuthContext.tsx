import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  googleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from '../lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  provider?: 'google-gis' | 'firebase-google' | 'password' | 'anonymous';
}

interface AuthContextType {
  user: AppUser | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  handleGisToken: (googleIdToken: string) => Promise<boolean>;
  signInWithFirebasePopup: () => Promise<boolean>;
  signInWithEmail: (email: string, password?: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInAsGuest: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  logout: () => Promise<void>;
  getIdTokenFresh: () => Promise<string | null>;
  clearError: () => void;
  syncUserWithBackend: (token: string, userData: AppUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  error: null,
  handleGisToken: async () => false,
  signInWithFirebasePopup: async () => false,
  signInWithEmail: async () => false,
  signUpWithEmail: async () => false,
  signInAsGuest: async () => false,
  signOutUser: async () => {},
  logout: async () => {},
  getIdTokenFresh: async () => null,
  clearError: () => {},
  syncUserWithBackend: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Syncs the authenticated user profile with the Express backend and Neon
   */
  const syncUserWithBackend = useCallback(async (token: string, userData: AppUser) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isAnonymous: userData.isAnonymous,
          provider: userData.provider,
        }),
      });
      if (!res.ok) {
        console.warn('Backend auth sync returned status:', res.status);
      }
    } catch (err) {
      console.warn('Auth profile sync failed:', err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const saveSession = useCallback((appUser: AppUser, token: string) => {
    setUser(appUser);
    setIdToken(token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setIdToken(null);
  }, []);

  // Firebase owns credential persistence; only its verified user state creates an app session.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const freshToken = await fbUser.getIdToken();
          const cleanEmail = fbUser.email ? fbUser.email.toLowerCase().trim() : null;
          const appUser: AppUser = {
            uid: fbUser.uid,
            email: cleanEmail,
            displayName: fbUser.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'Research Reviewer'),
            photoURL: fbUser.photoURL,
            isAnonymous: fbUser.isAnonymous,
            provider: fbUser.isAnonymous ? 'anonymous' : 'firebase-google',
          };
          saveSession(appUser, freshToken);
          syncUserWithBackend(freshToken, appUser);
        } catch (tokenErr) {
          console.warn('Could not retrieve token for Firebase user:', tokenErr);
          clearSession();
        }
      } else {
        clearSession();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clearSession, saveSession, syncUserWithBackend]);

  /** Exchanges a Google Identity Services credential for a Firebase-authenticated session. */
  const handleGisToken = async (googleIdToken: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      if (!googleIdToken) {
        throw new Error('Invalid authentication token.');
      }

      // Step A: Attempt Firebase credential sign-in
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCredential = await signInWithCredential(auth, credential);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();

      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email ? fbUser.email.toLowerCase().trim() : null,
        displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Google Researcher'),
        photoURL: fbUser.photoURL,
        provider: 'google-gis',
      };

      saveSession(appUser, token);
      await syncUserWithBackend(token, appUser);
      setLoading(false);
      return true;
    } catch (firebaseErr: any) {
      console.warn('Firebase credential exchange failed:', firebaseErr?.code || 'unknown');
      const userMessage = firebaseErr?.code === 'auth/operation-not-allowed'
        ? 'Google Sign-In is not enabled for this Firebase project.'
        : 'Google sign-in could not be verified. Please try again or use email/password.';
      setError(userMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Secondary Firebase Popup Fallback with select_account
   */
  const signInWithFirebasePopup = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email ? fbUser.email.toLowerCase().trim() : null,
        displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Medical Reviewer'),
        photoURL: fbUser.photoURL,
        provider: 'firebase-google',
      };

      saveSession(appUser, token);
      await syncUserWithBackend(token, appUser);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.warn('Popup sign-in encounter:', err?.code, err?.message);
      if (err?.code === 'auth/unauthorized-domain') {
        setError('Preview domain unauthorized in Firebase console. Please use the official Google Sign-In button above.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Browser popup was blocked. Please click the Google Sign-In button directly.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Popup sign-in failed.');
      }
      setLoading(false);
      return false;
    }
  };

  /**
   * Standard Email/Password sign-in with seamless reviewer fallback
   */
  const signInWithEmail = async (email: string, password?: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.') || !password) {
      setError('Enter a valid email address and password.');
      setLoading(false);
      return false;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: cleanEmail,
        displayName: firebaseUser.displayName || cleanEmail.split('@')[0],
        photoURL: firebaseUser.photoURL,
        provider: 'password',
      };
      saveSession(appUser, token);
      await syncUserWithBackend(token, appUser);
      setLoading(false);
      return true;
    } catch (error: any) {
      setError(error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found'
        ? 'Email or password is incorrect.'
        : error?.message || 'Email authentication failed.');
      setLoading(false);
      return false;
    }
  };

  /**
   * Direct Email/Password Registration
   */
  const signUpWithEmail = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@') || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return false;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = cred.user;
      const token = await fbUser.getIdToken();
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        photoURL: null,
        provider: 'password',
      };
      saveSession(appUser, token);
      await syncUserWithBackend(token, appUser);
      setLoading(false);
      return true;
    } catch (error: any) {
      setError(error?.code === 'auth/email-already-in-use'
        ? 'An account already uses this email. Sign in instead.'
        : error?.message || 'Account creation failed.');
      setLoading(false);
      return false;
    }
  };

  /**
   * 1-Click Guest/Demo sign-in (signInAnonymously)
   */
  const signInAsGuest = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      const firebaseUser = credential.user;
      const token = await firebaseUser.getIdToken();
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: null,
        displayName: 'Guest Reviewer',
        photoURL: null,
        isAnonymous: true,
        provider: 'anonymous',
      };
      saveSession(appUser, token);
      await syncUserWithBackend(token, appUser);
      setLoading(false);
      return true;
    } catch (error: any) {
      setError(error?.message || 'Guest sign-in is not enabled for this project.');
      setLoading(false);
      return false;
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    clearSession();
  };

  const logout = signOutUser;

  const getIdTokenFresh = async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const fresh = await auth.currentUser.getIdToken(true);
        setIdToken(fresh);
        return fresh;
      } catch (err) {
        console.warn('Could not refresh Firebase token, using active token:', err);
      }
    }
    return idToken;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        error,
        handleGisToken,
        signInWithFirebasePopup,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOutUser,
        logout,
        getIdTokenFresh,
        clearError,
        syncUserWithBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
