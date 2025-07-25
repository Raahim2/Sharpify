// TokenScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const featuresData = [
  {
    category: "Artistic Filters",
    icon: "palette-outline",
    items: [
      { name: 'Edge Sketch', tokens: 3 }, { name: 'Comic', tokens: 4 },
      { name: 'Sketch', tokens: 2 }, { name: 'Color Sketch', tokens: 3 },
      { name: 'Water Color', tokens: 4 }, { name: 'Heat Map', tokens: 2 },
      { name: 'ASCII Art', tokens: 1 }, { name: 'Frost', tokens: 3 },
      { name: 'X-Ray', tokens: 2 }, { name: 'Cartoon', tokens: 4 },
      { name: 'Kaleidoscope', tokens: 2 }, { name: 'Grayscale', tokens: 1 },
      { name: 'Invert Colors', tokens: 1 }, { name: 'Pixelate', tokens: 2 },
      // { name: 'Oil Paint', tokens: 5 },
    ]
  },
  {
    category: "Enhance Tools",
    icon: "creation",
    items: [
      { name: 'Enhance', tokens: 3 }, { name: 'Reduce Noise', tokens: 4 },
      { name: 'Upscale', tokens: 5 }, { name: 'Auto Brightness', tokens: 2 },
      { name: 'Remove Shadows', tokens: 3 }, { name: 'Adjust Contrast', tokens: 2 },
      // { name: 'Remove Background', tokens: 5 },
       { name: 'Enhance Edges', tokens: 3 },
    ]
  }
];

const TokenScreen = ({ navigation }) => {
  
  const navigateToFeatureTestScreen = (featureName) => { // Changed parameter name for clarity
    navigation.navigate('FeatureTest', { // Ensure 'FeatureTest' matches your route name
      featureName: featureName, // Pass the specific feature name
    });
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Feature Token Costs</Text>
        </View>
        
        <Text style={styles.subHeader}>
          Each feature requires a certain number of tokens to use. 
          Tokens can be earned or purchased.
        </Text>

        {featuresData.map((categoryData, index) => (
          <View key={index} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <Icon name={categoryData.icon} size={24} color="#FFF" style={styles.categoryIcon} />
              <Text style={styles.categoryTitle}>{categoryData.category}</Text>
            </View>
            {categoryData.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex} 
                style={styles.featureItem} 
                onPress={() => navigateToFeatureTestScreen(item.name)} // Pass item.name
              >
                <Text style={styles.featureName}>{item.name}</Text>
                <View style={styles.tokenCostContainer}>
                  <Text style={styles.tokenCost}>{item.tokens}</Text>
                  <Icon name="poker-chip" size={18} color="#FFD700" style={styles.tokenIcon} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        
        <View style={styles.footerNote}>
            <Text style={styles.footerText}>Token costs are subject to change. Check back for updates!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 25,
    lineHeight: 20,
  },
  categoryContainer: {
    marginHorizontal: 15,
    marginBottom: 25,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    shadowColor: Platform.OS === 'ios' ? '#000' : '#FFF',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E0E0E0',
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  featureName: {
    fontSize: 16,
    color: '#C0C0C0',
    flex: 3,
  },
  tokenCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  tokenCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 5,
  },
  tokenIcon: {},
  footerNote: {
      marginTop: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
  },
  footerText: {
      fontSize: 12,
      color: '#777',
      textAlign: 'center',
  }
});

export default TokenScreen;

