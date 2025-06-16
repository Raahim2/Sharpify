// constants.js
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const NUM_COLUMNS = 3;
export const ITEM_SPACING = 5;
export const ITEM_WIDTH = (width - (NUM_COLUMNS + 1) * ITEM_SPACING) / NUM_COLUMNS;
export const PAGE_SIZE = 21;
export const BOTTOM_NAV_APPROX_HEIGHT = 70;