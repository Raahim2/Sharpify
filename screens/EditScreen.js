// EnhanceScreen.js (or EditScreen.js)
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import {
  View,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image // Ensure this is from 'react-native'
} from 'react-native';
import { State } from 'react-native-gesture-handler';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import {
  IMAGE_VIEW_MAX_HEIGHT,
  API_BASE_URL,
  SCREEN_WIDTH,
} from '../components/EditScreen/constants';

import EditScreenHeader from '../components/EditScreen/header';
import ImageProcessingOverlay from '../components/EditScreen/ImageProcessingOverlay';
import ImageComparisonView from '../components/EditScreen/ImageComparisonView';
import ToolsTray from '../components/EditScreen/ToolsTray';

const blobToDataUri = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const EditScreen = ({ route, navigation }) => {
  const { imageUri: initialImageUri, mode: initialMode = 'filter' } = route.params;

  const [currentImageUri, setCurrentImageUri] = useState(initialImageUri);
  const [processedImageUri, setProcessedImageUri] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: SCREEN_WIDTH, height: IMAGE_VIEW_MAX_HEIGHT });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImageSize, setIsLoadingImageSize] = useState(true);
  
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [currentTools, setCurrentTools] = useState([]);
  const [headerTitle, setHeaderTitle] = useState('');

  const sliderInitialXPos = useRef(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(SCREEN_WIDTH / 2)).current;

  const toolsFilter = [
    { name: 'Grayscale', icon: 'palette-swatch-outline', lib: MCIcon, endpoint_filter_type: 'grayscale' },
    { name: 'Canny Edge', icon: 'image-search-outline', lib: MCIcon, endpoint_filter_type: 'canny' },
    { name: 'Invert', icon: 'invert-colors', lib: MCIcon, endpoint_filter_type: 'invert' },
    { name: 'Comic', icon: 'tooltip-image', lib: MCIcon, endpoint_filter_type: 'comic' },
    { name: 'Sketch', icon: 'lead-pencil', lib: MCIcon, endpoint_filter_type: 'sketch' },
    { name: 'Pixelate', icon: 'grid', lib: MCIcon, endpoint_filter_type: 'pixelate' },
    { name: 'Cartoon', icon: 'emoticon-cool-outline', lib: MCIcon, endpoint_filter_type: 'cartoon' },
    { name: 'Original', icon: 'image-refresh-outline', lib: MCIcon, endpoint_filter_type: 'original'},
  ];

  const toolsEnhance = [
    { name: 'Enhance', icon: 'image-auto-adjust', lib: MCIcon, endpoint_filter_type: 'sharpen' },
    { name: 'Clearify', icon: 'image-filter-center-focus', lib: MCIcon, endpoint_filter_type: 'denoise' },
    { name: 'Auto Brightness', icon: 'brightness-auto', lib: MCIcon, endpoint_filter_type: 'auto_brightness' },
    { name: 'Enlighten', icon: 'weather-sunny-alert', lib: MCIcon, endpoint_filter_type: 'enlighten' },
    { name: 'Remove Background', icon: 'image-remove', lib: MCIcon, endpoint_filter_type: 'bgrem' },
    { name: 'Blur Background', icon: 'blur', lib: MCIcon, endpoint_filter_type: 'bgblur' },
  ];

  useEffect(() => {
    if (currentMode === 'enhance') {
      setCurrentTools(toolsEnhance);
      setHeaderTitle('Enhance Image');
    } else if (currentMode === 'filter') {
      setCurrentTools(toolsFilter);
      setHeaderTitle('Apply Filter');
    }
    setProcessedImageUri(null); // Clear processed image when mode changes
    if (displaySize.width > 0) { // Reset slider when mode changes
        transX.setValue(displaySize.width / 2);
    }
  }, [currentMode, displaySize.width, transX]); // Added transX to dependency


  useEffect(() => {
    if (currentImageUri) {
      setIsLoadingImageSize(true);
      Image.getSize(
        currentImageUri,
        (width, height) => {
          setImageSize({ width, height });
          const aspectRatio = width / height;
          let dWidth = SCREEN_WIDTH;
          let dHeight = dWidth / aspectRatio;

          if (dHeight > IMAGE_VIEW_MAX_HEIGHT) {
            dHeight = IMAGE_VIEW_MAX_HEIGHT;
            dWidth = dHeight * aspectRatio;
          }
          dWidth = Math.min(dWidth, SCREEN_WIDTH);
          
          setDisplaySize({ width: dWidth, height: dHeight });

          const initialPos = dWidth / 2;
          if (sliderInitialXPos.current === null || transX._value > dWidth || transX._value < 0 ) {
            transX.setValue(initialPos);
            sliderInitialXPos.current = initialPos;
          }
          setIsLoadingImageSize(false);
        },
        (error) => {
          console.error("Image.getSize error: ", error);
          Alert.alert("Error", "Could not load image details. " + error.message);
          // Set some default display size to avoid UI breaking
          const defaultWidth = SCREEN_WIDTH;
          const defaultHeight = IMAGE_VIEW_MAX_HEIGHT * 0.8;
          setDisplaySize({ width: defaultWidth, height: defaultHeight });
          transX.setValue(defaultWidth / 2);
          sliderInitialXPos.current = defaultWidth / 2;
          setIsLoadingImageSize(false);
        }
      );
    }
  }, [currentImageUri, transX]); // Added transX to dependency

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

  const applyFilter = useCallback(async (filterType) => {
    if (!currentImageUri) {
        Alert.alert("Error", "No image selected to apply filter.");
        return;
    }
    if (filterType === 'original') {
      setProcessedImageUri(null); 
      if (displaySize.width > 0) {
        transX.setValue(displaySize.width / 2);
      }
      return;
    }

    setIsProcessing(true);
    // setProcessedImageUri(null); // Clearing here might cause a flicker before new image loads

    try {
      const formData = new FormData();
      const filename = currentImageUri.split('/').pop();
      let fileType = 'image/jpeg';
      const extensionMatch = filename.match(/\.([^.]+)$/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';

      if (extension === 'png') {
        fileType = 'image/png';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        fileType = 'image/jpeg';
      }
      
      formData.append('file', {
        uri: currentImageUri,
        name: filename,
        type: fileType,
      });
      
      const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/${filterType}`;
      console.log(`Applying filter: ${filterType} to endpoint: ${endpoint} for image: ${currentImageUri}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    errorDetail = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                } else {
                    errorDetail = errorData.detail;
                }
            } else {
                 errorDetail = `Server error: ${response.status}`;
            }
        } catch (e) {
            const textError = await response.text();
            errorDetail = textError || errorDetail;
            console.error("Non-JSON error response text:", textError);
        }
        throw new Error(errorDetail);
      }

      const imageBlob = await response.blob();
      console.log(`Received blob: type=${imageBlob.type}, size=${imageBlob.size}`);

      if (imageBlob.size === 0) {
        throw new Error('Received empty image data from server.');
      }
      
      const dataUri = await blobToDataUri(imageBlob);
      setProcessedImageUri(dataUri);

      if (displaySize.width > 0) { // Reset slider after processing
         transX.setValue(displaySize.width / 2);
      }

    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Processing Error', error.message || 'Could not apply the selected filter.');
      setProcessedImageUri(null); // Clear on error
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageUri, displaySize.width, transX]); // Added dependencies for useCallback


  // useEffect to automatically apply 'sharpen' when in 'enhance' mode and no filter is active
  useEffect(() => {
    if (
      currentMode === 'enhance' &&
      currentImageUri &&
      !isLoadingImageSize &&   // Ensure image dimensions are loaded and displaySize is set
      processedImageUri === null && // Only if no filter is currently applied or 'Original' was selected
      !isProcessing            // Only if not already processing another filter
    ) {
      console.log("Auto-applying sharpen filter");
      applyFilter('sharpen');
    }
  }, [currentMode, currentImageUri, isLoadingImageSize, processedImageUri, isProcessing, applyFilter]);


  const handleDownload = async () => {
    const imageToDownload = processedImageUri || currentImageUri;

    if (!imageToDownload) {
      Alert.alert("Download Error", "No image available to download.");
      return;
    }

    let permissionGranted = false;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        permissionGranted = true;
      } else {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to save the image to your gallery.'
        );
        return;
      }
    } catch (permError) {
        Alert.alert('Permission Error', 'Could not request storage permission.');
        console.error('Permission request error:', permError);
        return;
    }

    if (!permissionGranted) return;

    let fileUriToSave = imageToDownload;
    let temporaryFileCreated = false;

    try {
      if (imageToDownload.startsWith('data:')) {
        const base64Code = imageToDownload.split("base64,")[1];
        const fileTypeMatch = imageToDownload.match(/^data:(image\/(.+));base64,/);
        const extension = fileTypeMatch ? fileTypeMatch[2].split('+')[0] : 'jpg'; 
        
        const tempFileName = `edited_image_${Date.now()}.${extension}`;
        fileUriToSave = FileSystem.cacheDirectory + tempFileName;

        await FileSystem.writeAsStringAsync(fileUriToSave, base64Code, {
          encoding: FileSystem.EncodingType.Base64,
        });
        temporaryFileCreated = true;
      } else if (!imageToDownload.startsWith('file://')) {
        // If it's a remote URI or other non-local file URI, you might need to download it first
        // For simplicity, assuming local file URIs or data URIs are handled.
        // If currentImageUri can be a remote http/https URI, you'd download it with FileSystem.downloadAsync
        Alert.alert("Download Note", "Attempting to save a non-data URI directly. This might only work for local file URIs.");
      }
      
      const asset = await MediaLibrary.createAssetAsync(fileUriToSave);
      
      const albumName = "YourAppEdits"; // Changed album name
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false); // Store the returned album
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Image Saved!', `The image has been saved to your gallery in the '${albumName}' album.`);

    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Download Error', 'Failed to save the image. ' + (error.message || ''));
    } finally {
      if (temporaryFileCreated && fileUriToSave.startsWith(FileSystem.cacheDirectory)) {
        try {
          await FileSystem.deleteAsync(fileUriToSave, { idempotent: true });
        } catch (deleteError) {
          console.error('Error deleting temporary file:', deleteError);
        }
      }
    }
  };


  if (isLoadingImageSize && currentImageUri) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <EditScreenHeader 
            title={headerTitle || "Loading..."}
            onGoBack={() => navigation.goBack()} 
            onDownload={handleDownload} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <EditScreenHeader 
        title={headerTitle}
        onGoBack={() => navigation.goBack()} 
        onDownload={handleDownload} 
      />

      <View style={styles.imageArea}>
        <ImageProcessingOverlay isVisible={isProcessing} />
        <ImageComparisonView
          originalImageUri={currentImageUri}
          processedImageUri={processedImageUri}
          displaySize={displaySize}
          clampedSliderX={clampedSliderX}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        />
      </View>

      {currentTools.length > 0 && (
        <ToolsTray
          tools={currentTools}
          onToolPress={applyFilter}
          isProcessing={isProcessing}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', 
  },
  imageArea: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, 
    position: 'relative', 
  },
});

export default EditScreen;