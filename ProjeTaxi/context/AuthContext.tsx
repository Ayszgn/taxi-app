import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { auth } from '@/config/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut as firebaseSignOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';

type AuthContextType = {
  isAuthenticated: boolean;
  userType: 'passenger' | 'driver' | null;
  user: User | null;
  signIn: (email: string, password: string, type: 'passenger' | 'driver') => Promise<void>;
  signUp: (email: string, password: string, type: 'passenger' | 'driver', name: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

const db = getFirestore();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'passenger' | 'driver' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const loadUserType = async () => {
      try {
        const savedUserType = await AsyncStorage.getItem('userType');
        if (savedUserType) {
          setUserType(savedUserType as 'passenger' | 'driver');
        }
      } catch (error) {
        console.error('Kullanıcı tipi yüklenirken hata:', error);
      }
    };

    loadUserType();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setUser(user);
      setIsAuthenticated(!!user);
      
      if (!user) {
        await AsyncStorage.removeItem('userType');
        setUserType(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (userType === 'passenger') {
        router.replace('/(passenger-tabs)/home');
      } else if (userType === 'driver') {
        router.replace('/(driver-tabs)/home');
      }
    }
  }, [isAuthenticated, segments, userType]);

  const signIn = async (email: string, password: string, type: 'passenger' | 'driver') => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      if (!userData || userData.userType !== type) {
        await firebaseSignOut(auth);
        throw new Error(`Bu hesap bir ${type === 'passenger' ? 'yolcu' : 'sürücü'} hesabı değil`);
      }

      await AsyncStorage.setItem('userType', type);
      setUserType(type);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, type: 'passenger' | 'driver', name: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          userType: type,
          name,
          email,
          createdAt: new Date(),
        });

        await AsyncStorage.setItem('userType', type);
        setUserType(type);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('userType');
      setUserType(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        userType, 
        user,
        signIn, 
        signUp,
        signOut,
        error 
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 