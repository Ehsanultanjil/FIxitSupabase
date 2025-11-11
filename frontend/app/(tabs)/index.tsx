import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { useTheme } from '@/components/common/ThemeProvider';
import StaffDashboard from '@/components/dashboard/StaffDashboard';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (user?.role === 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}> 
        <AdminDashboard />
      </View>
    );
  }
  if (user?.role === 'staff') {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}> 
        <StaffDashboard />
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#000000' }]}
      contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <StudentDashboard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});