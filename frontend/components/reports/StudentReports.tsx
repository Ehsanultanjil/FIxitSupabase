import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { Search, Filter, Plus, MapPin, Clock, FileText, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/config/supabase';

interface Report {
  id: string;
  title: string;
  description: string;
  location: { building: string; room: string };
  createdAt: any;
  updatedAt?: any;
  studentId: string;
  photo?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rejectionNote?: string;
  assignmentNote?: string; // For staff visibility
  statusNotes?: Array<{
    status: 'in-progress' | 'resolved';
    note: string;
    createdAt: string;
  }>;
}

export function StudentReports() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'rejected'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [truncated, setTruncated] = useState<Record<string, boolean>>({});
  const [collapsedText, setCollapsedText] = useState<Record<string, string>>({});

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('student_id', (user as any)?.student_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Student reports loaded:', data?.length || 0);
      
      // Normalize backend status 'resolved' to 'completed' for the app
      const items: Report[] = (data || []).map((r) => ({
        ...r,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        studentId: r.student_id,
        assignedTo: r.assigned_to,
        assignedToName: r.assigned_to_name,
        status: (r.status === 'resolved' ? 'completed' : r.status) as Report['status'],
        rejectionNote: r.rejection_note || undefined,
        assignmentNote: r.assignment_note || undefined,
        statusNotes: Array.isArray(r.status_notes) ? r.status_notes : [],
      }));
      setReports(items);
    } catch (e) {
      console.error('Load my reports failed:', e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const handleReportNewIssue = () => {
    router.push('/report-issue');
  };

  const formatDate = (val: any) => {
    const jsDate = val?.toDate ? val.toDate() : (typeof val === 'string' ? new Date(val) : new Date());
    return jsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in-progress': return '#2563EB';
      case 'completed': return '#10B981';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getCardGradient = (status?: string): [string, string] => {
    const s = (status || 'pending').toLowerCase();
    if (isDark) {
      switch (s) {
        case 'in-progress': return ['#0C4A6E', '#1E3A8A']; // blue dark
        case 'completed': return ['#064E3B', '#065F46']; // green dark
        case 'pending': return ['#451A03', '#7C2D12']; // amber dark
        case 'rejected': return ['#7F1D1D', '#DC2626']; // red dark
        default: return ['#0F172A', '#1E293B']; // slate dark
      }
    } else {
      switch (s) {
        case 'in-progress': return ['#5B8DEF', '#1E40AF']; // blue light (much darker)
        case 'completed': return ['#1F8F5A', '#065F46']; // green light (much darker)
        case 'pending': return ['#FDBA74', '#C2410C']; // amber light (much darker)
        case 'rejected': return ['#F87171', '#DC2626']; // red light (much darker)
        default: return ['#94A3B8', '#475569']; // slate light (much darker)
      }
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter reports based on status (already normalized on load)
  const filteredReports = reports.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#000000' }]}>
      {isDark ? (
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={[styles.title, { color: '#FFFFFF' }]}>My Reports ({filteredReports.length})</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)'
              }
            ]}
            onPress={handleReportNewIssue}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <View style={[styles.headerGradient, { backgroundColor: '#27445D', borderWidth: 1, borderColor: '#27445D' }]}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>My Reports ({filteredReports.length})</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)'
              }
            ]}
            onPress={handleReportNewIssue}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filtersContainer}>
        <View style={styles.statusFilters}>
          {(['all', 'pending', 'in-progress', 'completed', 'rejected'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
                // Light mode: selected = #27445D, unselected = #71BBB2
                (!isDark && statusFilter === status)
                  ? { backgroundColor: '#27445D', borderColor: '#27445D' }
                  : (!isDark ? { backgroundColor: '#71BBB2', borderColor: '#71BBB2' } : {})
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
                // Light mode: ensure white text for both selected and unselected
                !isDark ? { color: '#FFFFFF' } : {}
              ]}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredReports.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {statusFilter === 'all' 
              ? "You haven't submitted any reports yet." 
              : `No ${statusFilter} reports found.`}
          </Text>
          {statusFilter === 'all' && (
            <Button title="Report Your First Issue" onPress={handleReportNewIssue} style={styles.emptyButton} />
          )}
        </Card>
      ) : (
        filteredReports.map((report: Report) => (
          isDark ? (
            <LinearGradient
              key={report.id}
              colors={getCardGradient(report.status)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.reportCardGradient, { borderColor: 'rgba(255,255,255,0.15)' }]}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: '#FFFFFF' }]}>{report.title}</Text>
                  <View style={styles.infoRow}>
                    <MapPin size={14} color={'rgba(255,255,255,0.9)'} />
                    <Text style={[styles.locationText, { color: 'rgba(255,255,255,0.9)' }]}>
                      {report.location.building} - {report.location.room}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={14} color={'rgba(255,255,255,0.85)'} />
                    <Text style={[styles.dateText, { color: 'rgba(255,255,255,0.85)' }]}>{formatDate(report.createdAt)}</Text>
                  </View>
                  {report.assignedTo && (
                    <View style={[styles.assignmentInfo, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.assignmentText, { color: '#FFFFFF' }]}>
                        Assigned to: {report.assignedToName || 'Unknown Staff'} (ID: {report.assignedTo})
                      </Text>
                    </View>
                  )}
                </View>
                {report.photo && (
                  <Image source={{ uri: report.photo }} style={styles.thumbnail} resizeMode="cover" />
                )}
              </View>
              <View style={styles.descriptionSection}>
                <View style={styles.descriptionHeader}>
                  <FileText size={14} color={'rgba(255,255,255,0.95)'} />
                  <Text style={[styles.descriptionLabel, { color: 'rgba(255,255,255,0.95)' }]}>Description</Text>
                </View>
                {expanded[report.id] ? (
                  <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                    {(report.description || 'No description provided.').trim()}
                    {truncated[report.id] && (
                      <Text onPress={() => toggleExpand(report.id)} style={[styles.readMore, { color: '#E8F0FF' }]}> see less</Text>
                    )}
                  </Text>
                ) : (
                  truncated[report.id] && collapsedText[report.id] ? (
                    <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                      {collapsedText[report.id]}
                      <Text onPress={() => toggleExpand(report.id)} style={[styles.readMore, { color: '#E8F0FF' }]}>...see more</Text>
                    </Text>
                  ) : (
                    <Text
                      style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}
                      numberOfLines={2}
                      onTextLayout={(e) => {
                        const isTruncated = e.nativeEvent.lines.length > 2;
                        if (isTruncated && !collapsedText[report.id]) {
                          const firstTwo = e.nativeEvent.lines.slice(0, 2).map(l => l.text).join('\n');
                          setCollapsedText(prev => ({ ...prev, [report.id]: firstTwo }));
                        }
                        setTruncated(prev => (prev[report.id] === isTruncated ? prev : { ...prev, [report.id]: isTruncated }));
                      }}
                    >
                      {(report.description || 'No description provided.').trim()}
                    </Text>
                  )
                )}
              </View>
              <View style={styles.reportFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor((report.status || 'pending')) }]}> 
                  <Text style={styles.statusBadgeText}>
                    {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1).replace('-', ' ')}
                  </Text>
                </View>
                {report.priority === 'urgent' && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>

              {/* Simple Timeline */}
              <View style={[styles.timelineContainer, { backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 12 }]}>
                {/* Timeline Line Base */}
                <View style={[styles.timelineLineBase, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                
                <View style={styles.timelineRow}>
                  {/* Created */}
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.timelineLabel, { color: 'rgba(255,255,255,0.9)' }]}>Created</Text>
                    <Text style={[styles.timelineDate, { color: 'rgba(255,255,255,0.7)' }]}>
                      {formatDate(report.createdAt)}
                    </Text>
                  </View>
                  
                  {/* In Progress */}
                  <View style={styles.timelineItem}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: report.status === 'in-progress' || report.status === 'completed' ? '#2563EB' : '#9CA3AF' }
                    ]} />
                    <Text style={[
                      styles.timelineLabel, 
                      { color: report.status === 'in-progress' || report.status === 'completed' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }
                    ]}>
                      In Progress
                    </Text>
                    <Text style={[
                      styles.timelineDate, 
                      { color: report.status === 'in-progress' || report.status === 'completed' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }
                    ]}>
                      {report.status === 'in-progress' || report.status === 'completed' ? (report.updatedAt ? formatDate(report.updatedAt) : '-') : '-'}
                    </Text>
                  </View>
                  
                  {/* Completed */}
                  <View style={styles.timelineItem}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: report.status === 'completed' ? '#10B981' : '#9CA3AF' }
                    ]} />
                    <Text style={[
                      styles.timelineLabel, 
                      { color: report.status === 'completed' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }
                    ]}>
                      Completed
                    </Text>
                    <Text style={[
                      styles.timelineDate, 
                      { color: report.status === 'completed' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }
                    ]}>
                      {report.status === 'completed' ? formatDate(report.updatedAt || report.createdAt) : '-'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Show rejection note if report is rejected */}
              {report.status === 'rejected' && report.rejectionNote && (
                <View style={[styles.notesContainer, { 
                  backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(254, 226, 226, 1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  position: 'relative'
                }]}>
                  {/* Header with Rejection Label */}
                  <View style={[styles.descriptionHeader, { marginBottom: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FileText size={16} color={isDark ? '#EF4444' : '#DC2626'} />
                      <Text style={[styles.notesLabel, { 
                        color: isDark ? '#EF4444' : '#DC2626',
                        fontWeight: '600',
                        fontSize: 14,
                        marginLeft: 6
                      }]}>
                        Rejection Reason
                      </Text>
                    </View>
                    {/* Alert Icon on the right */}
                    <View style={{ position: 'absolute', right: 0, top: 0 }}>
                      <AlertTriangle 
                        size={18} 
                        color={isDark ? '#EF4444' : '#DC2626'} 
                        style={{ opacity: 0.8 }}
                      />
                    </View>
                  </View>
                  {/* Rejection Note Text */}
                  <Text style={[styles.notesText, { 
                    color: isDark ? '#FCA5A5' : '#7F1D1D',
                    fontSize: 13,
                    lineHeight: 18
                  }]}>
                    {report.rejectionNote}
                  </Text>
                </View>
              )}
              {/* Status notes are not shown to students */}
            </LinearGradient>
          ) : (
            <View
              key={report.id}
              style={[
                styles.reportCardGradient,
                { backgroundColor: '#497D74', borderColor: '#497D74' },
                {
                  shadowColor: '#27445D',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 14,
                  elevation: 7,
                },
              ]}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: '#FFFFFF' }]}>{report.title}</Text>
                  <View style={styles.infoRow}>
                    <MapPin size={14} color={'rgba(255,255,255,0.9)'} />
                    <Text style={[styles.locationText, { color: 'rgba(255,255,255,0.9)' }]}>
                      {report.location.building} - {report.location.room}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={14} color={'rgba(255,255,255,0.85)'} />
                    <Text style={[styles.dateText, { color: 'rgba(255,255,255,0.85)' }]}>{formatDate(report.createdAt)}</Text>
                  </View>
                  {report.assignedTo && (
                    <View style={[styles.assignmentInfo, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.assignmentText, { color: '#FFFFFF' }]}>
                        Assigned to: {report.assignedToName || 'Unknown Staff'} (ID: {report.assignedTo})
                      </Text>
                    </View>
                  )}
                </View>
                {report.photo && (
                  <Image source={{ uri: report.photo }} style={styles.thumbnail} resizeMode="cover" />
                )}
              </View>
              <View style={styles.descriptionSection}>
                <Text style={[styles.descriptionLabel, { color: 'rgba(255,255,255,0.95)' }]}>Description</Text>
                {expanded[report.id] ? (
                  <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                    {(report.description || 'No description provided.').trim()}
                    {truncated[report.id] && (
                      <Text onPress={() => toggleExpand(report.id)} style={[styles.readMore, { color: '#E8F0FF' }]}> see less</Text>
                    )}
                  </Text>
                ) : (
                  truncated[report.id] && collapsedText[report.id] ? (
                    <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
                      {collapsedText[report.id]}
                      <Text onPress={() => toggleExpand(report.id)} style={[styles.readMore, { color: '#E8F0FF' }]}>...see more</Text>
                    </Text>
                  ) : (
                    <Text
                      style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}
                      numberOfLines={2}
                      onTextLayout={(e) => {
                        const isTruncated = e.nativeEvent.lines.length > 2;
                        if (isTruncated && !collapsedText[report.id]) {
                          const firstTwo = e.nativeEvent.lines.slice(0, 2).map(l => l.text).join('\n');
                          setCollapsedText(prev => ({ ...prev, [report.id]: firstTwo }));
                        }
                        setTruncated(prev => (prev[report.id] === isTruncated ? prev : { ...prev, [report.id]: isTruncated }));
                      }}
                    >
                      {(report.description || 'No description provided.').trim()}
                    </Text>
                  )
                )}
              </View>
              <View style={styles.reportFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status || 'pending') }]}>
                  <Text style={styles.statusBadgeText}>
                    {(report.status || 'pending').charAt(0).toUpperCase() + (report.status || 'pending').slice(1).replace('-', ' ')}
                  </Text>
                </View>
                {report.priority === 'urgent' && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>

              {/* Simple Timeline */}
              <View style={[styles.timelineContainer, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 12 }]}>
                {/* Timeline Line Base */}
                <View style={[styles.timelineLineBase, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                
                <View style={styles.timelineRow}>
                  {/* Created */}
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[styles.timelineLabel, { color: 'rgba(255,255,255,0.9)' }]}>Created</Text>
                    <Text style={[styles.timelineDate, { color: 'rgba(255,255,255,0.7)' }]}>
                      {formatDate(report.createdAt)}
                    </Text>
                  </View>
                  
                  {/* In Progress */}
                  <View style={styles.timelineItem}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: report.status === 'in-progress' || report.status === 'completed' ? '#2563EB' : '#9CA3AF' }
                    ]} />
                    <Text style={[
                      styles.timelineLabel, 
                      { color: report.status === 'in-progress' || report.status === 'completed' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }
                    ]}>
                      In Progress
                    </Text>
                    <Text style={[
                      styles.timelineDate, 
                      { color: report.status === 'in-progress' || report.status === 'completed' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }
                    ]}>
                      {report.status === 'in-progress' || report.status === 'completed' ? (report.updatedAt ? formatDate(report.updatedAt) : '-') : '-'}
                    </Text>
                  </View>
                  
                  {/* Completed */}
                  <View style={styles.timelineItem}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: report.status === 'completed' ? '#10B981' : '#9CA3AF' }
                    ]} />
                    <Text style={[
                      styles.timelineLabel, 
                      { color: report.status === 'completed' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }
                    ]}>
                      Completed
                    </Text>
                    <Text style={[
                      styles.timelineDate, 
                      { color: report.status === 'completed' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }
                    ]}>
                      {report.status === 'completed' ? formatDate(report.updatedAt || report.createdAt) : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Show rejection note if report is rejected */}
              {report.status === 'rejected' && report.rejectionNote && (
                <View style={[styles.notesContainer, { 
                  backgroundColor: 'rgba(220, 38, 38, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(220, 38, 38, 0.3)',
                  marginTop: 12
                }]}>
                  <View style={styles.descriptionHeader}>
                    <FileText size={14} color={'#DC2626'} />
                    <Text style={[styles.notesLabel, { color: '#DC2626' }]}>Rejection Reason</Text>
                  </View>
                  <Text style={[styles.notesText, { color: '#DC2626' }]}>{report.rejectionNote}</Text>
                </View>
              )}
            </View>
          )
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  reportCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  reportCardGradient: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.95,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  readMore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignmentInfo: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineContainer: {
    padding: 12,
    borderRadius: 8,
    position: 'relative',
  },
  timelineLineBase: {
    position: 'absolute',
    height: 2,
    left: '20%',
    right: '20%',
    top: 17,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
    zIndex: 1,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 9,
  },
});
