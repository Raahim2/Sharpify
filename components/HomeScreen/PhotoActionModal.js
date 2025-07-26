// components/HomeScreen/PhotoActionModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const PhotoActionModal = ({ 
  visible, 
  imageUri, 
  onClose, 
  onSelectEnhance, 
  onSelectFilter, 
  onSelectRecolor,
  onSelectStyleTransfer // New prop for the style transfer action
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        {/* Use onStartShouldSetResponder to prevent the modal from closing when tapping inside it */}
        <View style={styles.modalContentContainer} onStartShouldSetResponder={() => true}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
          ) : (
            <View style={[styles.imagePreview, styles.imagePlaceholder]}>
              <MCIcon name="image-off-outline" size={60} color="#777" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <Text style={styles.modalTitle}>Choose an Action</Text>

          {/* --- UPDATED: Actions row now holds four items --- */}
          <View style={styles.actionsRow}>
            {/* Enhance Button */}
            <TouchableOpacity style={styles.actionContainer} onPress={onSelectEnhance}>
              <View style={[styles.actionButton, styles.enhanceButton]}>
                <MCIcon name="creation" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Enhance</Text>
            </TouchableOpacity>
            
            {/* AI Filter Button */}
            <TouchableOpacity style={styles.actionContainer} onPress={onSelectFilter}>
              <View style={[styles.actionButton, styles.filterButton]}>
                <MCIcon name="filter-variant" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>AI Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionContainer} onPress={onSelectStyleTransfer}>
              <View style={[styles.actionButton, styles.styleTransferButton]}>
                <MCIcon name="palette-swatch" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Style</Text>
            </TouchableOpacity>

            {/* AI Recolor Button */}
            <TouchableOpacity style={styles.actionContainer} onPress={onSelectRecolor}>
              <View style={[styles.actionButton, styles.recolorButton]}>
                <MCIcon name="format-color-fill" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Recolor</Text>
            </TouchableOpacity>

            {/* --- NEW: Style Transfer Button --- */}
            
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContentContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 25,
    backgroundColor: '#3C3C3E',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#8A8A8E',
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // This will now space four items
    width: '100%',
    marginBottom: 25,
  },
  actionContainer: {
    alignItems: 'center',
    flex: 1, // Allow items to take up equal space
  },
  actionButton: {
    width: 65, // Slightly smaller to fit four buttons comfortably
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 4,
     elevation: 5,
  },
  enhanceButton: {
    backgroundColor: '#0A84FF', // Vibrant iOS Blue
  },
  filterButton: {
    backgroundColor: '#AF52DE', // Vibrant iOS Purple
  },
  recolorButton: { 
    backgroundColor: '#FF9F0A', // Vibrant iOS Orange
  },
  styleTransferButton: { // New style for the Style Transfer button
    backgroundColor: '#34C759', // Vibrant iOS Green
  },
  actionButtonText: {
    color: '#E5E5EA',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#3A3A3C',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
});

export default PhotoActionModal;