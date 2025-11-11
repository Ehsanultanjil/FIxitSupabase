import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { uploadImageAsync } from '@/utils/cloudinary';
import { supabase, getUserProfile } from '@/config/supabase';


interface AuthContextType {
  user: User | null;
  login: (id: string, password: string, role: 'student' | 'admin' | 'staff') => Promise<boolean>;
  register: (name: string, studentId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfileImage: (imageUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bootstrap from AsyncStorage (no Supabase Auth session)
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser) as User);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth bootstrap error:', e);
        setUser(null);
        await AsyncStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (id: string, password: string, role: 'student' | 'admin' | 'staff'): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login with ID:', id, 'Role:', role);

      // Call custom verify_login function
      const { data, error } = await supabase.rpc('verify_login', {
        p_identifier: id,
        p_password: password,
        p_role: role
      });

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ Login failed:', data.error);
        throw new Error(data.error || 'Invalid credentials');
      }

      console.log('✅ Auth successful, user:', data.user);

      const userData = data.user;
      setUser(userData as User);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      const errMsg = error?.message || 'Login failed. Please check your credentials.';
      console.error('❌ Login error:', errMsg, error);
      return false;
    }
  };

  const register = async (name: string, studentId: string, password: string): Promise<boolean> => {
    try {
      console.log('📝 Registering student with ID:', studentId);

      // Check if student_id already exists
      const { data: existing } = await supabase
        .from('users')
        .select('student_id')
        .eq('student_id', studentId)
        .single();

      if (existing) {
        throw new Error('Student ID already exists');
      }

      // Generate a simple UUID-like string
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Create user - password will be hashed by SQL trigger
      const newUser = {
        id: generateId(),
        email: `student${studentId}@internal.local`, // Internal only, never displayed
        name,
        role: 'student',
        student_id: studentId,
        password_hash: password, // Will be hashed by SQL trigger
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: userData, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Student registered successfully');

      setUser(userData as User);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      console.error('Registration error:', error?.message || error);
      return false;
    }
  };


  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfileImage = async (imageUri: string) => {
    if (!user) return;
    try {
      // 1) Upload to Cloudinary
      const uploaded = await uploadImageAsync(imageUri, { folder: 'profile-avatars' });
      const url = uploaded.secure_url;

      // 2) Update Supabase directly
      const { error } = await supabase
        .from('users')
        .update({ profile_image: url })
        .eq('id', user.id);

      if (error) throw error;

      // 3) Update local state and storage
      const updatedUser = { ...user, profile_image: url };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser as User);
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      console.error('Error updating profile image:', msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}