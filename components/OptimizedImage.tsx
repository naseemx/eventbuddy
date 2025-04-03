import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Image, Platform } from 'react-native';
import { Package } from 'lucide-react-native';

interface OptimizedImageProps {
  source: string | null | undefined;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  showPlaceholder?: boolean;
  placeholderText?: string;
  placeholderSize?: number;
  priority?: 'low' | 'normal' | 'high';
  thumbnail?: boolean;
  containerStyle?: any;
}

const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Helper to handle Supabase URLs for web
const processSupabaseUrl = (url: string): string => {
  if (Platform.OS === 'web' && url.includes('supabase') && url.includes('/storage/v1/object/public/')) {
    // On web, Supabase URLs need special handling because of CORS
    // Extract the path without the domain
    const matches = url.match(/\/storage\/v1\/object\/public\/(.+)/);
    if (matches && matches[1]) {
      // For web, we'll use a direct URL format that works better with CORS
      return `https://wncwlshtddeelkutqyrq.supabase.co/storage/v1/object/public/${matches[1]}`;
    }
  }
  return url;
};

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  showPlaceholder = true,
  placeholderText = 'No image',
  placeholderSize = 24,
  priority = 'normal',
  thumbnail = false,
  containerStyle = {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sourceKey, setSourceKey] = useState('');

  // Debug the source when it changes
  useEffect(() => {
    // Generate a unique key for the source to help with re-rendering when source changes
    if (source) {
      console.log(`[OptimizedImage] Processing source:`, source.substring(0, 50) + '...');
      setSourceKey(source.substring(0, 20));
    } else {
      console.log('[OptimizedImage] No source provided');
    }
  }, [source]);

  // Check if source is valid
  const isValidSource = source && typeof source === 'string' && source.length > 0;

  // Use thumbnail version for list views (only for non-Supabase URLs)
  let processedSource = source;
  if (isValidSource && thumbnail && !source.includes('supabase')) {
    processedSource = source.replace(/(\.\w+)(\?.*)?$/, '_thumb$1$2');
  }

  // Process Supabase URLs for web
  if (isValidSource && processedSource && processedSource.includes('supabase')) {
    processedSource = processSupabaseUrl(processedSource);
    console.log(`[OptimizedImage] Processed Supabase URL:`, processedSource.substring(0, 50) + '...');
  }
  
  // Determine the image source - use DEFAULT_IMAGE if source is invalid
  const imageSource = isValidSource
    ? { uri: processedSource as string } 
    : { uri: DEFAULT_IMAGE };

  const handleLoad = () => {
    console.log(`[OptimizedImage] Image loaded successfully`);
    setIsLoading(false);
  };

  const handleError = () => {
    console.warn(`[OptimizedImage] Image failed to load:`, processedSource?.substring(0, 70));
    setIsLoading(false);
    setHasError(true);
  };

  // Map resizeMode to standard values
  const standardResizeMode = 
    resizeMode === 'cover' 
      ? 'cover' 
      : resizeMode === 'contain' 
        ? 'contain' 
        : resizeMode === 'stretch' 
          ? 'stretch' 
          : 'center';

  // Check if we should use web image component for Supabase storage URLs
  const useWebImage = Platform.OS === 'web' && 
                     isValidSource && 
                     processedSource && 
                     processedSource.includes('supabase');

  return (
    <View style={[{ overflow: 'hidden' }, containerStyle]}>
      {(!isValidSource || hasError) && showPlaceholder ? (
        <View 
          style={[
            style, 
            { 
              backgroundColor: '#f3f4f6', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }
          ]}
        >
          <Package size={placeholderSize} color="#9CA3AF" />
          {placeholderText && (
            <Text 
              style={{ 
                color: '#6B7280', 
                fontSize: 12, 
                marginTop: 4, 
                textAlign: 'center'
              }}
            >
              {placeholderText}
            </Text>
          )}
        </View>
      ) : useWebImage ? (
        <View style={style}>
          <img
            src={processedSource as string}
            style={{
              width: '100%',
              height: '100%',
              objectFit: standardResizeMode === 'cover' ? 'cover' : 
                standardResizeMode === 'contain' ? 'contain' : 
                standardResizeMode === 'stretch' ? 'fill' : 'none',
              borderRadius: style.borderRadius || 0
            }}
            onLoad={handleLoad}
            onError={handleError}
            alt={placeholderText || 'Image'}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: style.borderRadius || 0
            }}>
              <ActivityIndicator size="small" color="#6366F1" />
            </div>
          )}
        </View>
      ) : (
        // Standard React Native Image for all other cases
        <>
          <Image
            key={sourceKey}
            source={imageSource}
            style={style}
            resizeMode={standardResizeMode}
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {isLoading && (
            <View 
              style={[
                style, 
                { 
                  position: 'absolute', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6'
                }
              ]}
            >
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default OptimizedImage; 