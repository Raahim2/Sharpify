// components/HomeScreen/BottomNavigation.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomNavigation = ({ onEnhancePress, onAiFiltersPress, onStyleTransferPress, onRecolorPress }) => {
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.bottomNavItem} onPress={onEnhancePress}>
        <Icon name="creation" size={28} color="#FFF" />
        <Text style={styles.bottomNavText}>Enhance</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavItem} onPress={onAiFiltersPress}>
        <Icon name="image-auto-adjust" size={28} color="#FFF" />
        <Text style={styles.bottomNavText}>AI Filters</Text>
      </TouchableOpacity>
      {/* New Style Transfer Option */}
      <TouchableOpacity style={styles.bottomNavItem} onPress={onStyleTransferPress}>
        <Icon name="palette-swatch" size={28} color="#FFF" />
        <Text style={styles.bottomNavText}>Style Transfer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavItem} onPress={onRecolorPress}>
        <Icon name="format-color-fill" size={28} color="#FFF" />
        <Text style={styles.bottomNavText}>AI Recolor</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1, // This allows the items to space out evenly
  },
  bottomNavText: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 4,
  },
});

export default BottomNavigation;