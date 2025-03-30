import React, { useState } from 'react';
import { Image, ImageProps, View, Text, ActivityIndicator, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Package } from 'lucide-react-native';

interface SafeImageProps extends Omit<ImageProps, 'source' | 'style'> {
  source?: string | null;
  showPlaceholder?: boolean;
  placeholderText?: string;
  placeholderSize?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

// Simple gray placeholder image (1x1 pixel) encoded as base64
const DEFAULT_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * A component to safely render images from various sources (URL, base64, etc)
 */
const SafeImage: React.FC<SafeImageProps> = ({
  source,
  showPlaceholder = true,
  placeholderText = 'No image',
  placeholderSize = 24,
  style,
  containerStyle,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Prepare image source
  const getImageSource = () => {
    if (!source) {
      // Instead of an external URL, use our base64 placeholder
      return { uri: DEFAULT_IMAGE_BASE64 };
    }

    if (source.startsWith('data:image')) {
      return { uri: source };
    }

    if (source.startsWith('http') || source.startsWith('https')) {
      return { uri: source };
    }

    // Assume it's a base64 string without data URL prefix
    try {
      return { uri: `data:image/jpeg;base64,${source}` };
    } catch (error) {
      console.error('Error formatting image source:', error);
      return { uri: DEFAULT_IMAGE_BASE64 };
    }
  };

  // Render placeholder if no image available
  if (!source && showPlaceholder) {
    return (
      <View 
        style={[
          { 
            backgroundColor: '#f3f4f6', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 8
          }, 
          containerStyle
        ]}
      >
        <Package size={placeholderSize} color="#9CA3AF" />
        <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>
          {placeholderText}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ position: 'relative' }, containerStyle]}>
      <Image
        {...props}
        source={getImageSource()}
        style={style}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          console.log('Image load error for source:', source);
        }}
      />
      
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.1)'
        }}>
          <ActivityIndicator size="small" color="#4F46E5" />
        </View>
      )}
      
      {hasError && showPlaceholder && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f3f4f6'
        }}>
          <Package size={placeholderSize} color="#9CA3AF" />
          <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>
            Failed to load
          </Text>
        </View>
      )}
    </View>
  );
};

export default SafeImage; 