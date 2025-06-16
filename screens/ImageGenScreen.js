import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IoniconsIcon from 'react-native-vector-icons/Ionicons'; // For header icons
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'; // For other icons if needed

const { width: screenWidth } = Dimensions.get('window');

// Dummy Header Component (similar to EditScreenHeader)
const Header = ({ title, onGoBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
        <IoniconsIcon name="arrow-back" size={26} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title || 'AI Image Generation'}</Text>
      <View style={styles.headerButton} /> {/* Placeholder for right button if needed */}
    </View>
  );
};


const ImageGenScreen = ({ navigation }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null); // To store the URL of the generated image
    const [isGenerating, setIsGenerating] = useState(false); // For loading state

    const handleGenerateImage = () => {
        if (!prompt.trim()) {
            Alert.alert("Prompt Required", "Please enter a text prompt to generate an image.");
            return;
        }
        // Placeholder for generation logic
        setIsGenerating(true);
        // Simulate API call
        setTimeout(() => {
            setGeneratedImageUrl('https://picsum.photos/seed/' + Date.now() + '/512/512'); 
            setIsGenerating(false);
        }, 3000);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            <Header 
                title="AI Generate Image" 
                onGoBack={() => navigation.goBack()} 
            />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        
                        <View style={styles.promptContainer}>
                            <Text style={styles.label}>Enter Your Prompt:</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., A futuristic city skyline at sunset, cyberpunk style"
                                placeholderTextColor="#777"
                                value={prompt}
                                onChangeText={setPrompt}
                                multiline
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
                            onPress={handleGenerateImage}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.generateButtonText}>Generate Image</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.imageDisplayArea}>
                            {generatedImageUrl && !isGenerating ? (
                                <Image 
                                    source={{ uri: generatedImageUrl }} 
                                    style={styles.generatedImage} 
                                />
                            ) : !isGenerating ? (
                                <View style={styles.imagePlaceholder}>
                                    <MCIcon name="image-plus" size={80} color="#444" />
                                    <Text style={styles.placeholderText}>Your generated image will appear here</Text>
                                </View>
                            ) : null }
                            {/* Loading indicator for image display area can also be placed here if needed */}
                        </View>

                        {/* Future section for advanced options
                        <View style={styles.optionsContainer}>
                            <Text style={styles.label}>Advanced Options (Coming Soon)</Text>
                        </View>
                        */}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark background matching other screens
    },
    header: { // Copied from EditScreenHeader styles for consistency
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#121212', // Darker header
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    headerButton: {
        padding: 8,
        minWidth: 40, // Ensure tap area and balance layout
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start', // Align content to the top
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20, // Add some padding at the top
        paddingBottom: 40,
    },
    promptContainer: {
        width: '100%',
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        color: '#DDD', // Light text for labels
        marginBottom: 8,
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: '#2C2C2E', // Slightly lighter dark for input
        color: '#FFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 80, // For multiline input
        textAlignVertical: 'top', // For Android multiline
        borderWidth: 1,
        borderColor: '#444',
    },
    generateButton: {
        backgroundColor: '#FF69B4', // Using the PRO button color from HomeScreen
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '90%',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    generateButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#FFC0CB', // Lighter pink for disabled state
    },
    imageDisplayArea: {
        width: screenWidth * 0.85,
        height: screenWidth * 0.85, // Square aspect ratio
        backgroundColor: '#2C2C2E',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // To clip the image to rounded corners
        borderWidth: 1,
        borderColor: '#444',
    },
    generatedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain', // Or 'cover' depending on desired effect
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 15,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    // optionsContainer: { // Styles for future options
    //     width: '100%',
    //     marginTop: 30,
    //     padding: 15,
    //     backgroundColor: '#2C2C2E',
    //     borderRadius: 10,
    // },
});

export default ImageGenScreen;