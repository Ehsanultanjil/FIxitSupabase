import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'resolved' | 'complete' | 'completed' | 'rejected';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getContainerStyle = () => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'in-progress':
        return styles['in-progress'];
      case 'resolved':
        return styles.resolved;
      case 'complete':
        return styles.complete;
      case 'completed':
        return styles.completed;
      case 'rejected':
        return styles.rejected;
      default:
        return styles.complete;
    }
  };

  const getTextStyle = () => {
    switch (status) {
      case 'pending':
        return styles.pendingText;
      case 'in-progress':
        return styles['in-progressText'];
      case 'resolved':
        return styles.resolvedText;
      case 'complete':
        return styles.completeText;
      case 'completed':
        return styles.completedText;
      case 'rejected':
        return styles.rejectedText;
      default:
        return styles.completeText;
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle()]}>
      <Text style={[styles.text, getTextStyle()]}>
        {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pending: {
    backgroundColor: '#FEF3C7',
  },
  'in-progress': {
    backgroundColor: '#E0F2FE',
  },
  resolved: {
    backgroundColor: '#D1FAE5',
  },
  complete: {
    backgroundColor: '#D1FAE5',
  },
  completed: {
    backgroundColor: '#D1FAE5',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pendingText: {
    color: '#92400E',
  },
  'in-progressText': {
    color: '#2563EB',
  },
  resolvedText: {
    color: '#065F46',
  },
  completeText: {
    color: '#065F46',
  },
  completedText: {
    color: '#065F46',
  },
  rejectedText: {
    color: '#DC2626',
  },
});