import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { supabase } from '@/config/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function CreateAdminScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextAdminId, setNextAdminId] = useState<string>('');
  const [fetchingId, setFetchingId] = useState(true);

  // Fetch next available Admin ID on component mount
  React.useEffect(() => {
    const fetchNextAdminId = async () => {
      try {
        setFetchingId(true);
        console.log('🔍 Fetching next admin ID...');
        
        // Get the highest staff_id that starts with '9' (admin IDs)
        const { data, error } = await supabase
          .from('users')
          .select('staff_id')
          .eq('role', 'admin')
          .not('staff_id', 'is', null)
          .order('staff_id', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        let nextId = '9001'; // Default starting admin ID
        if (data && data.length > 0) {
          const lastId = parseInt(data[0].staff_id);
          nextId = String(lastId + 1);
        }
        
        console.log('✅ Next admin ID:', nextId);
        setNextAdminId(nextId);
      } catch (e) {
        console.error('Failed to fetch next admin ID', e);
        setNextAdminId('9001'); // Default to 9001 if fetch fails
      } finally {
        setFetchingId(false);
      }
    };
    fetchNextAdminId();
  }, []);

  const handleCreate = async () => {
    if (!name || !password) {
      Alert.alert('Missing info', 'Please fill Name and Password.');
      return;
    }

    setLoading(true);
    try {
      console.log('👤 Creating admin with ID:', nextAdminId);
      
      // Generate UUID helper
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Insert admin directly - password will be hashed by trigger
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: generateId(),
          email: `staff${nextAdminId}@internal.local`,
          name: name,
          role: 'admin',
          staff_id: nextAdminId,
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

      console.log('✅ Admin created successfully');
      
      Alert.alert('Success', `Admin ${name} created successfully!\n\nID: ${nextAdminId}\nPassword: ${password}\n\nThey can login with ID ${nextAdminId}`);
      setName('');
      setPassword('');
      
      // Calculate next admin ID
      setNextAdminId(String(Number(nextAdminId) + 1));
    } catch (e: any) {
      console.error('Create admin error:', e);
      const msg = e?.message || 'Failed to create admin';
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
        colors={isDark ? ['#450A0A', '#7F1D1D'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { borderColor: 'rgba(255,100,100,0.2)', borderWidth: 1.5 }]}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Create Admin</Text>
        <Text style={[styles.subtitle, { color: '#FECACA' }]}>Add a new admin account</Text>
      </LinearGradient>

      <View style={styles.form}> 
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)', borderColor: '#DC2626' }]}>
          {fetchingId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#DC2626" />
              <Text style={[styles.infoText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                Loading next Admin ID...
              </Text>
            </View>
          ) : (
            <Text style={[styles.infoText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              🆔 Next Admin ID: <Text style={{ fontWeight: '700', fontSize: 15 }}>{nextAdminId}</Text>
            </Text>
          )}
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Admin Name"
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
          title={loading ? 'Creating…' : 'Create Admin'}
          onPress={handleCreate}
          disabled={loading}
          style={styles.submit}
        />
        {loading && <ActivityIndicator style={{ marginTop: 12 }} color={theme.colors.primary} />}
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
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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
  helpBox: {
    marginTop: 18,
  },
  helpText: {
    fontSize: 12,
  },
});
