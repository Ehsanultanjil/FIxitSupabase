import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function CreateStaffScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [nextStaffId, setNextStaffId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch next staff ID on mount
  useEffect(() => {
    fetchNextStaffId();
  }, []);

  const fetchNextStaffId = async () => {
    try {
      console.log('🔍 Fetching next staff ID...');
      
      // Get the highest staff_id that doesn't start with '9' (non-admin staff)
      const { data, error } = await supabase
        .from('users')
        .select('staff_id')
        .eq('role', 'staff')
        .not('staff_id', 'is', null)
        .order('staff_id', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextId = '5001'; // Default starting staff ID
      if (data && data.length > 0) {
        const lastId = parseInt(data[0].staff_id);
        nextId = String(lastId + 1);
      }
      
      console.log('✅ Next staff ID:', nextId);
      setNextStaffId(nextId);
    } catch (e) {
      console.log('Failed to fetch next staff ID:', e);
      setNextStaffId('5001'); // Default to 5001 if fetch fails
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert('Forbidden', 'Only admins can create staff accounts.');
      router.back();
      return;
    }
  }, [user]);

  const handleCreate = async () => {
    if (!name || !password) {
      Alert.alert('Missing info', 'Please fill Name and Password.');
      return;
    }

    setLoading(true);
    try {
      console.log('👤 Creating staff with ID:', nextStaffId);
      
      // Generate UUID helper
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Insert staff directly - password will be hashed by trigger
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: generateId(),
          email: `staff${nextStaffId}@internal.local`,
          name: name,
          role: 'staff',
          staff_id: nextStaffId,
          password_hash: password, // Will be hashed by SQL trigger
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      console.log('✅ Staff created successfully');
      
      Alert.alert('Success', `Staff ${name} created successfully!\n\nID: ${nextStaffId}\nPassword: ${password}\n\nThey can login with ID ${nextStaffId}`);
      setName('');
      setPassword('');
      
      // Refresh next staff ID after creation
      await fetchNextStaffId();
    } catch (e: any) {
      console.error('Create staff error:', e);
      const msg = e?.message || 'Failed to create staff';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={theme.colors.text} />
        <Text style={[styles.backText, { color: theme.colors.text }]}>Back</Text>
      </TouchableOpacity>

      <LinearGradient
        colors={isDark ? ['#064E3B', '#065F46'] : ['#10B981', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Create Staff</Text>
        <Text style={[styles.subtitle, { color: '#E7F8F1' }]}>Add a staff account for assignments</Text>
      </LinearGradient>

      <View style={styles.form}>
        {nextStaffId && (
          <View style={[styles.infoBox, { backgroundColor: isDark ? '#065F46' : '#D1FAE5', borderColor: '#10B981' }]}>
            <Text style={[styles.infoText, { color: isDark ? '#D1FAE5' : '#065F46' }]}>
              🆔 Next Staff ID: <Text style={{ fontWeight: '700' }}>{nextStaffId}</Text>
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Staff Name"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Set a password"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} 
          secureTextEntry
        />

        <Button
          title={loading ? 'Creating…' : 'Create Staff'}
          onPress={handleCreate}
          disabled={loading}
          style={[styles.submit, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
          textStyle={{ color: '#FFFFFF' }}
        />
        {loading && <ActivityIndicator style={{ marginTop: 12 }} color={'#10B981'} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submit: {
    marginTop: 10,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
