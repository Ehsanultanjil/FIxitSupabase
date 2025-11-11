import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import { StudentReports } from '@/components/reports/StudentReports';
import { AdminReports } from '@/components/reports/AdminReports';
import { StaffReports } from '@/components/reports/StaffReports';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
      {user?.role === 'admin' ? (
        <AdminReports />
      ) : user?.role === 'staff' ? (
        <StaffReports />
      ) : (
        <StudentReports />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});