// components/EnhanceScreen/header.js (or EditScreenHeader.js)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';

const EditScreenHeader = ({ title, onGoBack, onDownload }) => { // Added title prop
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
        <IoniconsIcon name="close" size={30} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title || 'Result'}</Text> {/* Use dynamic title, fallback to 'Result' */}
      <TouchableOpacity onPress={onDownload} style={styles.headerButton}>
        <IoniconsIcon name="download-outline" size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#121212',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default EditScreenHeader;