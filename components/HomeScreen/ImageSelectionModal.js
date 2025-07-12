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
import { Asset } from 'expo-asset'; // <-- Import Asset
import Icon from 'react-native-vector-icons/Ionicons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_NUM_COLUMNS = 3;
const MODAL_ITEM_SPACING = 5;
const MODAL_ITEM_WIDTH = (screenWidth - (MODAL_NUM_COLUMNS + 1) * MODAL_ITEM_SPACING) / MODAL_NUM_COLUMNS;
const MODAL_PAGE_SIZE = 30;

// --- NEW: Define your local sample assets for the modal ---
const LOCAL_ASSET_MODULES = [
  require('../../assets/logo.png'),
];

const ImageSelectionModal = ({ visible, onClose, onImageSelected }) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState(null);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  // --- NEW: State for local assets ---
  const [localAssets, setLocalAssets] = useState([]);
  const [showLocalAssetsInModal, setShowLocalAssetsInModal] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      if (visible && localAssets.length === 0) {
        try {
          const assets = await Asset.loadAsync(LOCAL_ASSET_MODULES);
          const formattedAssets = assets.map((asset, index) => ({
            id: `local-modal-${asset.hash || index}`,
            uri: asset.localUri || asset.uri,
            width: asset.width,
            height: asset.height,
          }));
          setLocalAssets(formattedAssets);
        } catch (e) {
          console.error("Modal: Failed to load local assets:", e);
        }
      }
    };
    loadAssets();
  }, [visible, localAssets.length]);

  const fetchModalPhotos = useCallback(async (isInitial = true) => {
    if (!permissionResponse || !permissionResponse.granted) {
      setIsLoading(false);
      setShowLocalAssetsInModal(true); // Show samples if no permission
      return;
    }

    if (!isInitial && (!hasNextPage || isLoading)) {
      return;
    }
    
    setIsLoading(true);

    if (isInitial) {
        setPhotos([]);
        setAfter(null);
        setHasNextPage(true);
        setShowLocalAssetsInModal(false); // Reset on initial fetch
    }

    try {
      const mediaOptions = {
        first: MODAL_PAGE_SIZE,
        mediaType: ['photo'],
        sortBy: [MediaLibrary.SortBy.modificationTime],
        after: isInitial ? undefined : after,
      };

      const media = await MediaLibrary.getAssetsAsync(mediaOptions);
      
      if (isInitial && media.assets.length === 0) {
        // No photos found in library, switch to showing local assets
        setShowLocalAssetsInModal(true);
      } else {
        setPhotos(prevPhotos => isInitial ? media.assets : [...prevPhotos, ...media.assets]);
      }
      
      setAfter(media.endCursor);
      setHasNextPage(media.hasNextPage);
    } catch (error) {
      Alert.alert('Error', 'Could not load photos for selection.');
      setShowLocalAssetsInModal(true); // Fallback to local assets on error
    } finally {
      setIsLoading(false);
    }
  }, [permissionResponse, after, hasNextPage, isLoading]);

  useEffect(() => {
    const checkPermissionAndLoad = async () => {
      if (visible) {
        let currentPermission = permissionResponse;
        if (!currentPermission) {
          currentPermission = await MediaLibrary.getPermissionsAsync();
          setPermissionResponse(currentPermission);
        }

        if (currentPermission?.granted) {
          if (photos.length === 0 && !isLoading) {
            fetchModalPhotos(true);
          }
        } else {
          setShowLocalAssetsInModal(true);
        }
      } else {
        // Reset state when modal is hidden for a clean open next time
        setPhotos([]);
        setAfter(null);
        setHasNextPage(true);
        setShowLocalAssetsInModal(false);
      }
    };
    checkPermissionAndLoad();
  }, [visible, permissionResponse]); 

  const handleRequestPermissionInModal = async () => {
    if (permissionResponse && permissionResponse.canAskAgain) {
        const newPerm = await MediaLibrary.requestPermissionsAsync();
        setPermissionResponse(newPerm); // This will re-trigger the useEffect
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
    if (hasNextPage && !isLoading && !showLocalAssetsInModal) {
        fetchModalPhotos(false);
    }
  }

  const renderContent = () => {
    // --- NEW: Primary logic to show local assets if flag is set ---
    if (showLocalAssetsInModal) {
      if (localAssets.length === 0) {
        return <ActivityIndicator size="large" color="#007AFF" style={styles.centeredMessage} />;
      }
      return (
        <>
          <Text style={styles.sampleHeaderText}>No photos found. Try our samples!</Text>
          <FlatList
            data={localAssets}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id}
            numColumns={MODAL_NUM_COLUMNS}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={{ marginHorizontal: MODAL_ITEM_SPACING / 2 }}
          />
        </>
      );
    }

    if (isLoading && photos.length === 0) {
      return (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }
    
    // This case should now be rare because it's caught by showLocalAssetsInModal
    if (photos.length === 0 && !isLoading) {
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.messageText}>No photos found.</Text>
        </View>
      );
    }

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
  sampleHeaderText: { // --- NEW STYLE ---
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
});

export default ImageSelectionModal;