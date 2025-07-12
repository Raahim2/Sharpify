// screens/FeatureTestScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Animated, StatusBar, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Image } from 'react-native'; // Still need this for Image.getSize
import Icon from 'react-native-vector-icons/Ionicons';

import ImageComparisonView from '../components/EditScreen/ImageComparisonView'; // Adjust path
import {
  IMAGE_VIEW_MAX_HEIGHT_STATIC,
  SCREEN_WIDTH,
} from '../components/EditScreen/constants'; // Adjust path

// --- Configuration for Online Images ---
const BASE_IMAGE_URL = 'https://raw.githubusercontent.com/Raahim2/Sharpify/refs/heads/main/assets/'; // IMPORTANT: SET THIS
const ORIGINAL_IMAGE_FILENAME = 'image.png'; 

const getFeatureImageFilename = (featureName) => {
  return `${featureName}.png`;
};
// --- End Configuration ---


const FeatureTestScreen = ({ route, navigation }) => {
  const { featureName } = route.params;

  const [originalImageUri, setOriginalImageUri] = useState(null);
  const [featuredImageUri, setFeaturedImageUri] = useState(null);
  const [displaySize, setDisplaySize] = useState({ width: SCREEN_WIDTH, height: IMAGE_VIEW_MAX_HEIGHT_STATIC });
  const [isLoadingImageDetails, setIsLoadingImageDetails] = useState(true);
  const [errorLoadingImages, setErrorLoadingImages] = useState(null);


  const dragX = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsLoadingImageDetails(true);
    setErrorLoadingImages(null);

    const fullOriginalImageUrl = `${BASE_IMAGE_URL}${ORIGINAL_IMAGE_FILENAME}`;
    const featureImageFilename = getFeatureImageFilename(featureName);
    const fullFeaturedImageUrl = `${BASE_IMAGE_URL}${featureImageFilename}`;

    setOriginalImageUri(fullOriginalImageUrl);
    setFeaturedImageUri(fullFeaturedImageUrl); // Assume it exists for now, Image.getSize will verify later if needed for featured

    // Get size of the original image to calculate display dimensions
    Image.getSize(
      fullOriginalImageUrl,
      (width, height) => {
        const aspectRatio = width / height;
        let dWidth = SCREEN_WIDTH * 0.95;
        let dHeight = dWidth / aspectRatio;

        if (dHeight > IMAGE_VIEW_MAX_HEIGHT_STATIC) {
          dHeight = IMAGE_VIEW_MAX_HEIGHT_STATIC;
          dWidth = dHeight * aspectRatio;
        }
        dWidth = Math.min(dWidth, SCREEN_WIDTH * 0.95);

        setDisplaySize({ width: dWidth, height: dHeight });
        transX.setValue(dWidth / 2);
        setIsLoadingImageDetails(false);

        Image.getSize(fullFeaturedImageUrl, 
            () => { /* Featured image loaded */ console.log(`Featured image ${featureName} loaded successfully.`); }, 
            (featureError) => {
                console.error(`Failed to load featured image for "${featureName}" from ${fullFeaturedImageUrl}:`, featureError);
                setErrorLoadingImages(`Preview for "${featureName}" could not be loaded. Check URL or image availability.`);
                setFeaturedImageUri(fullOriginalImageUrl); // Fallback to original
            }
        );

      },
      (error) => {
        console.error(`FeatureTestScreen: Couldn't get original image size from ${fullOriginalImageUrl}`, error);
        setErrorLoadingImages("Failed to load base comparison image. Check URL or image availability.");
        const fallbackWidth = SCREEN_WIDTH * 0.95;
        setDisplaySize({ width: fallbackWidth, height: IMAGE_VIEW_MAX_HEIGHT_STATIC * 0.8 });
        transX.setValue(fallbackWidth / 2);
        setIsLoadingImageDetails(false);
        setOriginalImageUri(null); // Clear URIs on error
        setFeaturedImageUri(null);
      }
    );
  }, [featureName]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let newPosition = transX._value + event.nativeEvent.translationX;
      newPosition = Math.max(0, Math.min(newPosition, displaySize.width));
      transX.setValue(newPosition);
      dragX.setValue(0);
    }
  };

  const currentSliderX = Animated.add(transX, dragX);
  const clampedSliderX = currentSliderX.interpolate({
    inputRange: [0, displaySize.width > 0 ? displaySize.width : 1],
    outputRange: [0, displaySize.width > 0 ? displaySize.width : 1],
    extrapolate: 'clamp',
  });

  if (isLoadingImageDetails) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading feature preview...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{featureName || "Feature Preview"}</Text>
        <View style={{width: 40}} /> 
      </View>
      
      <View style={styles.imageArea}>
        {errorLoadingImages ? (
            <View style={styles.centeredMessageContainer}>
                <Icon name="cloud-offline-outline" size={60} color="#555" />
                <Text style={styles.errorMessage}>{errorLoadingImages}</Text>
            </View>
        ) : (originalImageUri && featuredImageUri && displaySize.width > 0) ? (
          <ImageComparisonView
            originalImageUri={originalImageUri}
            processedImageUri={featuredImageUri} // This might be the same as original if feature image failed to load
            displaySize={displaySize}
            clampedSliderX={clampedSliderX}
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          />
        ) : (
            <View style={styles.centeredMessageContainer}>
                <Icon name="alert-circle-outline" size={60} color="#555" />
                <Text style={styles.errorMessage}>Could not display images.</Text>
                <Text style={styles.infoMessage}>Please check your internet connection and image URLs.</Text>
            </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Drag slider to compare Original vs {featureName || "Applied Feature"}.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeAreaLoading: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#AAA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    flexShrink: 1, // Allow title to shrink if too long
    paddingHorizontal: 5, // Add some padding around title
    textAlign: 'center',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  centeredMessageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop:10,
    marginBottom: 5,
  },
  infoMessage: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    fontSize: 13,
    color: '#AAA',
  }
});

export default FeatureTestScreen;