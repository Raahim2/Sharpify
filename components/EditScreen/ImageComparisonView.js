// components/ImageComparisonView.js
import React from 'react';
import { View, Text, Image, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import { SLIDER_HANDLE_WIDTH } from './constants';

const ImageComparisonView = ({
  originalImageUri,
  processedImageUri,
  displaySize,
  clampedSliderX,
  onGestureEvent,
  onHandlerStateChange,
  onExpandPress, // <-- NEW: Callback prop for the expand button
}) => {
  const afterImageSourceUri = processedImageUri || originalImageUri;

  if (displaySize.width === 0 || !originalImageUri) {
      // Or some placeholder if displaySize is not ready
      return <View style={[styles.imageComparisonContainer, { backgroundColor: '#000' }]} />;
  }

  return (
    <View style={[styles.imageComparisonContainer, { width: displaySize.width, height: displaySize.height }]}>
      <Image
        source={{ uri: afterImageSourceUri }}
        style={{ width: displaySize.width, height: displaySize.height }}
        resizeMode="contain"
      />
      <View style={styles.labelContainerAfter}>
        <Text style={styles.labelText}>After</Text>
      </View>

      {/* NEW: Fullscreen expand button */}
      <TouchableOpacity style={styles.expandButton} onPress={onExpandPress}>
        <IoniconsIcon name="expand-outline" size={22} color="white" />
      </TouchableOpacity>

      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0,
          width: clampedSliderX, height: displaySize.height,
          overflow: 'hidden', borderRightWidth: 2, borderColor: 'white',
        }}>
        <Image
          source={{ uri: originalImageUri }}
          style={{ width: displaySize.width, height: displaySize.height }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={[styles.labelContainerBefore, {
        opacity: clampedSliderX.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' })
      }]}>
        <Text style={styles.labelText}>Before</Text>
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={[
          styles.sliderHandle,
          { height: displaySize.height },
          { transform: [{ translateX: Animated.add(clampedSliderX, new Animated.Value(-SLIDER_HANDLE_WIDTH / 2)) }] }
        ]}>
          <View style={styles.sliderCircle}>
            <IoniconsIcon name="chevron-back" size={14} color="#555" style={{ marginRight: -2 }} />
            <IoniconsIcon name="chevron-forward" size={14} color="#555" style={{ marginLeft: -2 }} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  imageComparisonContainer: {
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    alignSelf: 'center', // Ensure it centers if width is less than screen
  },
  labelContainerBefore: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4, zIndex: 1,
  },
  labelContainerAfter: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4, zIndex: 1,
  },
  labelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  sliderHandle: {
    position: 'absolute', top: 0, left: 0,
    width: SLIDER_HANDLE_WIDTH,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 5,
  },
  sliderCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'white', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  // NEW Style for the expand button
  expandButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 18,
    zIndex: 2,
  },
});

export default ImageComparisonView;