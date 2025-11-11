import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, FileText, CheckCircle, Play, AlertTriangle } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import { supabase } from '@/config/supabase';
import { useFocusEffect } from 'expo-router';

interface ActivityEntry {
  id: string;
  action: string;
  timestamp: any;
  issueTitle?: string;
  status?: string;
  priority?: string;
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  // Role-based gradient colors
  const getGradientColors = (): [string, string] => {
    if (user?.role === 'admin') return ['#450A0A', '#7F1D1D'];
    if (user?.role === 'staff') return ['#064E3B', '#065F46'];
    return ['#0F172A', '#1E293B'];
  };

  const getAccentColors = (): [string, string] => {
    if (user?.role === 'admin') return ['#FCA5A5', '#DC2626'];
    if (user?.role === 'staff') return ['#6EE7B7', '#10B981'];
    return ['#93C5FD', '#3B82F6'];
  };

  const getTextColor = () => {
    if (user?.role === 'admin') return '#FECACA';
    if (user?.role === 'staff') return '#D1FAE5';
    return '#E5EDFF';
  };

  const loadActivity = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('📊 Loading activity for role:', user.role);
      
      let query = supabase.from('reports').select('*');
      
      // Admin sees all, staff sees assigned, student sees own
      if (user.role === 'staff') {
        query = query.eq('assigned_to', (user as any).staff_id);
      } else if (user.role === 'student') {
        query = query.eq('student_id', (user as any).student_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Activity error:', error);
        throw error;
      }
      
      console.log('✅ Activity data loaded:', data?.length || 0);
      
      // Convert snake_case to camelCase for compatibility with existing logic
      const reports = (data || []).map((r: any) => ({
        ...r,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        studentId: r.student_id,
        assignedTo: r.assigned_to,
      }));

      const activities = generateActivityFromReports(reports, user.role);
      activities.sort((a, b) => {
        const at = (a as any).timestamp?.toDate ? (a as any).timestamp.toDate().getTime() : new Date((a as any).timestamp || 0).getTime();
        const bt = (b as any).timestamp?.toDate ? (b as any).timestamp.toDate().getTime() : new Date((b as any).timestamp || 0).getTime();
        return bt - at;
      });
      setActivityLog(activities);
    } catch (err) {
      console.error('Activity load error:', err);
      setActivityLog([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivity();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [loadActivity])
  );

  const generateActivityFromReports = (reports: any[], userRole: string): ActivityEntry[] => {
    const activities: ActivityEntry[] = [];

    reports.forEach(report => {
      // Report submission activity - only for admin and student
      if (userRole === 'admin') {
        activities.push({
          id: `submit-${report.id}`,
          action: `New report submitted by Student ${report.studentId}`,
          timestamp: report.createdAt,
          issueTitle: report.title,
          priority: report.priority,
        });
      } else if (userRole === 'student') {
        activities.push({
          id: `submit-${report.id}`,
          action: 'You submitted a new report',
          timestamp: report.createdAt,
          issueTitle: report.title,
          priority: report.priority,
        });
      } else if (userRole === 'staff' && report.assignedTo) {
        // Staff sees when they were assigned
        activities.push({
          id: `assigned-${report.id}`,
          action: `You were assigned to report: ${report.title}`,
          timestamp: report.createdAt,
          issueTitle: report.title,
          priority: report.priority,
        });
      }

      // Status update activities
      if (report.status !== 'pending' && report.updatedAt && report.updatedAt !== report.createdAt) {
        if (userRole === 'staff') {
          activities.push({
            id: `status-${report.id}`,
            action: `You updated report status to ${report.status}`,
            timestamp: report.updatedAt,
            issueTitle: report.title,
            status: report.status,
          });
        } else {
          activities.push({
            id: `status-${report.id}`,
            action: `Report status updated to ${report.status}`,
            timestamp: report.updatedAt,
            issueTitle: report.title,
            status: report.status,
          });
        }
      }

      // Admin receives staff updates (notes timeline)
      if (userRole === 'admin' && Array.isArray(report.notes) && report.notes.length > 0) {
        report.notes.forEach((n: any, idx: number) => {
          if (n?.byRole === 'staff') {
            activities.push({
              id: `note-${report.id}-${idx}-${n.createdAt || ''}`,
              action: `${n.byName || 'Staff'} added a note${n.statusAtTime ? ` (${n.statusAtTime})` : ''}: ${n.text || ''}`,
              timestamp: n.createdAt || report.updatedAt || report.createdAt,
              issueTitle: report.title,
              status: n.statusAtTime === 'resolved' ? 'completed' : (n.statusAtTime || undefined),
            });
          }
        });
      }

      // Staff sees admin notes and their own notes on their assigned reports
      if (userRole === 'staff' && Array.isArray(report.notes) && report.notes.length > 0) {
        report.notes.forEach((n: any, idx: number) => {
          if (n?.byRole === 'admin') {
            activities.push({
              id: `admin-note-${report.id}-${idx}-${n.createdAt || ''}`,
              action: `Admin added a note: ${n.text || ''}`,
              timestamp: n.createdAt || report.updatedAt || report.createdAt,
              issueTitle: report.title,
              status: n.statusAtTime === 'resolved' ? 'completed' : (n.statusAtTime || undefined),
            });
          } else if (n?.byRole === 'staff') {
            // Show staff their own notes
            activities.push({
              id: `staff-note-${report.id}-${idx}-${n.createdAt || ''}`,
              action: `You added a note${n.statusAtTime ? ` (${n.statusAtTime})` : ''}: ${n.text || ''}`,
              timestamp: n.createdAt || report.updatedAt || report.createdAt,
              issueTitle: report.title,
              status: n.statusAtTime === 'resolved' ? 'completed' : (n.statusAtTime || undefined),
            });
          }
        });
      }
    });

    return activities;
  };

  const formatDate = (val: any) => {
    const date = val?.toDate ? val.toDate() : new Date(val);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getActivityIcon = (entry: ActivityEntry) => {
    if (entry.action.includes('submitted')) {
      return entry.priority === 'urgent' 
        ? <AlertTriangle size={20} color="#DC2626" />
        : <FileText size={20} color="#2563EB" />;
    }
    if (entry.status === 'completed') {
      return <CheckCircle size={20} color="#10B981" />;
    }
    if (entry.status === 'in-progress') {
      return <Play size={20} color="#F59E0B" />;
    }
    return <Clock size={20} color="#64748B" />;
  };

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={[styles.header, { borderBottomColor: isDark ? theme.colors.border : '#1F3A52' }]}>
          <Text style={[styles.title, { color: isDark ? theme.colors.text : '#FFFFFF' }]}>
            {isAdmin ? 'Notifications' : 'Activity'}
          </Text>
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading {isAdmin ? 'notifications' : 'activity'}...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: '#000000' }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={user?.role === 'admin' ? '#DC2626' : user?.role === 'staff' ? '#10B981' : '#3B82F6'} 
        />
      }
    >
      {isDark ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={[styles.title, { color: '#FFFFFF' }]}>{isAdmin ? 'Notifications' : 'Activity'}</Text>
          <Text style={[styles.subtitle, { color: getTextColor() }]}>
            {isAdmin ? 'Manage all updates and activities' : 'Your recent actions and updates'}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[styles.headerGradient, { backgroundColor: '#27445D', borderWidth: 1, borderColor: '#27445D' }] }>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>{isAdmin ? 'Notifications' : 'Activity'}</Text>
          <Text style={[styles.subtitle, { color: '#E5EDFF' }]}>
            {isAdmin ? 'Manage all updates and activities' : 'Your recent actions and updates'}
          </Text>
        </View>
      )}

      {activityLog.length === 0 ? (
        isDark ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.emptyCard, { borderRadius: 16 }]}
          >
            <Clock size={48} color={'#FFFFFF'} />
            <Text style={[styles.emptyText, { color: '#FFFFFF' }]}>No activity yet</Text>
            <Text style={[styles.emptySubtext, { color: getTextColor() }]}>Your actions and report updates will appear here</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                borderRadius: 16,
                backgroundColor: '#497D74',
                borderWidth: 1,
                borderColor: '#497D74',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 10,
              },
            ]}
          >
            <Clock size={48} color={'#FFFFFF'} />
            <Text style={[styles.emptyText, { color: '#FFFFFF' }]}>No activity yet</Text>
            <Text style={[styles.emptySubtext, { color: '#EAF2FF' }]}>Your actions and report updates will appear here</Text>
          </View>
        )
      ) : (
        activityLog.map((entry, index) => {
          const { date, time } = formatDate(entry.timestamp);
          return (
            <View key={entry.id} style={[styles.activityCardWrapper]}>
              {isDark ? (
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.activityCard, { borderColor: theme.colors.border }]}
                >
                  <LinearGradient
                    colors={isDark ? getAccentColors() : ['#27445D', '#27445D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.accentStrip}
                  />
                  <View style={styles.activityHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
                      {getActivityIcon(entry)}
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{date}</Text>
                      <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>{time}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.actionText, { color: theme.colors.text }]}>{entry.action}</Text>
                      {entry.issueTitle && (
                        <Text style={[styles.issueTitleText, { color: theme.colors.primary }]}>
                          "{entry.issueTitle}"
                        </Text>
                      )}
                      {entry.priority === 'urgent' && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {index < activityLog.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: theme.colors.border }]} />
                  )}
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.activityCard,
                    {
                      backgroundColor: '#497D74',
                      borderColor: '#497D74',
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                      elevation: 10,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#27445D', '#27445D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.accentStrip}
                  />
                  <View style={styles.activityHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#71BBB2' }]}>
                      {getActivityIcon(entry)}
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={[styles.dateText, { color: '#EAF2FF' }]}>{date}</Text>
                      <Text style={[styles.timeText, { color: '#EAF2FF' }]}>{time}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.actionText, { color: '#FFFFFF' }]}>{entry.action}</Text>
                      {entry.issueTitle && (
                        <Text style={[styles.issueTitleText, { color: '#FFFFFF' }]}>
                          "{entry.issueTitle}"
                        </Text>
                      )}
                      {entry.priority === 'urgent' && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {index < activityLog.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  activityCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  activityCard: {
    position: 'relative',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activityContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  issueTitleText: {
    fontSize: 14,
    color: '#2563EB',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  urgentBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  urgentBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connector: {
    position: 'absolute',
    left: 50,
    bottom: -16,
    width: 2,
    height: 16,
    backgroundColor: '#E2E8F0',
  },
});