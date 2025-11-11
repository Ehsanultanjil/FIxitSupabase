import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useTheme } from '@/components/common/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HelpScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteReports = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await apiPost('/auth/delete-reports', {
        password: deletePassword
      }, token || undefined);

      Alert.alert(
        'Reports Deleted', 
        `Successfully deleted ${response.deletedCount} reports. All report history has been cleared.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteModal(false);
              setDeletePassword('');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Delete reports error:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to delete reports';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>What is FixIt?</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            FixIt is the university's official maintenance reporting system. Students and staff can easily report maintenance issues around campus and track their resolution status in real-time.
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>How to Submit a Report</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            1. Tap "Report New Issue" from your dashboard{'\n'}
            2. Fill in the issue title and description{'\n'}
            3. Specify the building and room location{'\n'}
            4. Optionally add a photo to help identify the issue{'\n'}
            5. Submit your report
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tracking Your Reports</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            You can view all your submitted reports in the "My Reports" section. Each report shows its current status:
            {'\n\n'}• Pending: Report received, waiting for review{'\n'}
            • In Progress: Maintenance team is working on the issue{'\n'}
            • Resolved: Issue has been fixed
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priority Levels</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            Reports are automatically categorized by priority:
            {'\n\n'}• Urgent: Safety hazards, security issues{'\n'}
            • High: Equipment failures affecting classes{'\n'}
            • Medium: General maintenance needs{'\n'}
            • Low: Cosmetic or minor issues
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Support</Text>
          <View style={styles.contactContainer}>
            <View style={styles.contactRow}>
              <Mail size={20} color={theme.colors.primary} />
              <Text style={[styles.contactText, { color: theme.colors.primary }]}></Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={20} color={theme.colors.primary} />
              <Text style={[styles.contactText, { color: theme.colors.primary }]}>(880) 123-4567</Text>
            </View>
          </View>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            For urgent issues outside business hours, contact campus security at 1234 5678.
          </Text>
          
          {/* Secret Admin Function - Hidden in plain sight */}
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.secretButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.secretButtonText}>System Maintenance</Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>

      {/* Delete Reports Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: '#DC2626', borderWidth: 2 }]}>
            <View style={styles.dangerHeader}>
              <AlertTriangle size={32} color="#DC2626" />
              <Text style={[styles.dangerTitle, { color: '#DC2626' }]}>CLEAR REPORTS</Text>
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
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteReports}
                disabled={deleting}
                style={[styles.modalButton, { backgroundColor: '#DC2626', borderColor: '#DC2626', opacity: deleting ? 0.6 : 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {deleting ? 'Deleting...' : 'DELETE REPORTS'}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  contactContainer: {
    marginVertical: 16,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  secretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  secretButtonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
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
    borderWidth: 2,
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
});