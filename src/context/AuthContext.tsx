import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  db,
  getProfile,
  saveProfile,
  checkHandleAvailable,
  cleanFirestoreData,
  syncUserProfileToConversations
} from '../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, AccentColor, Language, ActiveTab } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedUserId: string | null;
  setSelectedUserId: (uid: string | null) => void;
  selectedConvId: string | null;
  setSelectedConvId: (id: string | null) => void;
  openCreatePost: boolean;
  setOpenCreatePost: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, handle: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACCENT_KEY = 'litenote_accent_color';
const LOCAL_STORAGE_LANG_KEY = 'litenote_language';
const LOCAL_STORAGE_USER_KEY = 'litenote_current_user_profile';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [openCreatePost, setOpenCreatePost] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      return (localStorage.getItem(LOCAL_STORAGE_ACCENT_KEY) as AccentColor) || 'violet';
    } catch {
      return 'violet';
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(LOCAL_STORAGE_LANG_KEY) as Language) || 'ru';
    } catch {
      return 'ru';
    }
  });

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(LOCAL_STORAGE_ACCENT_KEY, color);
    if (user) {
      updateProfileData({ accentColor: color });
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_STORAGE_LANG_KEY, lang);
    if (user) {
      updateProfileData({ language: lang });
    }
  };

  // Sync with Firebase Auth state and real-time User Profile snapshot
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            const rawHandle = (fbUser.email?.split('@')[0] || 'user_' + Math.floor(1000 + Math.random() * 9000))
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '');
            
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cyber User',
              handle: rawHandle,
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawHandle}`,
              bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
              bio: '',
              status: 'online',
              customStatus: '',
              accentColor: accentColor,
              language: language,
              createdAt: Date.now(),
              badges: ['cyber_pioneer'],
              privacy: { profileVisibility: 'all', allowDMs: 'all', showOnlineStatus: true },
              stats: { postsCount: 0, friendsCount: 0, followersCount: 0, followingCount: 0 },
            };

            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
            try {
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
            } catch {}
          }

          // Real-time snapshot listener for live profile & penalty changes
          unsubUserDoc = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setUser((prev) => {
                const merged = { ...(prev || {}), ...data };
                try {
                  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(merged));
                } catch {}
                return merged;
              });
              if (data.accentColor) setAccentColorState(data.accentColor);
              if (data.language) setLanguageState(data.language);
            }
          });
        } catch (err) {
          console.warn('Error fetching or creating user profile:', err);
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        } catch {}
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      const rawHandle = (fbUser.email?.split('@')[0] || 'user_' + Math.floor(1000 + Math.random() * 9000))
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
        handle: rawHandle,
        avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawHandle}`,
        bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
        bio: '',
        status: 'online',
        customStatus: '',
        accentColor: 'violet',
        language: 'ru',
        createdAt: Date.now(),
        badges: ['cyber_pioneer'],
        privacy: { profileVisibility: 'all', allowDMs: 'all', showOnlineStatus: true },
        stats: { postsCount: 0, friendsCount: 0, followersCount: 0, followingCount: 0 },
      };
      await setDoc(userDocRef, newProfile);
      setUser(newProfile);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string, handle: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '') || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if handle is already taken
    const isAvailable = await checkHandleAvailable(cleanHandle);
    if (!isAvailable) {
      throw new Error(`Юзернейм @${cleanHandle} уже занят. Пожалуйста, выберите другой никнейм.`);
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName.trim() || cleanHandle,
      handle: cleanHandle,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`,
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
      bio: '',
      status: 'online',
      customStatus: '',
      accentColor: accentColor,
      language: language,
      createdAt: Date.now(),
      badges: ['cyber_pioneer'],
      privacy: { profileVisibility: 'all', allowDMs: 'all', showOnlineStatus: true },
      stats: { postsCount: 0, friendsCount: 0, followersCount: 0, followingCount: 0 },
    };

    const cleaned = cleanFirestoreData(newProfile);
    await setDoc(doc(db, 'users', cred.user.uid), cleaned);
    setUser(newProfile);
  };

  const logout = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    
    // Clean any undefined values
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanUpdates[key] = val;
      }
    });

    // Check handle uniqueness if handle changed
    if (cleanUpdates.handle && cleanUpdates.handle !== user.handle) {
      const cleanHandle = cleanUpdates.handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const isAvailable = await checkHandleAvailable(cleanHandle, user.uid);
      if (!isAvailable) {
        throw new Error(`Юзернейм @${cleanHandle} уже занят другим пользователем.`);
      }
      cleanUpdates.handle = cleanHandle;
    }

    const updated: UserProfile = { ...user, ...cleanUpdates };
    setUser(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
    } catch {}

    if (updates.accentColor) {
      setAccentColorState(updates.accentColor);
    }
    if (updates.language) {
      setLanguageState(updates.language);
    }

    if (db && user.uid) {
      try {
        const cleaned = cleanFirestoreData(cleanUpdates);
        await setDoc(doc(db, 'users', user.uid), cleaned, { merge: true });
        // Automatically sync updated name/handle/avatar to conversation documents
        syncUserProfileToConversations(updated).catch(() => {});
      } catch (err) {
        console.error('Could not sync user profile update to Firestore:', err);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        activeTab,
        setActiveTab,
        accentColor,
        setAccentColor,
        language,
        setLanguage,
        selectedUserId,
        setSelectedUserId,
        selectedConvId,
        setSelectedConvId,
        openCreatePost,
        setOpenCreatePost,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

