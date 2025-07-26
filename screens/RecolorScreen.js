import React, { useState, useEffect } from 'react'; // Import useEffect
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import EditScreenHeader from '../components/EditScreen/header';

const ORIGINAL_IMAGE_ID = 'original';
const PREDEFINED_COLORS = [ ORIGINAL_IMAGE_ID, '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#8E8E93', '#FFFFFF', '#000000', '#A2845E' ];
const CLOUDINARY_CLOUD_NAME = 'defyovyob'; // Replace with your actual Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'Sharpify';

// This key will be used to store our cache object in the phone's storage
const UPLOAD_CACHE_KEY = '@upload_cache';

const RecolorScreen = ({ route, navigation }) => {
    const originalImageUri = route?.params?.imageUri;

    const [itemToRecolor, setItemToRecolor] = useState('');
    const [selectedColor, setSelectedColor] = useState(ORIGINAL_IMAGE_ID);
    const [recoloredImageUri, setRecoloredImageUri] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
    const [uploadedImagePublicId, setUploadedImagePublicId] = useState(null);

    // FIX, PART 1: Use useEffect to load the publicId from persistent storage when the component mounts.
    useEffect(() => {
        const loadCache = async () => {
            try {
                const cachedData = await AsyncStorage.getItem(UPLOAD_CACHE_KEY);
                const cache = cachedData ? JSON.parse(cachedData) : {};
                if (cache[originalImageUri]) {
                    console.log(`Found persistent publicId: ${cache[originalImageUri]}`);
                    setUploadedImagePublicId(cache[originalImageUri]);
                }
            } catch (e) {
                console.error("Failed to load cache from AsyncStorage", e);
            }
        };
        loadCache();
    }, [originalImageUri]); // This effect runs only when the image URI changes.


    const handleColorSelect = async (color) => {
        if (color === ORIGINAL_IMAGE_ID) {
            setRecoloredImageUri(null);
            setSelectedColor(ORIGINAL_IMAGE_ID);
            setError(null);
            return;
        }

        if (isColorPickerVisible) setIsColorPickerVisible(false);

        if (!itemToRecolor.trim()) {
            Alert.alert("Specify an Item", "Please describe the item you want to recolor first.");
            return;
        }

        setIsLoading(true);
        setSelectedColor(color);
        setError(null);

        try {
            let publicId = uploadedImagePublicId;

            if (!publicId) {
                console.log(`No persistent publicId found for ${originalImageUri}. Uploading now...`);
                const data = new FormData();
                data.append('file', { uri: originalImageUri, type: 'image/jpeg', name: 'upload.jpg' });
                data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
                const responseData = await response.json();

                if (responseData.error) {
                    throw new Error(responseData.error.message);
                }

                publicId = responseData.public_id;
                setUploadedImagePublicId(publicId);

                // FIX, PART 2: Save the new publicId to persistent storage.
                try {
                    const cachedData = await AsyncStorage.getItem(UPLOAD_CACHE_KEY);
                    const cache = cachedData ? JSON.parse(cachedData) : {};
                    cache[originalImageUri] = publicId; // Add the new entry
                    await AsyncStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(cache));
                    console.log(`Persistently cached new publicId: ${publicId}`);
                } catch(e) {
                    console.error("Failed to save to AsyncStorage", e);
                }
            } else {
                console.log(`Using persistent publicId: ${publicId}`);
            }

            const prompt = `prompt_${encodeURIComponent(itemToRecolor.trim().toLowerCase())}`;
            const toColor = `to-color_${color.substring(1)}`;
            const newUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/e_gen_recolor:${prompt};${toColor}/${publicId}`;
            setRecoloredImageUri(newUrl);

        } catch (e) {
            setError(`Error: ${e.message}`);
            setIsLoading(false);
        }
    };
    
    // The rest of your code is perfect and remains unchanged.
    const onImageLoad = () => setIsLoading(false);
    const onImageError = () => {
        setIsLoading(false);
        setError('Could not load the recolored image. Check credits or prompt.');
        setRecoloredImageUri(null); 
    };

    const handleDownload = async () => {
        const imageToDownload = recoloredImageUri || originalImageUri;
        if (!imageToDownload) { Alert.alert("Download Error", "No image available to download."); return; }
        try {
          await MediaLibrary.requestPermissionsAsync();
          const tempFileName = `recolored_image_${Date.now()}.jpg`;
          const fileUri = FileSystem.cacheDirectory + tempFileName;
          const { uri: downloadedUri } = await FileSystem.downloadAsync(imageToDownload, fileUri);
          const asset = await MediaLibrary.createAssetAsync(downloadedUri);
          const albumName = "Sharpify";
          let album = await MediaLibrary.getAlbumAsync(albumName);
          if (album === null) { album = await MediaLibrary.createAlbumAsync(albumName, asset, false); }
          else { await MediaLibrary.addAssetsToAlbumAsync([asset], album, false); }
          Alert.alert('Image Saved!', `The image has been saved to your gallery in the '${albumName}' album.`);
        } catch (error) {
          console.error('Error saving image:', error);
          Alert.alert('Download Error', 'Failed to save the image. ' + (error.message || ''));
        }
    };

    const displayedImageUri = recoloredImageUri || originalImageUri;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            <EditScreenHeader title={"Recolor Image"} onGoBack={() => navigation.goBack()} onDownload={handleDownload} />
            <View style={styles.screen}>
                <View style={styles.imageContainer}>
                    {originalImageUri ? (
                        <>
                            <Image source={{ uri: displayedImageUri }} style={styles.image} resizeMode="contain" onLoad={onImageLoad} onError={onImageError} key={displayedImageUri} />
                            {isLoading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFFFFF" /></View>)}
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>No image selected</Text></View>
                    )}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.controlsSection}>
                    <ScrollView>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Items to recolor:</Text>
                            <TextInput style={styles.textInput} placeholder="e.g., shirt ,sofa " placeholderTextColor="#777" value={itemToRecolor} onChangeText={setItemToRecolor} />
                        </View>
                        <View style={styles.colorPaletteGroup}>
                            <Text style={styles.colorPaletteLabel}>Choose new color:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteScrollView}>
                                {PREDEFINED_COLORS.map((color) => {
                                    const isSelected = selectedColor === color;
                                    if (color === ORIGINAL_IMAGE_ID) {
                                        return (<TouchableOpacity key={ORIGINAL_IMAGE_ID} style={[styles.colorBox, styles.originalColorBox, isSelected && styles.selectedColorBox]} onPress={() => handleColorSelect(ORIGINAL_IMAGE_ID)}><View style={styles.originalIconLine} /></TouchableOpacity>);
                                    }
                                    return (<TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }, (color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#000000') && styles.lightDarkColorBoxBorder, isSelected && styles.selectedColorBox]} onPress={() => handleColorSelect(color)}>{isLoading && isSelected && (<ActivityIndicator size="small" color={color === '#FFFFFF' ? '#000000' : '#FFFFFF'} />)}</TouchableOpacity>);
                                })}
                                <TouchableOpacity style={[styles.colorBox, styles.customColorBox]} onPress={() => setIsColorPickerVisible(true)}><Text style={styles.customColorBoxText}>🎨</Text></TouchableOpacity>
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};
// Styles are unchanged
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1C1C1E' },
    screen: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 25, paddingBottom: 20 },
    imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 15, marginBottom: 25, overflow: 'hidden', minHeight: 200 },
    image: { width: '100%', height: '100%' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#AAAAAA', fontSize: 16, textAlign: 'center' },
    controlsSection: {},
    inputGroup: { marginBottom: 25 },
    inputLabel: { color: '#E0E0E0', fontSize: 16, marginBottom: 10 },
    textInput: { backgroundColor: '#2C2C2E', color: '#FFFFFF', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#3A3A3C' },
    colorPaletteGroup: {},
    colorPaletteLabel: { color: '#E0E0E0', fontSize: 16, marginBottom: 12 },
    colorPaletteScrollView: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    colorBox: { width: 44, height: 44, borderRadius: 22, marginRight: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
    originalColorBox: { backgroundColor: '#3A3A3C', borderWidth: 1.5, borderColor: '#555555', overflow: 'hidden' },
    originalIconLine: { width: '120%', height: 2, backgroundColor: '#FF3B30', transform: [{ rotate: '-45deg' }] },
    lightDarkColorBoxBorder: { borderWidth: 1.5, borderColor: '#555555' },
    selectedColorBox: { borderWidth: 3, borderColor: '#007AFF' },
    customColorBox: { backgroundColor: '#3A3A3C', borderWidth: 1, borderColor: '#555555' },
    customColorBoxText: { fontSize: 22 },
    errorText: { color: '#FF3B30', textAlign: 'center', marginBottom: 15, fontSize: 14 },
});


export default RecolorScreen;