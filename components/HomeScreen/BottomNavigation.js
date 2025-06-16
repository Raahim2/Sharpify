// components/HomeScreen/BottomNavigation.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomNavigation = ({ onEnhancePress, onAiFiltersPress, onAiPhotoPress }) => {
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
      <TouchableOpacity style={styles.bottomNavItem} onPress={onAiPhotoPress}>
        <Icon name="robot" size={28} color="#FFF" />
        <Text style={styles.bottomNavText}>AI Photo</Text>
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
    flex: 1,
  },
  bottomNavText: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 4,
  },
});

export default BottomNavigation;