import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native';
import { theme } from '@/config/theme';
import { haptics } from '@/services/haptics';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  fullWidth?: boolean;
  style?: PressableProps['style'];
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  fullWidth = false,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const handlePress = useCallback(async (event: any) => {
    await haptics.light();
    onPress?.(event);
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        styles[variant === 'text' ? 'textVariant' : variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        ...(Array.isArray(style) ? style : style ? [style as any] : []),
      ] as any}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'text' ? theme.colors.primary : theme.colors.textInverse} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant === 'text' ? 'textVariant' : variant}Text`],
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: theme.colors.textInverse,
  },
  secondaryText: {
    color: theme.colors.textInverse,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  textVariantText: {
    color: theme.colors.primary,
  },
});
