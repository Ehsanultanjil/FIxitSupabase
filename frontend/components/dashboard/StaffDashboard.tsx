import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import { FileText, Clock, CheckCircle, Play } from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Report {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function StaffDashboard() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      console.log('📊 StaffDashboard: Loading assigned reports for staff:', (user as any)?.staff_id);
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, status, priority')
        .eq('assigned_to', (user as any)?.staff_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Assigned reports loaded:', data?.length || 0);
      
      const items = (data || []).map((r: any) => ({
        id: r.id,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: r.priority || 'low',
      })) as Report[];
      setReports(items);
    } catch (e) {
      setReports([]);
      console.error('Load assigned reports error:', e);
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

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    completed: reports.filter(r => r.status === 'completed').length,
  };

  const goToMyJobs = () => {
    router.push('/reports');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: '#000000' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
      }
    > 
      <LinearGradient
        colors={isDark ? ['#064E3B', '#065F46'] : ['#27445D', '#27445D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { borderColor: 'rgba(100,255,150,0.2)', borderWidth: 1.5 }]}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Staff Dashboard</Text>
        <Text style={[styles.subtitle, { color: '#D1FAE5' }]}>Your assigned jobs at a glance</Text>
      </LinearGradient>

      <View style={styles.grid}>
        <LinearGradient
          colors={isDark ? ['#064E3B', '#065F46'] : ['#27445D', '#27445D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: isDark ? 'rgba(100,255,150,0.2)' : '#1F3A52', borderWidth: 1.5 }]}
        >
          <View style={styles.statRow}>
            <FileText size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.total}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? '#D1FAE5' : '#E0ECFF' }]}>Assigned</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#064E3B', '#065F46'] : ['#27445D', '#27445D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: isDark ? 'rgba(100,255,150,0.2)' : '#1F3A52', borderWidth: 1.5 }]}
        >
          <View style={styles.statRow}>
            <Clock size={20} color={theme.colors.warning} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.pending}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? '#D1FAE5' : '#E0ECFF' }]}>Pending</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#064E3B', '#065F46'] : ['#27445D', '#27445D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: isDark ? 'rgba(100,255,150,0.2)' : '#1F3A52', borderWidth: 1.5 }]}
        >
          <View style={styles.statRow}>
            <Play size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.inProgress}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? '#D1FAE5' : '#E0ECFF' }]}>In Progress</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#064E3B', '#065F46'] : ['#27445D', '#27445D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: isDark ? 'rgba(100,255,150,0.2)' : '#1F3A52', borderWidth: 1.5 }]}
        >
          <View style={styles.statRow}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{loading ? '...' : stats.completed}</Text>
          </View>
          <Text style={[styles.statLabel, { color: isDark ? '#D1FAE5' : '#E0ECFF' }]}>Completed</Text>
        </LinearGradient>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={goToMyJobs}>
        <Text style={styles.buttonText}>View My Jobs</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 14 },
  grid: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 16, padding: 16, borderWidth: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 14, fontWeight: '600' },
  button: { marginHorizontal: 24, marginTop: 12, padding: 16, borderRadius: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
});
