import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Test = () => {
  return (
    <View style={styles.container}>
      <Text>jo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Test;
