import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Import necessary libraries
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { fromByteArray, toByteArray } from 'base64-js';

// --- Polyfill for Buffer ---
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// --- UI & Styling Constants ---
const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#007bff',
  primaryLight: '#d6eaf8',
  secondary: '#6c757d',
  background: '#f4f6f8',
  darkText: '#333',
  lightText: '#666',
  white: '#fff',
  error: '#e74c3c',
  errorLight: '#fdeded',
  border: '#e0e0e0',
};
const SPACING = { small: 8, medium: 16, large: 24 };
const FONT_SIZES = { title: 28, subtitle: 16, body: 14 };

// --- Model & Asset Management ---

const BASE_URL = 'https://github.com/Raahim2/Sharpify/raw/refs/heads/main/models/';

const AVAILABLE_MODELS = [
  { name: 'Candy', filename: 'candy-9.onnx', type: 'style_transfer', url: `${BASE_URL}candy-9.onnx` },
  { name: 'Mosaic', filename: 'mosaic-9.onnx', type: 'style_transfer', url: `${BASE_URL}mosaic-9.onnx` },
  { name: 'Pointilism', filename: 'pointilism-9.onnx', type: 'style_transfer', url: `${BASE_URL}pointilism-9.onnx` },
  { name: 'Rain Princess', filename: 'rain-princess-9.onnx', type: 'style_transfer', url: `${BASE_URL}rain-princess-9.onnx` },
  { name: 'Udnie', filename: 'udnie-9.onnx', type: 'style_transfer', url: `${BASE_URL}udnie-9.onnx` },
  { name: 'AnimeGAN', filename: 'AnimieGan.onnx', type: 'animegan', url: `${BASE_URL}AnimieGan.onnxonnx` }, // Note: Using a specific named AnimeGAN for clarity
  { name: 'AnimeGAN v2', filename: 'AnimieGan.onnx2.onnx', type: 'animegan', url: `${BASE_URL}AnimieGan.onnx` },
  { name: 'Shinkai', filename: 'Shinkai.onnx', type: 'animegan', url: `${BASE_URL}Shinkai.onnx` },
];


const MODEL_CONFIGS = {
  animegan: { width: 512, height: 512, format: 'channels-last', normalization: '[-1,1]' },
  style_transfer: { width: 224, height: 224, format: 'channels-first', normalization: '[0,255]' }
};

