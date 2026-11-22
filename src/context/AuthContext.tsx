import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  ADMIN_EMAILS,
  configureAuthPersistence,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type { UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  signInWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureAdminProfileDocument(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const displayName = (user.displayName || user.email?.split('@')[0] || 'WebTrex Admin').slice(0, 100);
      await setDoc(userRef, {
        uid: user.uid,
        email: (user.email || '').slice(0, 254),
        displayName,
        company: 'WebTrex',
        phone: '',
        bio: 'WebTrex Administrator',
        role: 'client',
        status: 'active',
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setHasAdminDoc(false);
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    let profileReady = false;
    let adminReady = false;
    const markReadyIfDone = () => {
      if (profileReady && adminReady) {
        setAuthReady(true);
      }
    };

    const userDocPath = `users/${firebaseUser.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      async (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          await ensureAdminProfileDocument(firebaseUser);
        }
        profileReady = true;
        markReadyIfDone();
      },
      () => {
        profileReady = true;
        markReadyIfDone();
      },
    );

    const unsubAdmin = onSnapshot(
      doc(db, 'admins', firebaseUser.uid),
      (snapshot) => {
        setHasAdminDoc(snapshot.exists());
        adminReady = true;
        markReadyIfDone();
      },
      () => {
        setHasAdminDoc(false);
        adminReady = true;
        markReadyIfDone();
      },
    );

    return () => {
      unsubProfile();
      unsubAdmin();
    };
  }, [firebaseUser]);

  const userEmail = (firebaseUser?.email || '').toLowerCase();
  const isAdminEmail = ADMIN_EMAILS.includes(userEmail);

  const isAdmin = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      (isAdminEmail || hasAdminDoc),
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const normalizedEmail = email.trim().toLowerCase();
      await configureAuthPersistence(rememberMe);
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const signedInEmail = (cred.user.email || '').toLowerCase();
      const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid)).catch(() => null);
      if (!ADMIN_EMAILS.includes(signedInEmail) && !adminDoc?.exists()) {
        await signOut(auth);
        throw new Error('Access is restricted to the authorized WebTrex administrator account.');
      }
      await ensureAdminProfileDocument(cred.user);
    },
    [],
  );

  const sendResetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active user session.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshAuthUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setFirebaseUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isAdmin,
        authReady,
        signInWithEmail,
        sendResetPassword,
        resendVerification,
        refreshAuthUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
