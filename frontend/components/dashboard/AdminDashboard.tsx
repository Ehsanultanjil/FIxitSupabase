import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import { FileText, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, User } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';

interface Report {
  id: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DashboardStats {
  totalReports: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

// Removed hardcoded admin palette in favor of theme-driven colors

export function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDark } = useTheme();

  const loadReports = async () => {
    try {
      console.log('📊 AdminDashboard: Loading reports...');
      const { data, error } = await supabase
        .from('reports')
        .select('id, status, priority')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Reports loaded:', data?.length || 0);
      const items = (data || []).map((r: any) => ({
        id: r.id,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: r.priority || 'low',
      })) as Report[];
      setReports(items);
    } catch (e) {
      console.error('Load reports error:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadReports();
      setLoading(false);
    })();
  }, []);

  const stats: DashboardStats = {
    totalReports: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'completed').length,
    urgent: reports.filter(r => r.priority === 'urgent').length,
  };

  const handleManageReports = () => {
    router.push('/reports');
  };
  // Removed Add Admin navigation from dashboard

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: '#000000' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
      }
    > 
      {isDark ? (
        <LinearGradient
          colors={["#450A0A", "#7F1D1D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.header,
            { shadowColor: '#DC2626', borderColor: 'rgba(255,100,100,0.2)', borderWidth: 1.5, paddingTop: 32, marginBottom: 16 },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={{ ...styles.welcomeText, color: '#FEE2E2' }}>Admin Dashboard</Text>
              <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
              <Text style={[styles.subtitleText, { color: '#FECACA' }]}>Staff ID: {(user as any)?.staff_id || user?.staffId}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              {((user as any)?.profile_image || user?.profileImage) ? (
                <Image source={{ uri: (user as any)?.profile_image || user?.profileImage }} style={styles.profileImage} />
              ) : (
                <User size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        <View style={{ ...styles.header, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', borderWidth: 1, paddingTop: 32, marginBottom: 16 }}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={{ ...styles.welcomeText, color: '#E5EDFF' }}>Admin Dashboard</Text>
              <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
              <Text style={[styles.subtitleText, { color: '#BFD2FF' }]}>Staff ID: {(user as any)?.staff_id || user?.staffId}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              {((user as any)?.profile_image || user?.profileImage) ? (
                <Image source={{ uri: (user as any)?.profile_image || user?.profileImage }} style={styles.profileImage} />
              ) : (
                <User size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.statsGrid, isDark && { gap: 8, marginBottom: 16 }, !isDark && { gap: 8, marginBottom: 16 }]}>
        {isDark ? (
          <LinearGradient
            colors={["#450A0A", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1.5, borderColor: 'rgba(255,100,100,0.2)', shadowColor: '#DC2626', padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.totalReports}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#FECACA' }]}>Total Reports</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.totalReports}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Total Reports</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#450A0A", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1.5, borderColor: 'rgba(255,100,100,0.2)', shadowColor: '#DC2626', padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Clock size={20} color={theme.colors.warning} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#FECACA' }]}>Pending</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Clock size={20} color={theme.colors.warning} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Pending</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#450A0A", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1.5, borderColor: 'rgba(255,100,100,0.2)', shadowColor: '#DC2626', padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#FECACA' }]}>In Progress</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <FileText size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>In Progress</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#450A0A", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1.5, borderColor: 'rgba(255,100,100,0.2)', shadowColor: '#DC2626', padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <CheckCircle size={20} color={theme.colors.success} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.resolved}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#FECACA' }]}>Resolved</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <CheckCircle size={20} color={theme.colors.success} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.resolved}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Resolved</Text>
          </Card>
        )}

        {isDark ? (
          <LinearGradient
            colors={["#450A0A", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderWidth: 1.5, borderColor: 'rgba(255,100,100,0.2)', shadowColor: '#DC2626', padding: 16 }]}
          >
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <AlertTriangle size={20} color={theme.colors.error} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.urgent}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#FECACA' }]}>Urgent Issues</Text>
          </LinearGradient>
        ) : (
          <Card style={{ ...styles.statCard, backgroundColor: '#27445D', shadowColor: '#27445D', borderColor: '#1F3A52', padding: 16 }}>
            <View style={{ ...styles.statRow, backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <AlertTriangle size={20} color={'#F87171'} />
              <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.urgent}</Text>
            </View>
            <Text style={[styles.statLabel, { color: '#E0ECFF' }]}>Urgent Issues</Text>
          </Card>
        )}
      </View>

      <View style={{ marginHorizontal: 24, marginTop: 8, marginBottom: 24, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity 
          style={[styles.manageButton, { backgroundColor: '#DC2626', flex: 1 }]} 
          onPress={handleManageReports}
        >
          <Text style={styles.manageButtonText}>Manage Reports</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  statsGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  urgentCard: {
    margin: 24,
    marginTop: 0,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  urgentNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  urgentLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manageButton: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});