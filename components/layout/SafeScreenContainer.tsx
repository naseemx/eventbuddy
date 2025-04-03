import React from 'react';
import { View, ViewStyle, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  includeStatusBar?: boolean;
}

/**
 * A container component that properly handles safe areas, including status bar area
 * Use this as the root container for all screens
 */
const SafeScreenContainer: React.FC<SafeScreenContainerProps> = ({
  children,
  style,
  backgroundColor = '#ffffff',
  includeStatusBar = false,
}) => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: includeStatusBar ? statusBarHeight : 0,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeScreenContainer; 