// components/MediaTabs.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';


const MediaTabs = ({ selectedTab, onTabChange , handelTokenPress }) => {
  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabButtonsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Photos' && styles.activeTabButton]}
          onPress={() => onTabChange('Photos')}>
          <Text style={[styles.tabButtonText, selectedTab === 'Photos' && styles.activeTabButtonText]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Videos' && styles.activeTabButton]}
          onPress={() => onTabChange('Videos')}>
          <Text style={[styles.tabButtonText, selectedTab === 'Videos' && styles.activeTabButtonText]}>Videos</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.galleryIconButton} onPress={handelTokenPress}>
        <Ionicon name="wallet" size={26} color="white" style={styles.galleryIconButton} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#222',
  },
  activeTabButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  tabButtonText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  galleryIconButton: {
    padding: 5,
  },
});

export default MediaTabs;