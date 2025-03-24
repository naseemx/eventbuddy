import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";

interface PageTransitionProps {
  children: React.ReactNode;
  type?: "fade" | "slide" | "none";
}

export default function PageTransition({
  children,
  type = "fade",
}: PageTransitionProps) {
  // Select animation based on type
  const getAnimation = () => {
    switch (type) {
      case "fade":
        return {
          entering: FadeIn.duration(300),
          exiting: FadeOut.duration(200),
        };
      case "slide":
        return {
          entering: SlideInRight.duration(300),
          exiting: SlideOutLeft.duration(200),
        };
      case "none":
      default:
        return {};
    }
  };

  const animation = getAnimation();

  return (
    <Animated.View style={styles.container} {...animation}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
