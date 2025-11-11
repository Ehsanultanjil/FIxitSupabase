import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student'>('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const validateStudentId = (id: string) => {
    return /^\d{11}$/.test(id);
  };

  const validateStaffId = (id: string) => {
    return /^\d{6,10}$/.test(id);
  };

const handleRegister = async () => {
  if (!name || !studentId || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  if (!validateStudentId(studentId)) {
    Alert.alert('Error', 'Student ID must be 11 digits');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters long');
    return;
  }

  setLoading(true);

  try {
    const ok = await register(name, studentId, password);
    if (ok) {
      Alert.alert(
        'Success',
        'Registration successful! Please login with your Student ID and password.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } else {
      Alert.alert('Error', 'Registration failed');
    }
  } catch (error: any) {
    console.error(error);
    Alert.alert('Error', error?.response?.data?.error || 'Registration failed');
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Registration</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Student Registration</Text>
          </View>

          <View style={styles.warningBox}>
            <View style={styles.warningRow}>
              <AlertTriangle size={18} color="#B45309" />
              <Text style={styles.warningTitle}>Important</Text>
            </View>
            <Text style={styles.warningText}>Your name and ID cannot be changed later.</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          {selectedRole === 'student' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Student ID</Text>
              <TextInput
                style={styles.input}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="Enter your 11-digit student ID"
                keyboardType="numeric"
                maxLength={11}
              />
              <Text style={styles.helperText}>
                Must be 11 digits
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Staff ID</Text>
              <TextInput
                style={styles.input}
                value={staffId}
                onChangeText={setStaffId}
                placeholder="Enter your staff ID (6-10 digits)"
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.helperText}>
                Must be 6-10 digits
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
            />
            <Text style={styles.helperText}>
              Must be at least 6 characters
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter your password again"
              secureTextEntry
            />
          </View>

          <Button
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={handleRegister}
            disabled={loading}
            style={styles.registerButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  helperText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  registerButton: {
    marginTop: 12,
  },
  roleSelector: {
    gap: 12,
  },
  roleLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
  },
});
