import { User, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase.config';
import { AuthService, UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Charger le profil utilisateur
        const profile = await AuthService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        
        // Sauvegarder localement
        await AsyncStorage.setItem('userId', firebaseUser.uid);
      } else {
        setUserProfile(null);
        await AsyncStorage.removeItem('userId');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await AuthService.login(email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    await AuthService.register(email, password, displayName);
  };

  const logout = async () => {
    await AuthService.logout();
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await AuthService.getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      login, 
      register, 
      logout,
      refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};