import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Seerr Lite',
  slug: 'seerr-lite',
  scheme: 'seerrlite',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.seerrlite',
  },
  android: {
    package: 'com.example.seerrlite',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-image'],
};

export default config;
