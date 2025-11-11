import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, LogOut, CircleHelp as HelpCircle, Info, Camera, Key, Trash2, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import { ChangePassword } from '@/components/profile/ChangePassword';
import { apiPost } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themeColors = {
  student: {
    primary: '#2563EB',
    secondary: '#E0F2FE',
  },
  admin: {
    primary: '#DC2626',
    secondary: '#FEE2E2',
  },
  staff: {
    primary: '#10B981',
    secondary: '#D1FAE5',
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfileImage } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteDbModal, setShowDeleteDbModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingDb, setDeletingDb] = useState(false);
  
  const themeColor = useMemo(
    () =>
    themeColors[user?.role === 'admin' ? 'admin' : 'student'],
    [user?.role]
  );
  const colors = themeColors[user?.role || 'student'];

  // Role-based gradient colors
  const getGradientColors = (): [string, string] => {
    if (user?.role === 'admin') return ['#450A0A', '#7F1D1D'];
    if (user?.role === 'staff') return ['#064E3B', '#065F46'];
    return ['#0F172A', '#1E293B'];
  };

  const getTextColor = () => {
    if (user?.role === 'admin') return '#FECACA';
    if (user?.role === 'staff') return '#D1FAE5';
    return '#E5EDFF';
  };

  const handleUpdateProfileImage = async () => {
    try {
      // Request permission explicitly for reliability across platforms
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // New API shape: array of media types; cast to any to satisfy TS in some Expo versions
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await updateProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
    }
  };

  const handleLogout = () => {
    setConfirmVisible(true);
  };

  const confirmLogout = async () => {
    setConfirmVisible(false);
    await logout();
    router.replace('/login');
  };

  const handleHelp = () => {
    router.push('/help');
  };

  const handleAbout = () => {
    router.push('/about');
  };

  const handleDeleteDatabase = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setDeletingDb(true);
      const token = await AsyncStorage.getItem('token');
      
      await apiPost('/auth/delete-reports', {
        password: deletePassword
      }, token || undefined);

      Alert.alert(
        'Reports Deleted', 
        'All reports have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteDbModal(false);
              setDeletePassword('');
              logout();
              router.replace('/login');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Delete database error:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to delete database';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingDb(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.header, { shadowColor: themeColor.primary }]}>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Profile</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

      <LinearGradient
        colors={isDark ? getGradientColors() : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.profileCard,
          { shadowColor: themeColor.primary, borderColor: theme.colors.border },
          !isDark && {
            // stronger, soft shadow in light mode
            shadowColor: '#27445D',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
            elevation: 8,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleUpdateProfileImage}
        >
          {user?.profileImage ? (
            <Image 
              source={{ uri: user.profileImage }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <User size={32} color={'#FFFFFF'} />
            </View>
          )}
          <View style={[styles.cameraIconOverlay, { backgroundColor: themeColor.primary }]}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
        <Text style={[styles.roleText, { color: '#E0ECFF' }]}>
          {user?.role === 'admin' ? 'Administrator' : user?.role === 'staff' ? 'Staff' : 'Student'}
        </Text>
        <View style={[styles.idContainer, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={[styles.idText, { color: '#E5EDFF' }]}>
            {user?.role === 'admin' 
              ? `Admin ID: ${(user as any)?.staff_id}` 
              : user?.role === 'staff'
              ? `Staff ID: ${(user as any)?.staff_id}`
              : `Student ID: ${(user as any)?.student_id}`
            }
          </Text>
        </View>
        
        {/* Password Change Button - For all users */}
        {user && (
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={styles.menuContainer}>
        {/* Dark mode toggle temporarily removed */}

        <TouchableOpacity style={styles.menuItemOuter} onPress={handleHelp}>
          <LinearGradient
            colors={isDark ? getGradientColors() : ['#71BBB2', '#71BBB2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.menuItemGradient,
              { borderColor: theme.colors.border },
              !isDark && {
                shadowColor: '#27445D',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.16,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            <HelpCircle size={20} color={'#FFFFFF'} />
            <Text style={[styles.menuText, { color: '#FFFFFF' }]}>Help & Support</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItemOuter} onPress={handleAbout}>
          <LinearGradient
            colors={isDark ? getGradientColors() : ['#71BBB2', '#71BBB2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.menuItemGradient,
              { borderColor: theme.colors.border },
              !isDark && {
                shadowColor: '#27445D',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.16,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            <Info size={20} color={'#FFFFFF'} />
            <Text style={[styles.menuText, { color: '#FFFFFF' }]}>About FixIt</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="primary"
        style={[styles.logoutButton, { backgroundColor: '#EF4444', borderColor: '#EF4444', shadowColor: '#EF4444' }]}
        textStyle={[styles.logoutText, { color: '#FFFFFF' }]}
      />

      {user?.role === 'admin' && (
        <Button
          title="Add Admin"
          onPress={() => router.push({ pathname: '/create-admin' })}
          variant="secondary"
          style={{ marginTop: 12, backgroundColor: '#27445D', borderColor: '#27445D', shadowColor: '#27445D' }}
          textStyle={{ color: '#FFFFFF' }}
        />
      )}

      {user?.role === 'admin' && (
        <Button
          title="Add Staff"
          onPress={() => router.push({ pathname: '/create-staff' })}
          variant="secondary"
          style={{ marginTop: 12, backgroundColor: '#10B981', borderColor: '#10B981', shadowColor: '#10B981' }}
          textStyle={{ color: '#FFFFFF' }}
        />
      )}
      
      </ScrollView>

      {/* Themed Logout Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalButton, { backgroundColor: isDark ? '#2A2A2E' : '#F1F5F9', borderColor: theme.colors.border }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalButton, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              >
                <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={[styles.modalCard, { backgroundColor: theme.colors.background, flex: 1, marginTop: 50 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.modalButton}
            >
              <Text style={[styles.modalButtonText, { color: themeColor.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ChangePassword />
        </View>
      </Modal>

      {/* Database Deletion Modal */}
      <Modal
        visible={showDeleteDbModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteDbModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: '#DC2626', borderWidth: 2 }]}>
            <View style={styles.dangerHeader}>
              <AlertTriangle size={32} color="#DC2626" />
              <Text style={[styles.dangerTitle, { color: '#DC2626' }]}>DANGER ZONE</Text>
            </View>
            
            <Text style={[styles.dangerWarning, { color: theme.colors.text }]}>
              This will permanently delete ALL reports including:
            </Text>
            
            <View style={styles.dangerList}>
              <Text style={[styles.dangerItem, { color: theme.colors.text }]}>• All student reports</Text>
              <Text style={[styles.dangerItem, { color: theme.colors.text }]}>• All report history</Text>
              <Text style={[styles.dangerItem, { color: theme.colors.text }]}>• All notes and data</Text>
              <Text style={[styles.dangerItem, { color: '#DC2626', fontWeight: 'bold' }]}>• THIS CANNOT BE UNDONE!</Text>
            </View>

            <Text style={[styles.passwordLabel, { color: theme.colors.text }]}>
              Enter your admin password to confirm:
            </Text>
            
            <TextInput
              style={[styles.passwordInput, { 
                borderColor: '#DC2626', 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="Admin password"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteDbModal(false);
                  setDeletePassword('');
                }}
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteDatabase}
                disabled={deletingDb}
                style={[styles.modalButton, { backgroundColor: '#DC2626', borderColor: '#DC2626', opacity: deletingDb ? 0.6 : 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {deletingDb ? 'Deleting...' : 'DELETE DATABASE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  idContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  idText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  menuText: {
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  logoutButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
  },
  // Gradient menu item wrappers
  menuItemOuter: {
    marginBottom: 8,
    borderRadius: 16,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    // mimic elevation/shadow from original card
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  passwordButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  passwordButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dangerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dangerWarning: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  dangerList: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dangerItem: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
});