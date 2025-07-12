// EnhanceScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { State } from 'react-native-gesture-handler';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import {
  IMAGE_VIEW_MAX_HEIGHT,
  API_BASE_URL,
  SCREEN_WIDTH,
} from '../components/EditScreen/constants';

import EditScreenHeader from '../components/EditScreen/header';
import ImageProcessingOverlay from '../components/EditScreen/ImageProcessingOverlay';
import ImageComparisonView from '../components/EditScreen/ImageComparisonView';
import ToolsTray from '../components/EditScreen/ToolsTray';

// --- NEW: Define compression strategy constants for easy tuning ---
const NO_COMPRESSION_THRESHOLD_MB = 1.5;
const HEAVY_COMPRESSION_THRESHOLD_MB = 6.5;
const MODERATE_COMPRESSION_QUALITY = 0.6; // For images between 1.5MB and 8MB
const HEAVY_COMPRESSION_QUALITY = 0.3;    // For images > 8MB

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
    { name: 'Edge Sketch', icon: 'image-search-outline', lib: MCIcon, endpoint_filter_type: 'canny' },
    { name: 'ASCII Art', icon: 'code-tags', lib: MCIcon, endpoint_filter_type: 'ascii_art' },
    { name: 'Comic', icon: 'emoticon-outline', lib: MCIcon, endpoint_filter_type: 'comic' },
    { name: 'Sketch', icon: 'pencil-outline', lib: MCIcon, endpoint_filter_type: 'sketch' },
    { name: 'Color Sketch', icon: 'brush-variant', lib: MCIcon, endpoint_filter_type: 'color_sketch' },
    { name: 'Cartoon', icon: 'emoticon-happy-outline', lib: MCIcon, endpoint_filter_type: 'cartoon' },
    { name: 'Water Color', icon: 'water-outline', lib: MCIcon, endpoint_filter_type: 'water_color' },
    { name: 'Heat Map', icon: 'thermometer', lib: MCIcon, endpoint_filter_type: 'heat' },
    { name: 'X-Ray', icon: 'ray-start-end', lib: MCIcon, endpoint_filter_type: 'xray' },
    { name: 'Invert Colors', icon: 'invert-colors', lib: MCIcon, endpoint_filter_type: 'invert' },
    { name: 'Frost', icon: 'snowflake', lib: MCIcon, endpoint_filter_type: 'frost' },
    { name: 'Grayscale', icon: 'contrast-box', lib: MCIcon, endpoint_filter_type: 'grayscale' },
    { name: 'Pixelate', icon: 'grid', lib: MCIcon, endpoint_filter_type: 'pixelate' },
    { name: 'Oil Paint', icon: 'palette-outline', lib: MCIcon, endpoint_filter_type: 'oil_paint' },
    { name: 'Kaleidoscop', icon: 'shape-polygon-plus', lib: MCIcon, endpoint_filter_type: 'kalaidoscope' },
  ];

  const toolsEnhance = [
    { name: 'Upscale', icon: 'auto-fix', lib: MCIcon, endpoint_filter_type: 'auto_enhance' },
    { name: 'Enhance', icon: 'image-auto-adjust', lib: MCIcon, endpoint_filter_type: 'sharpen' },
    { name: 'Reduce Noise', icon: 'water-off-outline', lib: MCIcon, endpoint_filter_type: 'denoise' },
    { name: 'Auto Brightness', icon: 'brightness-auto', lib: MCIcon, endpoint_filter_type: 'auto_brightness' },
    { name: 'Remove Shadows', icon: 'brightness-4', lib: MCIcon, endpoint_filter_type: 'shadow_removal' },
    { name: 'Adjust Contrast', icon: 'contrast', lib: MCIcon, endpoint_filter_type: 'contrast_adjust' },
    { name: 'Remove Background', icon: 'image-remove', lib: MCIcon, endpoint_filter_type: 'bgrem' },
    { name: 'Enhance Edges', icon: 'vector-line', lib: MCIcon, endpoint_filter_type: 'edge_enhance' },
  ];

  useEffect(() => {
    if (currentMode === 'enhance') {
      setCurrentTools(toolsEnhance);
      setHeaderTitle('Enhance Image');
    } else if (currentMode === 'filter') {
      setCurrentTools(toolsFilter);
      setHeaderTitle('Apply Filter');
    }
    setProcessedImageUri(null);
    if (displaySize.width > 0) {
        transX.setValue(displaySize.width / 2);
    }
  }, [currentMode, displaySize.width, transX]);


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
          const defaultWidth = SCREEN_WIDTH;
          const defaultHeight = IMAGE_VIEW_MAX_HEIGHT * 0.8;
          setDisplaySize({ width: defaultWidth, height: defaultHeight });
          transX.setValue(defaultWidth / 2);
          sliderInitialXPos.current = defaultWidth / 2;
          setIsLoadingImageSize(false);
        }
      );
    } else {
        setIsLoadingImageSize(false);
        const defaultWidth = SCREEN_WIDTH;
        const defaultHeight = IMAGE_VIEW_MAX_HEIGHT * 0.8;
        setDisplaySize({ width: defaultWidth, height: defaultHeight }); 
        transX.setValue(defaultWidth / 2);
    }
  }, [currentImageUri, transX]);

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
    try {
      // --- START: ADAPTIVE COMPRESSION LOGIC ---
      let uriToUpload = currentImageUri;
      let compressionQuality = null;

      try {
        const fileInfo = await FileSystem.getInfoAsync(currentImageUri);
        if (fileInfo.exists && fileInfo.size) {
            const sizeInMB = fileInfo.size / (1024 * 1024);
            
            if (sizeInMB > HEAVY_COMPRESSION_THRESHOLD_MB) {
                compressionQuality = HEAVY_COMPRESSION_QUALITY;
                console.log(`Image is large (${sizeInMB.toFixed(2)}MB). Applying heavy compression.`);
            } else if (sizeInMB > NO_COMPRESSION_THRESHOLD_MB) {
                compressionQuality = MODERATE_COMPRESSION_QUALITY;
                console.log(`Image is medium (${sizeInMB.toFixed(2)}MB). Applying moderate compression.`);
            } else {
                console.log(`Image is small (${sizeInMB.toFixed(2)}MB). No compression needed.`);
            }
        }
      } catch (e) {
        console.warn("Could not get file info, skipping smart compression.", e);
      }

      if (compressionQuality !== null) {
        const compressedImage = await ImageManipulator.manipulateAsync(
          currentImageUri,
          [],
          { 
            compress: compressionQuality,
            format: ImageManipulator.SaveFormat.PNG,
          }
        );
        uriToUpload = compressedImage.uri;
      }
      // --- END: ADAPTIVE COMPRESSION LOGIC ---
      
      const formData = new FormData();
      const filename = uriToUpload.split('/').pop();
      const fileType = 'image/jpeg';
      
      formData.append('file', {
        uri: uriToUpload,
        name: filename,
        type: fileType,
      });
      
      const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/${filterType}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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
        }
        throw new Error(errorDetail);
      }

      const imageBlob = await response.blob();

      if (imageBlob.size === 0) {
        throw new Error('Received empty image data from server.');
      }
      
      const dataUri = await blobToDataUri(imageBlob);
      setProcessedImageUri(dataUri);

      if (displaySize.width > 0) {
         transX.setValue(displaySize.width / 2);
      }

    } catch (error) {
      console.error('Error applying filter:', error);
      Alert.alert('Processing Error', error.message || 'Could not apply the selected filter.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageUri, displaySize.width, transX]);


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
      }
      
      const asset = await MediaLibrary.createAssetAsync(fileUriToSave);
      
      const albumName = "Sharpify"; 
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
         <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <EditScreenHeader 
            title={headerTitle || (currentMode === 'enhance' ? 'Enhance Image' : 'Apply Filter')}
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
    <SafeAreaView style={styles.safeArea} >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <EditScreenHeader 
        title={headerTitle}
        onGoBack={() => navigation.goBack()} 
        onDownload={handleDownload} 
      />

      <View style={styles.imageArea}>
        <ImageProcessingOverlay isVisible={isProcessing} />
        {processedImageUri ? (
          <ImageComparisonView
            originalImageUri={currentImageUri}
            processedImageUri={processedImageUri}
            displaySize={displaySize}
            clampedSliderX={clampedSliderX}
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          />
        ) : (
          currentImageUri && displaySize.width > 0 && displaySize.height > 0 ? (
            <View style={styles.singleImageContainer}>
              <Image
                source={{ uri: currentImageUri }}
                style={{ width: displaySize.width, height: displaySize.height }}
                resizeMode="contain"
              />
              {currentTools.length > 0 && (
                <Text style={styles.instructionText}>
                  Select a filter from below
                </Text>
              )}
            </View>
          ) : (
             <View style={styles.placeholderContainer}>
                {!currentImageUri && !isLoadingImageSize && <MCIcon name="image-off-outline" size={60} color="#888" />}
             </View>
          )
        )}
      </View>

      {currentTools.length > 0 && displaySize.width > 0 && (
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    backgroundColor: '#1C1C1E',
  },
  singleImageContainer: { 
    justifyContent: 'center',
    alignItems: 'center', 
  },
  instructionText: { 
    marginTop: 15, 
    color: '#B0B0B0', 
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20, 
  },
});

export default EditScreen;