// constants/editScreenConstants.js
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const IMAGE_VIEW_MAX_HEIGHT = screenHeight * 0.65;
export const SLIDER_HANDLE_WIDTH = 40;
export const API_BASE_URL = 'https://enhance-ai-gamma.vercel.app'; // No trailing slash
export const SCREEN_WIDTH = screenWidth;