import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

interface CardSectionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const CardSection: React.FC<CardSectionProps> = ({ children, style }) => {
  return (
    <View style={[styles.section, style]}>
      {children}
    </View>
  );
};

const Card: React.FC<CardProps> = ({
  onPress,
  disabled = false,
  children,
  style,
  contentContainerStyle,
}) => {
  const cardContent = (
    <View style={[styles.container, style]}>
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.touchable}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 12,
  },
});

export default Card; 