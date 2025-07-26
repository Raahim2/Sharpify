import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';

import { PAGE_SIZE } from '../components/HomeScreen/constants';
import Header from '../components/HomeScreen/Header';
import MediaTabs from '../components/HomeScreen/MediaTabs';
import PhotoGrid from '../components/HomeScreen/PhotoGrid';
import PermissionDisplay from '../components/HomeScreen/PermissionDisplay';
import BottomNavigation from '../components/HomeScreen/BottomNavigation';
import ImageSelectionModal from '../components/HomeScreen/ImageSelectionModal';
import PhotoActionModal from '../components/HomeScreen/PhotoActionModal';

// --- Define your local assets here ---
const LOCAL_ASSET_MODULES = [
  require('../assets/logo.png'),
  // require('../assets/1.jpg'),
  // require('../assets/2.jpg'),
];


const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Photos');
  const [photos, setPhotos] = useState([]);
  const [permissionResponse, setPermissionResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [isImageSelectionModalVisible, setIsImageSelectionModalVisible] = useState(false);
  const [imageSelectionModalPurpose, setImageSelectionModalPurpose] = useState('');
  const [isPhotoActionModalVisible, setIsPhotoActionModalVisible] = useState(false);
  const [selectedGridPhoto, setSelectedGridPhoto] = useState(null);

  const [localAssets, setLocalAssets] = useState([]);
  const [showLocalAssets, setShowLocalAssets] = useState(false);

  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const loadLocalAssets = async () => {
      try {
        const assets = await Asset.loadAsync(LOCAL_ASSET_MODULES);
        const formattedAssets = assets.map((asset, index) => ({
          id: `local-${asset.hash || index}`, // Create a unique ID
          uri: asset.localUri || asset.uri,  // Use the local file URI
          width: asset.width,
          height: asset.height,
        }));
        setLocalAssets(formattedAssets);
      } catch (e) {
        console.error("Failed to load local assets:", e);
      }
    };

    loadLocalAssets();
  }, []);

  const fetchPhotosInternal = useCallback(async (
    isInitialFetch = false,
    currentPermissionStatus,
    pagAfter,
    pagHasNextPage
  ) => {
    if (!currentPermissionStatus?.granted) {
      if (isInitialFetch) setIsLoading(false);
      return;
    }

    let cursorForThisFetch;

    if (isInitialFetch) {
      setIsLoading(true);
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      setPhotos([]);
      setAfter(null);
      setHasNextPage(true);
      setShowLocalAssets(false);
      cursorForThisFetch = null;
    } else {
      if (isLoadingMoreRef.current || !pagHasNextPage) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      cursorForThisFetch = pagAfter;
    }

    try {
      const mediaOptions = {
        first: PAGE_SIZE,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.modificationTime],
      };
      if (cursorForThisFetch) {
        mediaOptions.after = cursorForThisFetch;
      }

      const media = await MediaLibrary.getAssetsAsync(mediaOptions);
      const newPhotos = media.assets;
      
      if (isInitialFetch) {
        if (newPhotos.length > 0) {
          setPhotos(newPhotos);
          setShowLocalAssets(false);
        } else {
          setShowLocalAssets(true);
        }
      } else if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
      }
      
      setAfter(media.endCursor);
      setHasNextPage(media.hasNextPage);

    } catch (e) {
      Alert.alert('Error', 'Failed to load photos.');
      console.error("Fetch Photos Error:", e);
      if (isInitialFetch) {
        setPhotos([]);
        setShowLocalAssets(true);
      }
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      } else {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, []);


  useEffect(() => {
    const checkInitialPermissions = async () => {
      const initialPermissions = await MediaLibrary.getPermissionsAsync();
      setPermissionResponse(initialPermissions);
    };
    checkInitialPermissions();
  }, []);

  useEffect(() => {
    if (permissionResponse === null) return;
    
    if (permissionResponse.granted) {
      fetchPhotosInternal(true, permissionResponse, null, true);
    } else {
      setPhotos([]);
      setAfter(null);
      setHasNextPage(true);
      setIsLoading(false);
      setIsLoadingMore(false);
      setShowLocalAssets(true);
    }
  }, [permissionResponse, fetchPhotosInternal]);


  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    const response = await MediaLibrary.requestPermissionsAsync();
    setPermissionResponse(response);
  }, []);


  const loadMorePhotos = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasNextPage && permissionResponse?.granted) {
      fetchPhotosInternal(false, permissionResponse, after, hasNextPage);
    }
  }, [isLoading, isLoadingMore, hasNextPage, permissionResponse, after, fetchPhotosInternal]);


  const handlePhotoPress = (item) => {
    setSelectedGridPhoto(item);
    setIsPhotoActionModalVisible(true);
  };
  
  const openImageSelectionModal = (purpose) => {
    setImageSelectionModalPurpose(purpose);
    setIsImageSelectionModalVisible(true);
  };
  
  const handleImageSelectedFromModal = (selectedMediaItem) => {
    const currentPurpose = imageSelectionModalPurpose;
    setIsImageSelectionModalVisible(false); 
    setImageSelectionModalPurpose('');

    if (selectedMediaItem?.uri) {
      if (currentPurpose === 'enhance') {
        navigation.navigate('Edit', {
          imageUri: selectedMediaItem.uri, 
          imageId: selectedMediaItem.id,
          mode: 'enhance',
        });
      } else if (currentPurpose === 'aiFilters') {
        navigation.navigate('Edit', {
          imageUri: selectedMediaItem.uri, 
          imageId: selectedMediaItem.id,
          mode: 'filter',
        });
      } else if (currentPurpose === 'recolor') {
        navigation.navigate('Recolor', {
          imageUri: selectedMediaItem.uri,
          imageId: selectedMediaItem.id,
        });
      }
    }
  };

  const handlePhotoActionModalClose = () => {
    setIsPhotoActionModalVisible(false);
    setSelectedGridPhoto(null);
  };

  const navigateToEditScreen = (mode) => {
    if (selectedGridPhoto) {
      navigation.navigate('Edit', {
        imageUri: selectedGridPhoto.uri,
        imageId: selectedGridPhoto.id,
        mode: mode,
      });
    }
    handlePhotoActionModalClose();
  };

  const navigateToRecolorScreen = () => {
    if (selectedGridPhoto) {
      navigation.navigate('Recolor', {
        imageUri: selectedGridPhoto.uri,
        imageId: selectedGridPhoto.id,
      });
    }
    handlePhotoActionModalClose();
  };

  const handlePhotoActionSelectEnhance = () => navigateToEditScreen('enhance');
  const handlePhotoActionSelectFilter = () => navigateToEditScreen('filter');
  const handlePhotoActionSelectRecolor = () => navigateToRecolorScreen(); 

  const handleEnhancePress = () => openImageSelectionModal('enhance');
  const handleAiFiltersPress = () => openImageSelectionModal('aiFilters'); 
  const handleRecolorPress = () => openImageSelectionModal('recolor');

  const handletokenPress = () => navigation.navigate('Token'); 

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator size="large" color="#fff" style={styles.loader} />;
    
    if (showLocalAssets) {
      if (localAssets.length > 0) {
        return (
          <View style={{ flex: 1 }}>
            <Text style={styles.sampleHeaderText}>No Photos Found. Try our samples!</Text>
            
            {!permissionResponse?.granted && (
              <View style={styles.permissionPromptContainer}>
                <PermissionDisplay
                  message="Or, grant access to see your own photos."
                  showGrantButton={permissionResponse?.canAskAgain}
                  grantButtonText="Grant Permission"
                  onGrantPress={handleRequestPermission}
                />
              </View>
            )}

            <PhotoGrid 
              photos={localAssets} 
              onPressPhoto={handlePhotoPress}
              onEndReached={() => {}}
              isLoadingMore={false}
            />
          </View>
        );
      }
      return <PermissionDisplay message="No photos found." />;
    }

    if (!permissionResponse?.granted) {
      const msg = permissionResponse?.canAskAgain 
        ? 'Photo access permission is required to display your images.' 
        : 'Permission permanently denied. Please enable photo access in your device settings.';
      return <PermissionDisplay message={msg} showGrantButton={permissionResponse?.canAskAgain} grantButtonText="Grant Permission" onGrantPress={handleRequestPermission} />;
    }
    
    return <PhotoGrid photos={photos} onPressPhoto={handlePhotoPress} onEndReached={loadMorePhotos} isLoadingMore={isLoadingMore} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}> 
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Header />
        <MediaTabs selectedTab={selectedTab} onTabChange={setSelectedTab} handelTokenPress={handletokenPress} />
        
        {selectedTab === 'Photos' ? (
          <View style={{ flex: 1 }}>
             {renderContent()}
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>Coming Soon</Text>
          </View>
        )}
        <BottomNavigation 
          onEnhancePress={handleEnhancePress}
          onAiFiltersPress={handleAiFiltersPress}
          onRecolorPress={handleRecolorPress}
        />
      </View>
      <ImageSelectionModal
        visible={isImageSelectionModalVisible}
        onClose={() => {
            setIsImageSelectionModalVisible(false);
            setImageSelectionModalPurpose('');
        }}
        onImageSelected={handleImageSelectedFromModal}
      />
      <PhotoActionModal
        visible={isPhotoActionModalVisible}
        imageUri={selectedGridPhoto?.uri} 
        onClose={handlePhotoActionModalClose}
        onSelectEnhance={handlePhotoActionSelectEnhance}
        onSelectFilter={handlePhotoActionSelectFilter}
        onSelectRecolor={handlePhotoActionSelectRecolor}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  sampleHeaderText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#1C1C1E'
  },
  permissionPromptContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
});

export default HomeScreen;