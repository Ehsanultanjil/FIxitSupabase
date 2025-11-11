import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useTheme } from '@/components/common/ThemeProvider';

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>About FixIt</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
        <Card style={[styles.logoCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.logo, { color: theme.colors.primary }]}>FixIt</Text>
          <Text style={[styles.logoSubtitle, { color: theme.colors.textSecondary }]}>University Maintenance Reporting</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary, backgroundColor: theme.colors.background }]}>Version 1.0.0</Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Our Mission</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            FixIt streamlines the maintenance reporting process for university facilities, ensuring that issues are quickly identified, tracked, and resolved to maintain a safe and comfortable learning environment for all students and staff.
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Key Features</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            • Easy issue reporting with photo documentation{'\n'}
            • Real-time status tracking and updates{'\n'}
            • Priority-based issue categorization{'\n'}
            • Comprehensive admin dashboard{'\n'}
            • Activity timeline and history{'\n'}
            • Campus-wide issue visibility
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Development Team</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            FixIt was developed by the University IT Department in collaboration with Facilities Management to create a modern, user-friendly solution for campus maintenance reporting.
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy & Security</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            We take your privacy seriously. All reports and personal information are securely stored and only accessible to authorized maintenance staff and administrators. Photos and descriptions are used solely for maintenance purposes.
          </Text>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Feedback</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            We're constantly working to improve FixIt. If you have suggestions, encounter bugs, or need assistance, please don't hesitate to contact our support team through the Help section.
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            © 2024 University IT Department
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            All rights reserved
          </Text>
        </View>
      </ScrollView>
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
  logoCard: {
    alignItems: 'center',
    padding: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  version: {
    fontSize: 14,
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});