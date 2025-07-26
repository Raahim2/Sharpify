// components/FilterImageTray.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import FilterImageButton from './FilterImageButton';

const FilterImageTray = ({ tools, onToolPress, isProcessing }) => {
  return (
    <View style={styles.toolsOuterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScrollContent}
      >
        {tools.map((tool) => (
          <FilterImageButton
            key={tool.endpoint_filter_type}
            tool={tool}
            onPress={onToolPress}
            isDisabled={isProcessing}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toolsOuterContainer: {
    height: 140, // Taller to accommodate larger images
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  toolsScrollContent: {
    alignItems: 'center', // Center items vertically
    paddingHorizontal: 10,
  },
});

export default FilterImageTray;