import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet, ViewToken } from 'react-native';
import OptimizedImage from './OptimizedImage';

interface Image {
  uri?: string;
  base64?: string;
}

interface LazyImageCarouselProps {
  images: Image[];
  height: number;
  width?: number;
  showIndicators?: boolean;
  onImageChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const LazyImageCarousel: React.FC<LazyImageCarouselProps> = ({
  images,
  height,
  width = Dimensions.get('window').width,
  showIndicators = true,
  onImageChange,
  autoPlay = false,
  autoPlayInterval = 3000,
  resizeMode = 'cover'
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Use ref for the viewable items handler to prevent it from changing between renders
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 50,
      },
      onViewableItemsChanged: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
        if (info.viewableItems.length > 0 && info.viewableItems[0].index !== null) {
          const index = info.viewableItems[0].index as number;
          setActiveIndex(index);
          if (onImageChange) onImageChange(index);
        }
      }
    },
  ]);
  
  // Auto-play effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoPlay && images.length > 1) {
      interval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % images.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
      }, autoPlayInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeIndex, autoPlay, autoPlayInterval, images.length]);
  
  // Render a single image
  const renderItem = ({ item }: { item: Image }) => {
    let imageSource: string | null = null;
    
    if (item.base64) {
      imageSource = `data:image/jpeg;base64,${item.base64}`;
    } else if (item.uri) {
      imageSource = item.uri;
    }
    
    return (
      <View style={{ width, height }}>
        <OptimizedImage
          source={imageSource}
          style={{ width, height }}
          resizeMode={resizeMode}
          priority="high"
        />
      </View>
    );
  };
  
  return (
    <View style={{ height, width }}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `carousel-image-${index}`}
        renderItem={renderItem}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      
      {showIndicators && images.length > 1 && (
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: index === activeIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default LazyImageCarousel; 