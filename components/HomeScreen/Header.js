// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';

const Header = () => {

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.appName}>EnhanceAI</Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.proButton}>
          <Text style={styles.proButtonText} >PRO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicon name="settings-outline" size={26} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  appName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 15,
  },
  proButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  iconButton: {},
});

export default Header;