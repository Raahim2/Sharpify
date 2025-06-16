// components/PermissionDisplay.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PermissionDisplay = ({
  message,
  showGrantButton,
  grantButtonText,
  onGrantPress,
}) => {
  return (
    <View style={styles.permissionMessageContainer}>
      <Text style={styles.permissionMessageText}>{message}</Text>
      {showGrantButton && (
        <TouchableOpacity style={styles.grantButton} onPress={onGrantPress}>
          <Text style={styles.grantButtonText}>{grantButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  permissionMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionMessageText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  grantButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  grantButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PermissionDisplay;