// components/HomeScreen/PhotoActionModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons

const PhotoActionModal = ({ visible, imageUri, onClose, onSelectEnhance, onSelectFilter }) => {
  if (!visible) return null; // Don't render if not visible

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
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

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.enhanceButton]} onPress={onSelectEnhance}>
              <MCIcon name="creation" size={28} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Enhance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.filterButton]} onPress={onSelectFilter}>
              <MCIcon name="filter-variant" size={28} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>AI Filter</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Slightly darker overlay
  },
  modalContentContainer: {
    backgroundColor: '#1E1E1E', // Darker, more modern background
    borderRadius: 20, // More rounded corners
    padding: 20,
    width: '90%',
    maxWidth: 380, // Slightly wider for image
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200, // Fixed height, adjust as needed
    borderRadius: 15, // Rounded corners for the image
    marginBottom: 20,
    backgroundColor: '#333', // Placeholder background
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  placeholderText: {
    marginTop: 8,
    color: '#888',
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 20, // Slightly larger title
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    width: '100%',
    marginBottom: 25,
  },
  actionButton: {
    flex: 1, // Make buttons take equal space
    flexDirection: 'column', // Icon on top, text below
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 8, // Space between buttons
  },
  enhanceButton: {
    backgroundColor: '#007AFF', // iOS Blue (or your primary app color)
  },
  filterButton: {
    backgroundColor: '#5856D6', // A distinct color for AI Filter (e.g., Indigo)
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#48484A', // A more subtle gray for cancel
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoActionModal;