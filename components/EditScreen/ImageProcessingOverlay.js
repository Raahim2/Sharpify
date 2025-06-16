// components/ImageProcessingOverlay.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const ImageProcessingOverlay = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }
  return (
    <View style={styles.processingOverlay}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={styles.processingText}>Processing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
  },
});

export default ImageProcessingOverlay;