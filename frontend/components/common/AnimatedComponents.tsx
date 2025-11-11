import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Easing,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  animationType?: 'scale' | 'bounce' | 'pulse';
  style?: ViewStyle;
}

export function AnimatedButton({ 
  children, 
  animationType = 'scale', 
  style, 
  onPress,
  ...props 
}: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animationType === 'scale') {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 150,
        friction: 4,
      }).start();
    } else if (animationType === 'bounce') {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 200,
          friction: 3,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 4,
    }).start();
  };

  useEffect(() => {
    if (animationType === 'pulse') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [animationType, pulseValue]);

  const animatedStyle = {
    transform: [
      { scale: animationType === 'pulse' ? pulseValue : scaleValue }
    ],
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, duration = 500, delay = 0, style }: FadeInViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
}

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export function SlideInView({ 
  children, 
  direction = 'up', 
  duration = 500, 
  delay = 0,
  distance = 50,
  style 
}: SlideInViewProps) {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, opacityAnim, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'right':
        return [{ translateX: slideAnim }];
      case 'up':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'down':
        return [{ translateY: slideAnim }];
      default:
        return [{ translateY: slideAnim }];
    }
  };

  return (
    <Animated.View 
      style={[
        style, 
        { 
          opacity: opacityAnim,
          transform: getTransform(),
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface PulseViewProps {
  children: React.ReactNode;
  pulseScale?: number;
  duration?: number;
  style?: ViewStyle;
}

export function PulseView({ 
  children, 
  pulseScale = 1.05, 
  duration = 1500,
  style 
}: PulseViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: pulseScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim, pulseScale, duration]);

  return (
    <Animated.View 
      style={[
        style, 
        { 
          transform: [{ scale: pulseAnim }],
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface ShakeViewProps {
  children: React.ReactNode;
  trigger: boolean;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
}

export function ShakeView({ 
  children, 
  trigger, 
  intensity = 10, 
  duration = 500,
  style 
}: ShakeViewProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      const shake = () => {
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: intensity,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -intensity,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: intensity,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -intensity,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start();
      };
      shake();
    }
  }, [trigger, shakeAnim, intensity, duration]);

  return (
    <Animated.View 
      style={[
        style, 
        { 
          transform: [{ translateX: shakeAnim }],
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Loading animation component
interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export function LoadingDots({ color = '#3B82F6', size = 8 }: LoadingDotsProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, [dot1, dot2, dot3]);

  const getDotStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, getDotStyle(dot3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    borderRadius: 50,
  },
});
