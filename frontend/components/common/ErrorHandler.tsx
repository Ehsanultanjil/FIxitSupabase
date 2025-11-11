import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw, X } from 'lucide-react-native';

interface ErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
}

export function ErrorHandler({ 
  error, 
  onRetry, 
  onDismiss, 
  type = 'error',
  showIcon = true 
}: ErrorHandlerProps) {
  if (!error) return null;

  const getErrorStyle = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
          textColor: '#92400E',
          iconColor: '#F59E0B',
        };
      case 'info':
        return {
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6',
          textColor: '#1E40AF',
          iconColor: '#3B82F6',
        };
      default:
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
          textColor: '#DC2626',
          iconColor: '#EF4444',
        };
    }
  };

  const errorStyle = getErrorStyle();

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: errorStyle.backgroundColor,
        borderColor: errorStyle.borderColor,
      }
    ]}>
      <View style={styles.content}>
        {showIcon && (
          <AlertTriangle 
            size={20} 
            color={errorStyle.iconColor} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.errorText, { color: errorStyle.textColor }]}>
          {error}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: errorStyle.borderColor }]}
            onPress={onRetry}
          >
            <RefreshCw size={16} color={errorStyle.iconColor} />
            <Text style={[styles.actionText, { color: errorStyle.textColor }]}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <X size={16} color={errorStyle.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Toast-style error component
export function ErrorToast({ 
  error, 
  onDismiss, 
  type = 'error',
  duration = 5000 
}: ErrorHandlerProps & { duration?: number }) {
  React.useEffect(() => {
    if (error && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [error, duration, onDismiss]);

  if (!error) return null;

  const errorStyle = type === 'error' 
    ? { backgroundColor: '#EF4444', textColor: '#FFFFFF' }
    : { backgroundColor: '#10B981', textColor: '#FFFFFF' };

  return (
    <View style={[styles.toast, { backgroundColor: errorStyle.backgroundColor }]}>
      <Text style={[styles.toastText, { color: errorStyle.textColor }]}>
        {error}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.toastDismiss}>
          <X size={16} color={errorStyle.textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  toastDismiss: {
    padding: 4,
  },
});
