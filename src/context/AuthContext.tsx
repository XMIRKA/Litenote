import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  auth,
  db,
  getProfile,
  saveProfile,
  checkHandleAvailable,
  cleanFirestoreData,
  syncUserProfileToConversations,
  syncUserProfileToPosts,
  updateUserPresence
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
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, AccentColor, Language, ActiveTab, UIThemeSettings } from '../types';
import { applyThemeToDocument, DEFAULT_UI_THEME, THEME_PRESETS } from '../lib/theme';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'litenote_sovereign_salt_2026_';
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  themeSettings: UIThemeSettings;
  setThemeSettings: (settings: Partial<UIThemeSettings>) => void;
  applyPreset: (presetId: string) => void;
  resetThemeSettings: () => void;
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
  signInWithEmail: (emailOrHandle: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, handle: string) => Promise<void>;
  resetPassword: (emailOrHandle: string, newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACCENT_KEY = 'litenote_accent_color';
const LOCAL_STORAGE_THEME_KEY = 'litenote_theme_settings';
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

  const unsubUserDocRef = useRef<(() => void) | null>(null);

  const [themeSettings, setThemeSettingsState] = useState<UIThemeSettings>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      const storedAccent = localStorage.getItem(LOCAL_STORAGE_ACCENT_KEY) as AccentColor;
      let initial: UIThemeSettings = { ...DEFAULT_UI_THEME };
      if (stored) {
        initial = { ...initial, ...JSON.parse(stored) };
      }
      if (storedAccent) {
        initial.accentColor = storedAccent;
      }
      return initial;
    } catch {
      return DEFAULT_UI_THEME;
    }
  });

  const accentColor = themeSettings.accentColor;

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(LOCAL_STORAGE_LANG_KEY) as Language) || 'ru';
    } catch {
      return 'ru';
    }
  });

  // Apply theme to document when themeSettings change
  useEffect(() => {
    applyThemeToDocument(themeSettings.accentColor, themeSettings);
  }, [themeSettings]);

  const setThemeSettings = (updates: Partial<UIThemeSettings>) => {
    setThemeSettingsState((prev) => {
      const updated: UIThemeSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(updated));
        if (updates.accentColor) {
          localStorage.setItem(LOCAL_STORAGE_ACCENT_KEY, updates.accentColor);
        }
      } catch {}
      return updated;
    });

    if (user && db) {
      try {
        const cleaned = cleanFirestoreData({
          accentColor: updates.accentColor || themeSettings.accentColor,
          customization: {
            ...(user.customization || {}),
            themeSettings: { ...themeSettings, ...updates },
          },
        });
        setDoc(doc(db, 'users', user.uid), cleaned, { merge: true }).catch(() => {});
      } catch {}
    }
  };

  const applyPreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setThemeSettings(found.settings);
    }
  };

  const resetThemeSettings = () => {
    setThemeSettings(DEFAULT_UI_THEME);
  };

  const setAccentColor = (color: AccentColor) => {
    setThemeSettings({ accentColor: color });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, lang);
    } catch {}
    if (user && db) {
      try {
        setDoc(doc(db, 'users', user.uid), { language: lang }, { merge: true }).catch(() => {});
      } catch {}
    }
  };

  const attachUserDocListener = (uid: string) => {
    if (unsubUserDocRef.current) {
      unsubUserDocRef.current();
      unsubUserDocRef.current = null;
    }
    if (!uid) return;
    try {
      const userDocRef = doc(db, 'users', uid);
      unsubUserDocRef.current = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUser((prev) => {
              const merged = { ...(prev || {}), ...data };
              try {
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
            if (data.customization?.themeSettings) {
              setThemeSettingsState((prev) => ({ ...prev, ...data.customization!.themeSettings }));
            } else if (data.accentColor) {
              setThemeSettingsState((prev) => ({ ...prev, accentColor: data.accentColor }));
            }
            if (data.language) {
              setLanguageState(data.language);
            }
          }
        },
        (err) => {
          console.warn('Firestore user doc snapshot error:', err);
        }
      );
    } catch (e) {
      console.warn('Could not attach user snapshot listener:', e);
    }
  };

  // Sync session and real-time User Profile snapshot
  useEffect(() => {
    // 1. Hydrate from localStorage first
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed && parsed.uid) {
          setUser(parsed);
          if (parsed.customization?.themeSettings) {
            setThemeSettingsState((prev) => ({ ...prev, ...parsed.customization!.themeSettings }));
          } else if (parsed.accentColor) {
            setThemeSettingsState((prev) => ({ ...prev, accentColor: parsed.accentColor }));
          }
          if (parsed.language) setLanguageState(parsed.language);
          attachUserDocListener(parsed.uid);
        }
      } catch (e) {
        console.warn('Failed to parse saved user from storage:', e);
      }
    }

    // 2. Listen to Firebase Auth for OAuth or token accounts
    let unsubscribeAuth = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
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

              await setDoc(userDocRef, cleanFirestoreData(newProfile));
              setUser(newProfile);
              try {
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
              } catch {}
            } else {
              const existingProfile = userSnap.data() as UserProfile;
              setUser(existingProfile);
              try {
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(existingProfile));
              } catch {}
            }
            attachUserDocListener(fbUser.uid);
          } catch (err) {
            console.warn('Error fetching or creating user profile for fbUser:', err);
          }
        }
        // NOTE: We deliberately do NOT wipe localStorage when fbUser is null,
        // because sovereign email/handle authentication persists via secure Firestore session.
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => {
      clearTimeout(timer);
      unsubscribeAuth();
      if (unsubUserDocRef.current) unsubUserDocRef.current();
    };
  }, []);

  // Presence heartbeat interval
  useEffect(() => {
    if (!user?.uid) return;
    updateUserPresence(user).catch(() => {});
    const interval = setInterval(() => {
      updateUserPresence(user).catch(() => {});
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresence(user).catch(() => {});
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [user?.uid]);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      let matchedDoc: UserProfile | null = null;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        matchedDoc = userSnap.data() as UserProfile;
      } else if (fbUser.email) {
        // Check if existing profile matches this email in Firestore
        const q = query(collection(db, 'users'), where('email', '==', fbUser.email.trim().toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          matchedDoc = snap.docs[0].data() as UserProfile;
        }
      }

      if (!matchedDoc) {
        let rawHandle = (fbUser.email?.split('@')[0] || 'user_' + Math.floor(1000 + Math.random() * 9000))
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        if (!rawHandle) rawHandle = 'dev_' + Math.floor(1000 + Math.random() * 9000);
        const isAvailable = await checkHandleAvailable(rawHandle, fbUser.uid);
        const finalHandle = isAvailable ? rawHandle : `${rawHandle}_${Math.floor(100 + Math.random() * 900)}`;

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
          handle: finalHandle,
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalHandle}`,
          bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
          bio: '',
          status: 'online',
          customStatus: '',
          accentColor: (accentColor as any) || 'emerald',
          language: language || 'ru',
          createdAt: Date.now(),
          badges: ['cyber_pioneer'],
          privacy: { profileVisibility: 'all', allowDMs: 'all', showOnlineStatus: true },
          stats: { postsCount: 0, friendsCount: 0, followersCount: 0, followingCount: 0 },
        };
        await setDoc(userDocRef, cleanFirestoreData(newProfile));
        matchedDoc = newProfile;
      }

      setUser(matchedDoc);
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(matchedDoc));
      } catch {}

      attachUserDocListener(matchedDoc.uid || fbUser.uid);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.warn('Firebase Google Auth error:', err?.code, err?.message);
      throw err;
    }
  };

  const signInWithEmail = async (emailOrHandle: string, pass: string) => {
    const queryStr = emailOrHandle.trim().toLowerCase();
    if (!queryStr) {
      throw new Error(language === 'ru' ? 'Введите email или никнейм (@handle)' : 'Please enter your email or handle');
    }
    if (!pass) {
      throw new Error(language === 'ru' ? 'Введите пароль' : 'Please enter your password');
    }

    // Attempt background Firebase Auth sign-in if possible, ignore provider disabled errors
    if (auth && queryStr.includes('@')) {
      try {
        await signInWithEmailAndPassword(auth, queryStr, pass);
      } catch (authErr: any) {
        console.warn('Firebase Auth direct login bypassed:', authErr?.code || authErr?.message);
      }
    }

    // Sovereign Firestore lookup
    let matchedDoc: UserProfile | null = null;
    let docId: string | null = null;

    // 1. Search by email
    if (queryStr.includes('@')) {
      const q = query(collection(db, 'users'), where('email', '==', queryStr));
      const snap = await getDocs(q);
      if (!snap.empty) {
        matchedDoc = snap.docs[0].data() as UserProfile;
        docId = snap.docs[0].id;
      }
    }

    // 2. Search by handle
    if (!matchedDoc) {
      const cleanHandle = queryStr.replace(/^@/, '');
      const q = query(collection(db, 'users'), where('handle', '==', cleanHandle));
      const snap = await getDocs(q);
      if (!snap.empty) {
        matchedDoc = snap.docs[0].data() as UserProfile;
        docId = snap.docs[0].id;
      }
    }

    // 3. Fallback search by email without @
    if (!matchedDoc && !queryStr.includes('@')) {
      const q = query(collection(db, 'users'), where('email', '==', queryStr));
      const snap = await getDocs(q);
      if (!snap.empty) {
        matchedDoc = snap.docs[0].data() as UserProfile;
        docId = snap.docs[0].id;
      }
    }

    if (!matchedDoc || !docId) {
      throw new Error(
        language === 'ru'
          ? 'Пользователь с таким email или никнеймом не найден. Пожалуйста, проверьте введённые данные или зарегистрируйтесь.'
          : 'User with this email or handle was not found. Please check your credentials or create an account.'
      );
    }

    // Password verification
    const inputHash = await hashPassword(pass);
    if (matchedDoc.passwordHash) {
      if (matchedDoc.passwordHash !== inputHash) {
        throw new Error(
          language === 'ru'
            ? 'Неверный пароль. Пожалуйста, проверьте введённые данные.'
            : 'Incorrect password. Please verify and try again.'
        );
      }
    } else {
      // First-time password assignment for pre-existing accounts
      await updateDoc(doc(db, 'users', docId), { passwordHash: inputHash }).catch(() => {});
      matchedDoc.passwordHash = inputHash;
    }

    if (!matchedDoc.uid) {
      matchedDoc.uid = docId;
    }

    setUser(matchedDoc);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(matchedDoc));
    } catch {}

    attachUserDocListener(matchedDoc.uid);
    setIsAuthModalOpen(false);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string, handle: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanHandle =
      handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error(language === 'ru' ? 'Укажите корректный адрес электронной почты' : 'Valid email address is required');
    }
    if (!pass || pass.length < 6) {
      throw new Error(language === 'ru' ? 'Пароль должен содержать от 6 символов' : 'Password must be at least 6 characters');
    }
    if (!cleanHandle) {
      throw new Error(language === 'ru' ? 'Укажите никнейм (@handle)' : 'Developer handle is required');
    }

    // 1. Check handle availability
    const isAvailable = await checkHandleAvailable(cleanHandle);
    if (!isAvailable) {
      throw new Error(
        language === 'ru'
          ? `Никнейм @${cleanHandle} уже занят. Пожалуйста, выберите другой никнейм.`
          : `Username @${cleanHandle} is already taken. Please choose another one.`
      );
    }

    // 2. Check email uniqueness
    const emailQ = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) {
      throw new Error(
        language === 'ru'
          ? `Пользователь с адресом ${cleanEmail} уже зарегистрирован. Перейдите во вкладку «Вход».`
          : `Account with email ${cleanEmail} already exists. Please sign in instead.`
      );
    }

    // 3. Optional background Firebase Auth user creation
    let fbUid: string | null = null;
    if (auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        fbUid = cred.user.uid;
      } catch (authErr: any) {
        console.warn('Firebase Auth direct user create bypassed:', authErr?.code || authErr?.message);
      }
    }

    const uid = fbUid || 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    const passwordHash = await hashPassword(pass);

    const newProfile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanHandle,
      handle: cleanHandle,
      passwordHash,
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
    await setDoc(doc(db, 'users', uid), cleaned);

    setUser(newProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
    } catch {}

    attachUserDocListener(uid);
    setIsAuthModalOpen(false);
  };

  const resetPassword = async (emailOrHandle: string, newPass: string) => {
    const queryStr = emailOrHandle.trim().toLowerCase();
    if (!queryStr) {
      throw new Error(language === 'ru' ? 'Введите email или никнейм' : 'Enter email or handle');
    }
    if (!newPass || newPass.length < 6) {
      throw new Error(language === 'ru' ? 'Новый пароль должен содержать минимум 6 символов' : 'Password must be at least 6 chars');
    }

    let docId: string | null = null;
    let matchedDoc: UserProfile | null = null;

    if (queryStr.includes('@')) {
      const q = query(collection(db, 'users'), where('email', '==', queryStr));
      const snap = await getDocs(q);
      if (!snap.empty) {
        docId = snap.docs[0].id;
        matchedDoc = snap.docs[0].data() as UserProfile;
      }
    }

    if (!docId) {
      const cleanHandle = queryStr.replace(/^@/, '');
      const q = query(collection(db, 'users'), where('handle', '==', cleanHandle));
      const snap = await getDocs(q);
      if (!snap.empty) {
        docId = snap.docs[0].id;
        matchedDoc = snap.docs[0].data() as UserProfile;
      }
    }

    if (!docId || !matchedDoc) {
      throw new Error(
        language === 'ru'
          ? 'Пользователь с таким адресом или никнеймом не найден.'
          : 'User with this email or handle was not found.'
      );
    }

    const newHash = await hashPassword(newPass);
    await updateDoc(doc(db, 'users', docId), { passwordHash: newHash });

    matchedDoc.passwordHash = newHash;
    if (!matchedDoc.uid) matchedDoc.uid = docId;

    setUser(matchedDoc);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(matchedDoc));
    } catch {}

    attachUserDocListener(matchedDoc.uid);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    if (unsubUserDocRef.current) {
      unsubUserDocRef.current();
      unsubUserDocRef.current = null;
    }
    if (auth && auth.currentUser) {
      await fbSignOut(auth).catch(() => {});
    }
    setUser(null);
    setFirebaseUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } catch {}
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

    if (updates.customization?.themeSettings) {
      setThemeSettingsState((prev) => ({ ...prev, ...updates.customization!.themeSettings }));
    } else if (updates.accentColor) {
      setThemeSettingsState((prev) => ({ ...prev, accentColor: updates.accentColor! }));
    }
    if (updates.language) {
      setLanguageState(updates.language);
    }

    if (db && user.uid) {
      try {
        const cleaned = cleanFirestoreData(cleanUpdates);
        await setDoc(doc(db, 'users', user.uid), cleaned, { merge: true });
        // Automatically sync updated name/handle/avatar to conversation and post documents
        syncUserProfileToConversations(updated).catch(() => {});
        syncUserProfileToPosts(updated).catch(() => {});
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
        themeSettings,
        setThemeSettings,
        applyPreset,
        resetThemeSettings,
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
        resetPassword,
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

