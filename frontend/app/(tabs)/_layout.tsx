import { Tabs, usePathname } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chrome as Home, FileText, User, Settings, Users, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/common/ThemeProvider';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        let query = supabase.from('reports').select('*');
        
        if (user.role === 'staff') {
          query = query.eq('assigned_to', (user as any).staff_id);
        } else if (user.role === 'student') {
          query = query.eq('student_id', (user as any).student_id);
        }
        
        const { data } = await query;
        
        // Get last seen timestamp
        const lastSeenStr = await AsyncStorage.getItem(`lastSeenActivity_${user.id}`);
        const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(0);
        
        // Count reports updated after last seen
        if (data) {
          const unseenCount = data.filter(r => new Date(r.updated_at) > lastSeen).length;
          setNotificationCount(unseenCount);
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();

    // Real-time subscription for notification count
    let filter = '';
    if (user.role === 'staff') {
      filter = `assigned_to=eq.${(user as any).staff_id}`;
    } else if (user.role === 'student') {
      filter = `student_id=eq.${(user as any).student_id}`;
    }

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          ...(filter && { filter })
        },
        () => {
          checkNotifications(); // Update count on any report change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Clear badge immediately when activity tab is opened
  useEffect(() => {
    if (pathname === '/activity') {
      setNotificationCount(0);
    }
  }, [pathname]);

  // Role-based gradient colors
  const getGradientColors = (): [string, string] => {
    if (user?.role === 'admin') return ['#450A0A', '#7F1D1D']; // Red for admin
    if (user?.role === 'staff') return ['#064E3B', '#065F46']; // Green for staff
    return ['#0F172A', '#1E293B']; // Blue for student
  };

  // Role-based active tab color
  const getActiveTintColor = () => {
    if (user?.role === 'admin') return '#DC2626'; // Red for admin
    if (user?.role === 'staff') return '#10B981'; // Green for staff
    return theme.colors.primary; // Blue for student
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isDark ? 'transparent' : '#27445D',
              borderTopColor: theme.colors.border,
              paddingBottom: 8,
              paddingTop: 8,
              height: 80,
            },
            tabBarBackground: () => (
              isDark ? (
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              ) : null
            ),
            tabBarActiveTintColor: getActiveTintColor(),
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
            }}
          />
          
          <Tabs.Screen
            name="reports"
            options={{
              title: user?.role === 'admin' ? 'Manage Reports' : (user?.role === 'staff' ? 'My Jobs' : 'My Reports'),
              tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
            }}
          />

        <Tabs.Screen
          name="activity"
          options={{
            title: user?.role === 'admin' ? 'Notifications' : 'Activity',
            tabBarIcon: ({ size, color }) => (
              <View>
                <Bell size={size} color={color} />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
        </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000000',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});