const PREDEFINED_IMAGES = [
  { id: '1', url: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: '2', url: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: '3', url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: '4', url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

// --- The Component ---
const Test = () => {
  // Model state
  const [session, setSession] = useState(null);
  const [modelInfo, setModelInfo] = useState({ inputName: null, outputName: null });
  const [selectedModelFilename, setSelectedModelFilename] = useState(AVAILABLE_MODELS[0].filename);
  const [currentModelConfig, setCurrentModelConfig] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // UI/Process state
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImageUri, setProcessedImageUri] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      setSession(null);
      setError(null);
      setProcessedImageUri(null);

      const modelDetails = AVAILABLE_MODELS.find(m => m.filename === selectedModelFilename);
      if (!modelDetails) {
        setError(`Model details for ${selectedModelFilename} not found.`);
        setIsModelLoading(false);
        return;
      }
      
      const config = MODEL_CONFIGS[modelDetails.type];
      setCurrentModelConfig(config);
      setStatusMessage(`Loading ${modelDetails.name} Model...`);

      try {
        const localModelUri = `${FileSystem.cacheDirectory}${modelDetails.filename}`;
        const fileInfo = await FileSystem.getInfoAsync(localModelUri);

        let modelUriToLoad;
        if (fileInfo.exists) {
            console.log(`Model ${modelDetails.filename} found in cache.`);
            modelUriToLoad = localModelUri;
        } else {
            console.log(`Model ${modelDetails.filename} not in cache. Downloading...`);
            setStatusMessage(`Downloading ${modelDetails.name}...`);
            const downloadResult = await FileSystem.downloadAsync(modelDetails.url, localModelUri);
            modelUriToLoad = downloadResult.uri;
            console.log(`Model downloaded to: ${modelUriToLoad}`);
        }

        const newSession = await InferenceSession.create(modelUriToLoad);
        const inputName = newSession.inputNames[0];
        const outputName = newSession.outputNames[0];

        if (!inputName || !outputName) throw new Error('Could not read input/output names from the model.');
        
        setModelInfo({ inputName, outputName });
        setSession(newSession);
        setStatusMessage('Ready! Select an image to begin.');
      } catch (err) {
        console.error("Error loading ONNX model:", err);
        setError(`Failed to load ${modelDetails.name} Model. Check console for details.`);
        setStatusMessage(`Failed to load ${modelDetails.name} Model.`);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [selectedModelFilename]);

  const handleModelSelection = (modelFilename) => {
    if (isModelLoading || isProcessing) return;
    setSelectedModelFilename(modelFilename);
  };

  const handleImageSelection = (image) => {
    if (isProcessing || isModelLoading) return;
    setSelectedImage({ id: image.id, uri: image.url });
    setProcessedImageUri(null);
    setError(null);
  };

  const runInference = async () => {
    if (!session || !selectedImage || !modelInfo.inputName || !currentModelConfig) return;

    setIsProcessing(true);
    setError(null);
    setStatusMessage('Stylizing image...');
    
    try {
      const inputTensor = await imageToTensor(selectedImage.uri, currentModelConfig);
      const feeds = { [modelInfo.inputName]: inputTensor };
      const results = await session.run(feeds);
      
      const outputTensor = results[modelInfo.outputName];
      if (!outputTensor) {
        throw new Error(`Output tensor '${modelInfo.outputName}' not found. Available: ${Object.keys(results)}`);
      }
      
      const base64ImageData = await tensorToImage(outputTensor, currentModelConfig);
      setProcessedImageUri(`data:image/jpeg;base64,${base64ImageData}`);
      setStatusMessage('Styling complete!');
    } catch (e) {
      console.error('Inference error:', e);
      setError(e.message);
      setStatusMessage('An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const imageToTensor = async (imageUri, config) => {
    const { width, height, format } = config;

    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri, [{ resize: { width, height } }], { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );
    const jpegData = toByteArray(manipulatedImage.base64);
    const rawImageData = jpeg.decode(jpegData, { useTArray: true });
    
    const inputArray = new Float32Array(width * height * 3);
    const pixelCount = width * height;

    if (format === 'channels-last') {
      for (let i = 0; i < rawImageData.data.length / 4; i++) {
        inputArray[i * 3 + 0] = (rawImageData.data[i * 4 + 0] / 127.5) - 1.0;
        inputArray[i * 3 + 1] = (rawImageData.data[i * 4 + 1] / 127.5) - 1.0;
        inputArray[i * 3 + 2] = (rawImageData.data[i * 4 + 2] / 127.5) - 1.0;
      }
      return new Tensor(inputArray, [1, height, width, 3]);
    } else {
      for (let i = 0; i < pixelCount; i++) {
        inputArray[i] = rawImageData.data[i * 4 + 0];
        inputArray[i + pixelCount] = rawImageData.data[i * 4 + 1];
        inputArray[i + pixelCount * 2] = rawImageData.data[i * 4 + 2];
      }
      return new Tensor(inputArray, [1, 3, height, width]);
    }
  };

  const tensorToImage = async (tensor, config) => {
    const { data, dims } = tensor;
    const { format } = config;
    
    if (format === 'channels-last') {
      const [ , height, width] = dims;
      const frameData = Buffer.alloc(width * height * 4);
      let j = 0;
      for (let i = 0; i < data.length; i += 3) {
        frameData[j++] = (data[i + 0] + 1) * 127.5;
        frameData[j++] = (data[i + 1] + 1) * 127.5;
        frameData[j++] = (data[i + 2] + 1) * 127.5;
        frameData[j++] = 255;
      }
      return fromByteArray(jpeg.encode({ data: frameData, width, height }, 90).data);
    } else {
      const [ , , height, width] = dims;
      const pixelCount = width * height;
      const frameData = Buffer.alloc(width * height * 4);
      let j = 0;
      for (let i = 0; i < pixelCount; i++) {
        frameData[j++] = Math.max(0, Math.min(255, data[i]));
        frameData[j++] = Math.max(0, Math.min(255, data[i + pixelCount]));
        frameData[j++] = Math.max(0, Math.min(255, data[i + pixelCount * 2]));
        frameData[j++] = 255;
      }
      return fromByteArray(jpeg.encode({ data: frameData, width, height }, 90).data);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dynamic AI Stylizer</Text>
          <Text style={styles.subtitle}>{statusMessage}</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Choose a Style Model</Text>
          {isModelLoading && !statusMessage.startsWith('Downloading') && <ActivityIndicator size="small" color={COLORS.primary} style={{marginBottom: SPACING.medium}} />}
          <View style={styles.modelSelectorContainer}>
            {AVAILABLE_MODELS.map((model) => (
              <TouchableOpacity
                key={model.filename}
                style={[
                  styles.modelButton,
                  selectedModelFilename === model.filename && styles.modelButtonSelected,
                  (isModelLoading || isProcessing) && { opacity: 0.6 }
                ]}
                onPress={() => handleModelSelection(model.filename)}
                disabled={isModelLoading || isProcessing}
              >
                <Text style={[styles.modelButtonText, selectedModelFilename === model.filename && styles.modelButtonTextSelected]}>
                  {model.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {session ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Choose a Photo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
                {PREDEFINED_IMAGES.map((image) => {
                  const isSelected = selectedImage?.id === image.id;
                  return (
                    <TouchableOpacity key={image.id} onPress={() => handleImageSelection(image)} disabled={isProcessing}>
                      <Image source={{ uri: image.url }} style={[ styles.thumbnail, isSelected && styles.thumbnailSelected, isProcessing && !isSelected && { opacity: 0.5 }]} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {selectedImage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Get Your Result</Text>
                <TouchableOpacity style={[styles.stylizeButton, isProcessing && styles.buttonDisabled]} onPress={runInference} disabled={isProcessing}>
                  <Text style={styles.stylizeButtonText}>{isProcessing ? 'Stylizing...' : '✨ Stylize Me!'}</Text>
                </TouchableOpacity>

                <View style={styles.imageResultContainer}>
                  <View style={styles.imageCard}><Text style={styles.imageLabel}>Original</Text><Image source={{ uri: selectedImage.uri }} style={styles.mainImage} /></View>
                  <View style={styles.imageCard}>
                    <Text style={styles.imageLabel}>Stylized</Text>
                    {isProcessing ? (
                      <View style={[styles.mainImage, styles.placeholder]}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.placeholderText}>AI is thinking...</Text></View>
                    ) : processedImageUri ? (
                      <Image source={{ uri: processedImageUri }} style={styles.mainImage} />
                    ) : (
                      <View style={[styles.mainImage, styles.placeholder]}><Text style={styles.placeholderText}>Result will appear here</Text></View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        ) : !error && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingVertical: SPACING.large, paddingHorizontal: SPACING.medium, },
  header: { alignItems: 'center', marginBottom: SPACING.large, },
  title: { fontSize: FONT_SIZES.title, fontWeight: 'bold', color: COLORS.darkText, },
  subtitle: { fontSize: FONT_SIZES.subtitle, color: COLORS.lightText, marginTop: SPACING.small, textAlign: 'center' },
  errorText: { backgroundColor: COLORS.errorLight, color: COLORS.error, padding: SPACING.medium, borderRadius: SPACING.small, textAlign: 'center', marginBottom: SPACING.medium, fontWeight: '500', },
  section: { marginBottom: SPACING.large, },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.darkText, marginBottom: SPACING.medium, },
  modelSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.small },
  modelButton: { paddingVertical: SPACING.small, paddingHorizontal: SPACING.medium, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, },
  modelButtonSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, },
  modelButtonText: { color: COLORS.primary, fontWeight: '600', },
  modelButtonTextSelected: { color: COLORS.white, },
  thumbnailContainer: { paddingVertical: SPACING.small, },
  thumbnail: { width: 100, height: 100, borderRadius: SPACING.medium, marginRight: SPACING.medium, borderWidth: 3, borderColor: 'transparent', },
  thumbnailSelected: { borderColor: COLORS.primary, },
  stylizeButton: { backgroundColor: COLORS.primary, padding: SPACING.medium, borderRadius: SPACING.large, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, marginBottom: SPACING.large, },
  buttonDisabled: { backgroundColor: COLORS.lightText, shadowColor: 'transparent', elevation: 0, },
  stylizeButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', },
  imageResultContainer: { gap: SPACING.large, },
  imageCard: { backgroundColor: COLORS.white, borderRadius: SPACING.medium, padding: SPACING.medium, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, },
  imageLabel: { fontSize: 16, fontWeight: '600', color: COLORS.lightText, marginBottom: SPACING.small, textAlign: 'center', },
  mainImage: { width: '100%', height: width - (SPACING.medium * 4), borderRadius: SPACING.small, backgroundColor: COLORS.border, },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primaryLight, },
  placeholderText: { marginTop: SPACING.medium, color: COLORS.primary, fontWeight: '500', },
});

export default Test;