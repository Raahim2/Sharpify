// components/EnhanceTitle.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EnhanceTitle = () => {
  return (
    <View style={styles.enhanceTitleContainer}>
      <Text style={styles.enhanceTitleText}>Enhance</Text>
      <Icon name="creation" size={28} color="#FFD700" style={styles.sparkleIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  enhanceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  enhanceTitleText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '600',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
});

export default EnhanceTitle;