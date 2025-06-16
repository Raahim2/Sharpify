// components/PhotoItem.js
import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ITEM_WIDTH, ITEM_SPACING } from './constants'; // Adjust path if constants.js is elsewhere

const PhotoItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.photoItemContainer}
      onPress={() => onPress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  photoItemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    margin: ITEM_SPACING / 2,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

export default PhotoItem;