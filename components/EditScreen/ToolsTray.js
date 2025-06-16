// components/ToolsTray.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ToolButton from './ToolButton';

const ToolsTray = ({ tools, onToolPress, isProcessing }) => {
  return (
    <View style={styles.toolsOuterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScrollContent}>
        {tools.map((tool) => (
          <ToolButton
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
    height: 90,
    backgroundColor: '#1C1C1E',
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 10,
  },
  toolsScrollContent: {
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    height: '100%',
  },
});

export default ToolsTray;