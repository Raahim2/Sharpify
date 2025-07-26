// screens/StyleTransferScreen.js

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { State } from 'react-native-gesture-handler';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// ONNX and image processing imports
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import jpeg from 'jpeg-js';
import { fromByteArray, toByteArray } from 'base64-js';
import { Buffer } from 'buffer';
global.Buffer = Buffer; // Polyfill Buffer

// Reusable components and constants
import { IMAGE_VIEW_MAX_HEIGHT, SCREEN_WIDTH } from '../components/EditScreen/constants';
import EditScreenHeader from '../components/EditScreen/header';
import ImageProcessingOverlay from '../components/EditScreen/ImageProcessingOverlay';
import ImageComparisonView from '../components/EditScreen/ImageComparisonView';
import FilterImageTray from '../components/EditScreen/FilterImageTray';
import ImageZoom from 'react-native-image-pan-zoom';

// --- NEW: Caching Infrastructure ---
const imageCache = new Map();
const CACHE_MAX_SIZE = 20; // Store up to 20 processed images in memory

// --- Model & Asset Management ---
const STYLE_MODEL_BASE_URL = 'https://github.com/Raahim2/Sharpify/raw/main/models/';
const STYLE_DEMO_BASE_URL = 'https://raw.githubusercontent.com/Raahim2/Sharpify/main/FastAPI/demo/styles';

const MODEL_CONFIGS = {
  animegan: { 
    width: 512, 
    height: 512, 
    format: 'channels-last', 
    normalization: '[-1,1]' 
  },
  style_transfer: { 
    width: 224, 
    height: 224, 
    format: 'channels-first', 
    normalization: '[0,255]' 
  }
};

const AVAILABLE_STYLES = [
  // Style Transfer Models
  { name: 'Candy', filename: 'candy-9.onnx', type: 'style_transfer', url: `${STYLE_MODEL_BASE_URL}candy-9.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/candy.png`, lib: MCIcon, icon: 'palette-swatch-outline', endpoint_filter_type: 'candy-9.onnx'},
  { name: 'Mosaic', filename: 'mosaic-9.onnx', type: 'style_transfer', url: `${STYLE_MODEL_BASE_URL}mosaic-9.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/mosaic.png`, lib: MCIcon, icon: 'palette-swatch-outline', endpoint_filter_type: 'mosaic-9.onnx'},
  { name: 'Pointilism', filename: 'pointilism-9.onnx', type: 'style_transfer', url: `${STYLE_MODEL_BASE_URL}pointilism-9.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/pointilism.png`, lib: MCIcon, icon: 'palette-swatch-outline', endpoint_filter_type: 'pointilism-9.onnx'},
  { name: 'Rain Princess', filename: 'rain-princess-9.onnx', type: 'style_transfer', url: `${STYLE_MODEL_BASE_URL}rain-princess-9.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/rain_princess.png`, lib: MCIcon, icon: 'palette-swatch-outline', endpoint_filter_type: 'rain-princess-9.onnx'},
  { name: 'Udnie', filename: 'udnie-9.onnx', type: 'style_transfer', url: `${STYLE_MODEL_BASE_URL}udnie-9.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/udnie.png`, lib: MCIcon, icon: 'palette-swatch-outline', endpoint_filter_type: 'udnie-9.onnx'},
  // AnimeGAN Models
  { name: 'Anime', filename: 'AnimieGan.onnx', type: 'animegan', url: `${STYLE_MODEL_BASE_URL}AnimieGan.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/animegan.png`, lib: MCIcon, icon: 'face-woman-shimmer-outline', endpoint_filter_type: 'AnimieGan.onnx'},
  { name: 'Shinkai', filename: 'Shinkai.onnx', type: 'animegan', url: `${STYLE_MODEL_BASE_URL}Shinkai.onnx`, imageUrl: `${STYLE_DEMO_BASE_URL}/shinkai.png`, lib: MCIcon, icon: 'star-four-points-outline', endpoint_filter_type: 'Shinkai.onnx'},
];


