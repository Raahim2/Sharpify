// HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';

import { PAGE_SIZE } from '../components/HomeScreen/constants';
import Header from '../components/HomeScreen/Header';
import EnhanceTitle from '../components/HomeScreen/EnhanceTitle';
import MediaTabs from '../components/HomeScreen/MediaTabs';
import PhotoGrid from '../components/HomeScreen/PhotoGrid';
import PermissionDisplay from '../components/HomeScreen/PermissionDisplay';
import BottomNavigation from '../components/HomeScreen/BottomNavigation';
import ImageSelectionModal from '../components/HomeScreen/ImageSelectionModal';
import PhotoActionModal from '../components/HomeScreen/PhotoActionModal';

const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Photos');
  const [photos, setPhotos] = useState([]);
  const [permissionResponse, setPermissionResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial permission check
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [isImageSelectionModalVisible, setIsImageSelectionModalVisible] = useState(false);
  const [imageSelectionModalPurpose, setImageSelectionModalPurpose] = useState('');
  const [isPhotoActionModalVisible, setIsPhotoActionModalVisible] = useState(false);
  const [selectedGridPhoto, setSelectedGridPhoto] = useState(null);

  const isLoadingMoreRef = useRef(false); // Ref to prevent re-entrant loadMore calls

  // Stable fetchPhotosInternal
  const fetchPhotosInternal = useCallback(async (
    isInitialFetch = false,
    currentPermissionStatus, // The permission object
    pagAfter, // Current 'after' state for "load more"
    pagHasNextPage // Current 'hasNextPage' state for "load more"
  ) => {
    if (!currentPermissionStatus?.granted) {
      if (isInitialFetch) setIsLoading(false);
      return;
    }

    let cursorForThisFetch;

    if (isInitialFetch) {
      setIsLoading(true); // Main loading state
      isLoadingMoreRef.current = false; // Reset load more ref
      setIsLoadingMore(false);      // Reset load more state

      setPhotos([]); // Clear photos before new fetch
      setAfter(null);  // Reset cursor state
      setHasNextPage(true); // Reset hasNextPage state
      cursorForThisFetch = null;
    } else { // Load More
      if (isLoadingMoreRef.current || !pagHasNextPage) {
        return; // Already loading more or no more pages
      }
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      cursorForThisFetch = pagAfter;
    }

    try {
      const mediaOptions = {
        first: PAGE_SIZE,
        mediaType: [MediaLibrary.MediaType.photo], // Use enum for clarity
        sortBy: [MediaLibrary.SortBy.creationTime],
      };
      if (cursorForThisFetch) {
        mediaOptions.after = cursorForThisFetch;
      }

      const media = await MediaLibrary.getAssetsAsync(mediaOptions);
      const newPhotos = media.assets;

      if (isInitialFetch) {
        setPhotos(newPhotos.length > 0 ? newPhotos : []);
      } else if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
      }
      
      setAfter(media.endCursor);
      setHasNextPage(media.hasNextPage);

    } catch (e) {
      Alert.alert('Error', 'Failed to load photos.');
      console.error("Fetch Photos Error:", e);
      if (isInitialFetch) setPhotos([]); // Clear on error for initial
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      } else {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [/* All setState functions are stable, PAGE_SIZE is constant */]);


  // Effect 1: Check permissions on mount
  useEffect(() => {
    // setIsLoading(true) is set in initial state
    const checkInitialPermissions = async () => {
      const initialPermissions = await MediaLibrary.getPermissionsAsync();
      setPermissionResponse(initialPermissions);
      // If not granted here, Effect 2 will handle UI and setIsLoading(false)
    };
    checkInitialPermissions();
  }, []); // Runs once on mount

  // Effect 2: React to permission changes (including initial status from Effect 1)
  useEffect(() => {
    if (permissionResponse === null) {
      // setIsLoading(true) should be active from initial state or Effect 1
      return; // Permissions not yet determined
    }

    if (permissionResponse.granted) {
      // Permissions are granted, fetch initial data.
      // fetchPhotosInternal will manage setIsLoading for its duration.
      fetchPhotosInternal(true, permissionResponse, null, true); // initial, perms, after, hasNextPage
    } else {
      // Permissions denied or not determined as granted
      setPhotos([]);
      setAfter(null);
      setHasNextPage(true);
      setIsLoading(false); // Crucial: turn off main loader
      setIsLoadingMore(false);
    }
  }, [permissionResponse, fetchPhotosInternal]); // fetchPhotosInternal is stable


  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true); // Show loader while asking
    const response = await MediaLibrary.requestPermissionsAsync();
    setPermissionResponse(response); // This will trigger Effect 2
    // If not granted, Effect 2 will set isLoading(false) and clear photos.
  }, [/* setPermissionResponse is stable */]);


  const loadMorePhotos = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasNextPage && permissionResponse?.granted) {
      fetchPhotosInternal(false, permissionResponse, after, hasNextPage);
    }
  }, [isLoading, isLoadingMore, hasNextPage, permissionResponse, after, fetchPhotosInternal]);


  const handlePhotoPress = (item) => {
    setSelectedGridPhoto(item);
    setIsPhotoActionModalVisible(true);
  };
  
  const handleRefreshPhotos = useCallback(() => {
    if (permissionResponse?.granted) {
      // Call fetchPhotosInternal for a fresh initial load
      fetchPhotosInternal(true, permissionResponse, null, true);
    } else {
      Alert.alert("Permission Required", "Photo library permission is needed to refresh photos.");
    }
  }, [permissionResponse, fetchPhotosInternal]);

  const openImageSelectionModal = (purpose) => {
    setImageSelectionModalPurpose(purpose);
    setIsImageSelectionModalVisible(true);
  };
  
  const handleImageSelectedFromModal = (selectedMediaItem) => {
    setIsImageSelectionModalVisible(false); 
    if (selectedMediaItem?.uri) {
      const navigationMode = imageSelectionModalPurpose === 'enhance' ? 'enhance' : (imageSelectionModalPurpose === 'aiFilters' ? 'filter' : '');
      if (navigationMode) {
        navigation.navigate('Edit', {
          imageUri: selectedMediaItem.uri, 
          imageId: selectedMediaItem.id,
          mode: navigationMode,
        });
      }
    }
    setImageSelectionModalPurpose(''); 
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

  const handlePhotoActionSelectEnhance = () => navigateToEditScreen('enhance');
  const handlePhotoActionSelectFilter = () => navigateToEditScreen('filter');

  const handleEnhancePress = () => openImageSelectionModal('enhance');
  const handleAiFiltersPress = () => openImageSelectionModal('aiFilters'); 
  const handleAiPhotoPress = () => navigation.navigate('ImageGen'); 

  const renderContent = () => {
    // Primary loading state (initial permission check or initial photo fetch)
    if (isLoading) return <ActivityIndicator size="large" color="#fff" style={styles.loader} />;
    
    // Permission not granted
    if (!permissionResponse?.granted) {
      const msg = permissionResponse?.canAskAgain 
        ? 'Photo access permission is required to display your images.' 
        : 'Permission permanently denied. Please enable photo access in your device settings for this app.';
      return <PermissionDisplay message={msg} showGrantButton={permissionResponse?.canAskAgain} grantButtonText="Grant Permission" onGrantPress={handleRequestPermission} />;
    }
    
    // Permission granted, but no photos found (and not currently loading more)
    if (photos.length === 0 && !isLoadingMore) {
      return <PermissionDisplay message="No photos found in your library." showGrantButton={true} grantButtonText="Refresh Photos" onGrantPress={handleRefreshPhotos} />;
    }
    
    // Display photos
    return <PhotoGrid photos={photos} onPressPhoto={handlePhotoPress} onEndReached={loadMorePhotos} isLoadingMore={isLoadingMore} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}> 
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Header />
        <EnhanceTitle />
        <MediaTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
        
        {selectedTab === 'Photos' ? (
          <View style={{ flex: 1 }}>
             {renderContent()}
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>Video display not implemented yet.</Text>
          </View>
        )}
        <BottomNavigation 
          onEnhancePress={handleEnhancePress}
          onAiFiltersPress={handleAiFiltersPress}
          onAiPhotoPress={handleAiPhotoPress}
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
});

export default HomeScreen;