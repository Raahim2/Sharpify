// components/FilterImageButton.js
import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';

const FilterImageButton = ({ tool, onPress, isDisabled }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isDisabled && styles.disabled]}
      onPress={() => onPress(tool.endpoint_filter_type)}
      disabled={isDisabled}
    >
      <Image
        source={{ uri: tool.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.labelOverlay}>
        <Text style={styles.labelText}>{tool.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 120,
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default FilterImageButton;