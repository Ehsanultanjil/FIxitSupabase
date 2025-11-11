import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/common/ThemeProvider';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Play, CheckCircle, RefreshCw } from 'lucide-react-native';

interface Report {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignmentNote?: string; // Note from admin when assigning the task
  statusNotes?: Array<{
    status: 'in-progress' | 'resolved';
    note: string;
    createdAt: string;
  }>;
}

export function StaffReports() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const loadAssigned = async () => {
    setLoading(true);
    try {
      console.log('📊 StaffReports: Loading assigned reports for staff:', (user as any)?.staff_id);
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('assigned_to', (user as any)?.staff_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Assigned reports loaded:', data?.length || 0);
      
      const items = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status === 'resolved' ? 'completed' : (r.status || 'pending'),
        priority: r.priority || 'low',
        assignmentNote: r.assignment_note,
        statusNotes: Array.isArray(r.status_notes) ? r.status_notes : [],
      })) as Report[];
      setReports(items);
    } catch (e) {
      console.error('Load assigned reports failed:', e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssigned();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      await loadAssigned();
    })();
  }, []);

  const getCardGradient = (status?: string): [string, string] => {
    const s = (status || 'pending').toLowerCase();
    if (isDark) {
      switch (s) {
        case 'in-progress': return ['#065F46', '#047857'];
        case 'completed': return ['#064E3B', '#065F46'];
        default: return ['#064E3B', '#065F46'];
      }
    }
    switch (s) {
      case 'in-progress': return ['#10B981', '#34D399'];
      case 'completed': return ['#1F8F5A', '#065F46'];
      default: return ['#10B981', '#34D399'];
    }
  };

  const renderStatusIcon = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'pending': return <Clock size={16} color={'#FFFFFF'} />;
      case 'in-progress': return <Play size={16} color={'#FFFFFF'} />;
      default: return <CheckCircle size={16} color={'#FFFFFF'} />;
    }
  };



  const filtered = reports.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading my jobs...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}> 
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.title, { color: isDark ? theme.colors.primary : theme.colors.text }]}>My Jobs ({filtered.length}/{reports.length})</Text>
          <TouchableOpacity 
            onPress={onRefresh} 
            disabled={refreshing}
            style={{ padding: 8, backgroundColor: '#10B981', borderRadius: 8 }}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 4 }}>
          <View style={styles.filtersRow}>
            {(['all','pending','in-progress','completed'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterBtn,
                  isDark
                    ? { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  statusFilter === s && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[
                  styles.filterText,
                  { color: isDark ? theme.colors.textSecondary : theme.colors.textSecondary },
                  statusFilter === s && { color: '#FFFFFF' }
                ]}>
                  {s === 'all' ? 'All' : s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <View style={styles.centered}><Text style={{ color: theme.colors.textSecondary }}>No jobs assigned.</Text></View>
        ) : filtered.map(report => (
          <TouchableOpacity
            key={report.id}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/reports/[id]', params: { id: report.id } })}
          >
            <LinearGradient
              colors={getCardGradient(report.status)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : theme.colors.border }]}
            >
              <View style={styles.cardHeader}>
                {renderStatusIcon(report.status)}
                <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>{report.title}</Text>
              </View>
              {/* Show assignment note from admin */}
              {report.assignmentNote && (
                <Text style={{ color: '#D1FAE5', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                  Admin note: {report.assignmentNote}
                </Text>
              )}

              {/* Show count of status notes */}
              {Array.isArray(report.statusNotes) && report.statusNotes.length > 0 && (
                <Text style={{ color: '#D1FAE5', fontSize: 12, marginTop: 4 }}>
                  {report.statusNotes.length} status update{report.statusNotes.length > 1 ? 's' : ''}
                </Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{report.status.replace('-', ' ')}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 10, fontSize: 16 },
  card: { marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  statusBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  actionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  actionBtnGreen: { backgroundColor: 'rgba(16,185,129,0.9)', borderWidth: 0 },
  completedBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  completedBadgeText: { color: '#10B981', fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },

});
