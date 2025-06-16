// components/ToolButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ToolButton = ({ tool, onPress, isDisabled }) => {
  const IconComponent = tool.lib;
  return (
    <TouchableOpacity
      style={styles.toolItem}
      onPress={() => onPress(tool.endpoint_filter_type)}
      disabled={isDisabled}
    >
      <IconComponent name={tool.icon} size={28} color={isDisabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)"} />
      <Text style={[styles.toolText, isDisabled && { color: "rgba(255,255,255,0.3)" }]}>{tool.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toolItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 8,
    width: 90, // Fixed width for consistent layout
  },
  toolText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ToolButton;