const StyleTransferScreen = ({ route, navigation }) => {
  const { imageUri: initialImageUri } = route.params;

  const [currentImageUri, setCurrentImageUri] = useState(initialImageUri);
  const [processedImageUri, setProcessedImageUri] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: SCREEN_WIDTH, height: IMAGE_VIEW_MAX_HEIGHT });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImageSize, setIsLoadingImageSize] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select a style to begin');
  const [activeStyle, setActiveStyle] = useState(null);
  const sessionRef = useRef(null);
  const modelInfoRef = useRef({ inputName: null, outputName: null });
  const currentModelFilenameRef = useRef(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(SCREEN_WIDTH / 2)).current;

  useEffect(() => {
    if (currentImageUri) {
      setIsLoadingImageSize(true);
      Image.getSize(currentImageUri, (width, height) => {
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
        transX.setValue(dWidth / 2);
        setIsLoadingImageSize(false);
      }, (error) => {
        console.error("Image.getSize error: ", error);
        Alert.alert("Error", "Could not load image details.");
        setIsLoadingImageSize(false);
      });
    }
  }, [currentImageUri]);

  const imageToTensor = async (imageUri, originalSize, config) => {
    const { width: modelWidth, height: modelHeight, format } = config;
    const aspectRatio = originalSize.width / originalSize.height;
    let fitWidth, fitHeight;
    if (aspectRatio > 1) {
      fitWidth = modelWidth;
      fitHeight = Math.round(fitWidth / aspectRatio);
    } else {
      fitHeight = modelHeight;
      fitWidth = Math.round(fitHeight * aspectRatio);
    }
    const resizedImage = await ImageManipulator.manipulateAsync(
      imageUri, [{ resize: { width: fitWidth, height: fitHeight } }],
      { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );
    const jpegData = toByteArray(resizedImage.base64);
    const rawImageData = jpeg.decode(jpegData, { useTArray: true });
    const modelInputArray = new Float32Array(modelWidth * modelHeight * 3).fill(0);
    const xOffset = Math.floor((modelWidth - fitWidth) / 2);
    const yOffset = Math.floor((modelHeight - fitHeight) / 2);

    if (format === 'channels-last') {
      for (let y = 0; y < fitHeight; y++) {
        for (let x = 0; x < fitWidth; x++) {
          const sourceIndex = (y * fitWidth + x) * 4;
          const targetIndex = ((y + yOffset) * modelWidth + (x + xOffset)) * 3;
          modelInputArray[targetIndex] = (rawImageData.data[sourceIndex] / 127.5) - 1.0;
          modelInputArray[targetIndex + 1] = (rawImageData.data[sourceIndex + 1] / 127.5) - 1.0;
          modelInputArray[targetIndex + 2] = (rawImageData.data[sourceIndex + 2] / 127.5) - 1.0;
        }
      }
      return {
          tensor: new Tensor(modelInputArray, [1, modelHeight, modelWidth, 3]),
          fitSize: { width: fitWidth, height: fitHeight },
          padding: { x: xOffset, y: yOffset },
      };
    } else {
      for (let y = 0; y < fitHeight; y++) {
        for (let x = 0; x < fitWidth; x++) {
          const sourceIndex = (y * fitWidth + x) * 4;
          const targetX = x + xOffset;
          const targetY = y + yOffset;
          const r = rawImageData.data[sourceIndex];
          const g = rawImageData.data[sourceIndex + 1];
          const b = rawImageData.data[sourceIndex + 2];
          modelInputArray[targetY * modelWidth + targetX] = r;
          modelInputArray[modelWidth * modelHeight + (targetY * modelWidth + targetX)] = g;
          modelInputArray[modelWidth * modelHeight * 2 + (targetY * modelWidth + targetX)] = b;
        }
      }
      return {
          tensor: new Tensor(modelInputArray, [1, 3, modelHeight, modelWidth]),
          fitSize: { width: fitWidth, height: fitHeight },
          padding: { x: xOffset, y: yOffset },
      };
    }
  };

  const tensorToImage = async (tensor, originalSize, fitSize, padding, config) => {
    const { data, dims } = tensor;
    const { format } = config;
    let modelWidth, modelHeight;
    let frameData;
    
    if (format === 'channels-last') {
      [, modelHeight, modelWidth] = dims;
      frameData = Buffer.alloc(modelWidth * modelHeight * 4);
      let j = 0;
      for (let i = 0; i < data.length; i += 3) {
          frameData[j++] = (data[i] + 1) * 127.5;
          frameData[j++] = (data[i + 1] + 1) * 127.5;
          frameData[j++] = (data[i + 2] + 1) * 127.5;
          frameData[j++] = 255;
      }
    } else {
      [, , modelHeight, modelWidth] = dims;
      const pixelCount = modelWidth * modelHeight;
      frameData = Buffer.alloc(pixelCount * 4);
      let j = 0;
      for (let i = 0; i < pixelCount; i++) {
          frameData[j++] = Math.max(0, Math.min(255, data[i]));
          frameData[j++] = Math.max(0, Math.min(255, data[i + pixelCount]));
          frameData[j++] = Math.max(0, Math.min(255, data[i + pixelCount * 2]));
          frameData[j++] = 255;
      }
    }
    
    const base64FullImage = fromByteArray(jpeg.encode({ data: frameData, width: modelWidth, height: modelHeight }, 90).data);
    const tempUri = `${FileSystem.cacheDirectory}temp_style_output.jpg`;
    await FileSystem.writeAsStringAsync(tempUri, base64FullImage, { encoding: FileSystem.EncodingType.Base64 });
    
    const finalImage = await ImageManipulator.manipulateAsync(
        tempUri,
        [
            { crop: { originX: padding.x, originY: padding.y, width: fitSize.width, height: fitSize.height }},
            { resize: { width: originalSize.width, height: originalSize.height }}
        ],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    return finalImage.base64;
  };

  const runStyleInference = useCallback(async (style) => {
    if (!currentImageUri || !style || !style.url || imageSize.width === 0) {
      Alert.alert("Error", "Image data is not ready. Please wait a moment and try again.");
      return;
    }
    if (isProcessing) return;

    // --- CACHE CHECK ---
    const cacheKey = `${currentImageUri}::${style.filename}`;
    if (imageCache.has(cacheKey)) {
        console.log(`CACHE HIT: Displaying cached result for style '${style.name}'.`);
        setProcessedImageUri(imageCache.get(cacheKey));
        setActiveStyle(style.endpoint_filter_type);
        if (displaySize.width > 0) {
            transX.setValue(displaySize.width / 2);
        }
        return;
    }

    console.log(`CACHE MISS: Processing new result for style '${style.name}'.`);
    const config = MODEL_CONFIGS[style.type];
    if (!config) {
      Alert.alert("Error", `Configuration for model type '${style.type}' not found.`);
      return;
    }

    setIsProcessing(true);
    setProcessedImageUri(null);
    setActiveStyle(style.endpoint_filter_type);
    
    try {
      if (currentModelFilenameRef.current !== style.filename) {
        setStatusMessage(`Loading ${style.name} model...`);
        const localModelUri = `${FileSystem.cacheDirectory}${style.filename}`;
        const fileInfo = await FileSystem.getInfoAsync(localModelUri);
        
        let modelUriToLoad = fileInfo.exists ? localModelUri : null;
        if (!modelUriToLoad) {
          const downloadResult = await FileSystem.downloadAsync(style.url, localModelUri);
          modelUriToLoad = downloadResult.uri;
        }

        const session = await InferenceSession.create(modelUriToLoad);
        sessionRef.current = session;
        modelInfoRef.current = {
          inputName: session.inputNames[0],
          outputName: session.outputNames[0],
        };
        currentModelFilenameRef.current = style.filename;
      }
      
      setStatusMessage(`Preprocessing image...`);
      const { tensor: inputTensor, fitSize, padding } = await imageToTensor(currentImageUri, imageSize, config);
      
      setStatusMessage(`Applying ${style.name} style...`);
      const feeds = { [modelInfoRef.current.inputName]: inputTensor };
      const results = await sessionRef.current.run(feeds);
      const outputTensor = results[modelInfoRef.current.outputName];
      
      if (!outputTensor) throw new Error("Model output not found.");

      setStatusMessage(`Postprocessing image...`);
      const base64ImageData = await tensorToImage(outputTensor, imageSize, fitSize, padding, config);
      const dataUri = `data:image/jpeg;base64,${base64ImageData}`;

      // --- CACHE STORE ---
      imageCache.set(cacheKey, dataUri);
      if (imageCache.size > CACHE_MAX_SIZE) {
          const oldestKey = imageCache.keys().next().value;
          if (oldestKey) {
              imageCache.delete(oldestKey);
              console.log(`Cache limit reached. Removed oldest item: ${oldestKey}`);
          }
      }
      
      setProcessedImageUri(dataUri);
      if (displaySize.width > 0) {
        transX.setValue(displaySize.width / 2);
      }
      setStatusMessage('Style applied!');

    } catch (error) {
      console.error('Error applying style:', error);
      Alert.alert('Processing Error', `Failed to apply ${style.name} style. ${error.message}`);
      setStatusMessage('An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageUri, isProcessing, displaySize.width, imageSize]);

  const handleApplyStyle = (styleFilename) => {
    const selectedStyleObject = AVAILABLE_STYLES.find(s => s.filename === styleFilename);
    if (selectedStyleObject) {
      runStyleInference(selectedStyleObject);
    } else {
      console.error("Could not find style details for filename:", styleFilename);
      Alert.alert("Internal Error", "Could not find details for the selected style.");
    }
  };

  const handleDownload = async () => {
    const imageToDownload = processedImageUri;
    if (!imageToDownload) {
      Alert.alert("Nothing to Save", "Apply a style to an image first.");
      return;
    }
  
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Storage permission is needed to save images.');
      return;
    }
  
    try {
      const base64Code = imageToDownload.split("base64,")[1];
      const tempFileName = `stylized_image_${Date.now()}.jpeg`;
      const fileUri = FileSystem.cacheDirectory + tempFileName;
  
      await FileSystem.writeAsStringAsync(fileUri, base64Code, { encoding: FileSystem.EncodingType.Base64 });
      
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync("Sharpify");
      if (album === null) {
        await MediaLibrary.createAlbumAsync("Sharpify", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      Alert.alert('Image Saved!', "The stylized image has been saved to your 'Sharpify' album.");
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Save Error', 'Failed to save the image.');
    }
  };
  
  const modalImageDisplaySize = useMemo(() => {
    if (!imageSize.width || !imageSize.height) {
      return { width: 0, height: 0 };
    }
    const screen = Dimensions.get('window');
    const imageAspectRatio = imageSize.width / imageSize.height;
    const screenAspectRatio = screen.width / screen.height;

    if (imageAspectRatio > screenAspectRatio) {
      return {
        width: screen.width,
        height: screen.width / imageAspectRatio,
      };
    }
    else {
      return {
        width: screen.height * imageAspectRatio,
        height: screen.height,
      };
    }
  }, [imageSize]);
  
  const onGestureEvent = Animated.event([{ nativeEvent: { translationX: dragX } }], { useNativeDriver: false });
  
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let newPosition = transX._value + event.nativeEvent.translationX;
      newPosition = Math.max(0, Math.min(newPosition, displaySize.width));
      transX.setValue(newPosition);
      dragX.setValue(0);
    }
  };
  
  const clampedSliderX = transX.interpolate({
    inputRange: [0, displaySize.width > 0 ? displaySize.width : 1],
    outputRange: [0, displaySize.width > 0 ? displaySize.width : 1],
    extrapolate: 'clamp',
  });

  if (isLoadingImageSize) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <EditScreenHeader 
          title="AI Style Transfer"
          onGoBack={() => navigation.goBack()} 
          onDownload={handleDownload} 
        />
        <View style={styles.imageArea}>
          <ImageProcessingOverlay isVisible={isProcessing} text={statusMessage} />
          {processedImageUri ? (
            <ImageComparisonView
              originalImageUri={currentImageUri}
              processedImageUri={processedImageUri}
              displaySize={displaySize}
              clampedSliderX={clampedSliderX}
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
              onExpandPress={() => setIsFullScreen(true)}
            />
          ) : (
            <View style={styles.singleImageContainer}>
              <Image source={{ uri: currentImageUri }} style={{ width: displaySize.width, height: displaySize.height }} resizeMode="contain"/>
              <Text style={styles.instructionText}>{statusMessage}</Text>
            </View>
          )}
        </View>
        <FilterImageTray
          tools={AVAILABLE_STYLES}
          onToolPress={handleApplyStyle}
          isProcessing={isProcessing}
          activeTool={activeStyle}
        />
      </SafeAreaView>
      <Modal visible={isFullScreen} transparent={true} onRequestClose={() => setIsFullScreen(false)}>
         <View style={styles.modalContainer}>
            <ImageZoom
              cropWidth={Dimensions.get('window').width}
              cropHeight={Dimensions.get('window').height}
              imageWidth={modalImageDisplaySize.width}
              imageHeight={modalImageDisplaySize.height}
              minScale={0.8}
            >
              <Image
                  style={{ 
                    width: modalImageDisplaySize.width, 
                    height: modalImageDisplaySize.height 
                  }}
                  source={{ uri: processedImageUri }}
              />
            </ImageZoom>
            <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setIsFullScreen(false)}
            >
                <IoniconsIcon name="close" size={30} color="white" />
            </TouchableOpacity>
        </View>
      </Modal>
    </>
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
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
    },
});

export default StyleTransferScreen;