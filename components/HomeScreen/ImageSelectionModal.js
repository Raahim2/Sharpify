// components/HomeScreen/ImageSelectionModal.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_NUM_COLUMNS = 3;
const MODAL_ITEM_SPACING = 5;
const MODAL_ITEM_WIDTH = (screenWidth - (MODAL_NUM_COLUMNS + 1) * MODAL_ITEM_SPACING) / MODAL_NUM_COLUMNS;
const MODAL_PAGE_SIZE = 30;

const ImageSelectionModal = ({ visible, onClose, onImageSelected }) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState(null);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchModalPhotos = useCallback(async (isInitial = true) => {
    // Check permission status directly from state at the time of call
    if (!permissionResponse || !permissionResponse.granted) {
      // console.log('Modal: Permission not granted when fetchModalPhotos called');
      setIsLoading(false); // Ensure loading is stopped if permission is lost
      return;
    }

    // Use current state values for these checks to avoid stale closure values
    // This is especially important for isLoading to prevent re-entrant calls
    if (!isInitial && (!hasNextPage || isLoading)) { // isLoading check here is crucial
    //   console.log(`Modal: Skipping load more. hasNextPage: ${hasNextPage}, isLoading: ${isLoading}`);
      return;
    }
    
    // console.log(`Modal: Fetching photos. isInitial: ${isInitial}, current 'after': ${after}`);
    setIsLoading(true);

    let cursorForThisFetch = after;
    if (isInitial) {
        setPhotos([]);
        setAfter(null);
        cursorForThisFetch = null;
        setHasNextPage(true);
    }

    try {
      const mediaOptions = {
        first: MODAL_PAGE_SIZE,
        mediaType: ['photo'],
        sortBy: [MediaLibrary.SortBy.creationTime],
      };
      if (!isInitial && cursorForThisFetch) { // Use cursorForThisFetch for non-initial
        mediaOptions.after = cursorForThisFetch;
      }

      const media = await MediaLibrary.getAssetsAsync(mediaOptions);
    //   console.log(`Modal: Media fetched. Count: ${media.assets.length}, HasNext: ${media.hasNextPage}, EndCursor: ${media.endCursor}`);
      
      setPhotos(prevPhotos => {
        const newLoadedPhotos = isInitial ? media.assets : [...prevPhotos, ...media.assets];
        // console.log(`Modal: Updating photos. Prev count: ${prevPhotos.length}, New count: ${newLoadedPhotos.length}`);
        return newLoadedPhotos;
      });
      setAfter(media.endCursor);
      setHasNextPage(media.hasNextPage);
    } catch (error) {
      // console.error('Modal: Failed to fetch photos', error);
      Alert.alert('Error', 'Could not load photos for selection.');
    } finally {
      setIsLoading(false);
    }
  }, [permissionResponse, after, hasNextPage]); // REMOVED isLoading from dependencies

  useEffect(() => {
    const checkPermissionAndLoad = async () => {
      if (visible) {
        // console.log("Modal became visible. Checking permissions and loading photos.");
        let currentPermission = permissionResponse;
        if (!currentPermission) {
        //   console.log("Modal: No permissionResponse state, fetching current permissions.");
          currentPermission = await MediaLibrary.getPermissionsAsync();
          setPermissionResponse(currentPermission); // Update state, this might trigger re-render
        }

        if (currentPermission && currentPermission.granted) {
          // Only fetch if photos are empty, to avoid re-fetching if modal is hidden and re-shown
          // and photos were already loaded. Or if you always want fresh photos, remove photos.length check.
          if (photos.length === 0 && !isLoading) { // isLoading check to avoid race condition
            // console.log("Modal: Permission granted, photos empty, not loading. Fetching initial photos.");
            fetchModalPhotos(true);
          } else {
            // console.log(`Modal: Permission granted, but not fetching. Photos count: ${photos.length}, isLoading: ${isLoading}`);
          }
        } else if (currentPermission && !currentPermission.granted && currentPermission.canAskAgain) {
        //   console.log("Modal: Permission not granted but can ask again. Requesting permissions.");
          // No automatic request here anymore, let user click the button
          // const newPerm = await MediaLibrary.requestPermissionsAsync();
          // setPermissionResponse(newPerm); // This will re-trigger the effect if newPerm is different
          // if (newPerm.granted) {
          //   fetchModalPhotos(true);
          // }
        } else if (currentPermission && !currentPermission.granted && !currentPermission.canAskAgain) {
            // console.log("Modal: Permission permanently denied.");
        }
      } else {
        // Optional: Clear photos when modal is hidden to ensure fresh load next time
        // if (photos.length > 0) {
        //   console.log("Modal hidden, clearing photos for next time.");
        //   setPhotos([]);
        //   setAfter(null);
        //   setHasNextPage(true);
        // }
      }
    };
    checkPermissionAndLoad();
  }, [visible, permissionResponse, fetchModalPhotos, photos.length, isLoading]); // Added photos.length and isLoading as relevant deps

  const handleRequestPermissionInModal = async () => {
    // console.log("Modal: Grant Permission button pressed.");
    if (permissionResponse && permissionResponse.canAskAgain) {
        const newPerm = await MediaLibrary.requestPermissionsAsync();
        setPermissionResponse(newPerm); // This will trigger the useEffect if the permission status changes
    }
  };


  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => {
        onImageSelected(item);
        onClose();
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} />
    </TouchableOpacity>
  );

  const handleLoadMore = () => {
    // console.log(`Modal: handleLoadMore called. hasNextPage: ${hasNextPage}, isLoading: ${isLoading}`);
    if (hasNextPage && !isLoading) {
        fetchModalPhotos(false); // isInitial = false
    }
  }

  const renderContent = () => {
    if (!permissionResponse || (!permissionResponse.granted && !isLoading && permissionResponse.status !== "granted" )) {
    //   console.log("Modal: Rendering permission message.");
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.messageText}>Photo library permission is required to select an image.</Text>
          {permissionResponse && permissionResponse.canAskAgain && (
            <TouchableOpacity style={styles.grantButton} onPress={handleRequestPermissionInModal}>
              <Text style={styles.grantButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
           {!permissionResponse?.canAskAgain && permissionResponse?.status !== "granted" && (
             <Text style={styles.messageText}>Please enable permission in settings.</Text>
           )}
        </View>
      );
    }

    if (isLoading && photos.length === 0) {
    //   console.log("Modal: Rendering initial loading indicator.");
      return (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }
    
    if (photos.length === 0 && !isLoading) {
    //   console.log("Modal: Rendering 'No photos found' message.");
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.messageText}>No photos found.</Text>
        </View>
      );
    }

    // console.log(`Modal: Rendering FlatList with ${photos.length} photos.`);
    return (
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={MODAL_NUM_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={{ marginHorizontal: MODAL_ITEM_SPACING / 2 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading && photos.length > 0 ? <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10}} /> : null}
      />
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeAreaModal} edges={['bottom']}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Photo</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close-circle" size={30} color="#888" />
              </TouchableOpacity>
            </View>
            {renderContent()}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeAreaModal: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E1E', height: screenHeight * 0.75, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  closeButton: { padding: 5 },
  gridContainer: { paddingHorizontal: MODAL_ITEM_SPACING / 2, paddingTop: 10 },
  photoItem: { width: MODAL_ITEM_WIDTH, height: MODAL_ITEM_WIDTH, margin: MODAL_ITEM_SPACING / 2, backgroundColor: '#333', borderRadius: 8, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  messageText: { fontSize: 16, color: '#AAA', textAlign: 'center', marginBottom: 15 },
  grantButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  grantButtonText: { color: 'white', fontWeight: 'bold' },
});

export default ImageSelectionModal;