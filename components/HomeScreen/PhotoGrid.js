// components/PhotoGrid.js
import React from 'react';
import { FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import PhotoItem from './PhotoItem';
import { NUM_COLUMNS, ITEM_SPACING, BOTTOM_NAV_APPROX_HEIGHT } from './constants'; 

const PhotoGrid = ({
  photos,
  onPressPhoto,
  onEndReached,
  isLoadingMore,
}) => {
  const renderPhotoItemInternal = ({ item }) => (
    <PhotoItem item={item} onPress={onPressPhoto} />
  );

  return (
    <FlatList
      data={photos}
      renderItem={renderPhotoItemInternal}
      keyExtractor={(item, index) => item.id + '-' + index}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={{ marginHorizontal: ITEM_SPACING / 2 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 20 }} /> : null}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: ITEM_SPACING / 2,
    paddingBottom: BOTTOM_NAV_APPROX_HEIGHT + 10,
  },
});

export default PhotoGrid;