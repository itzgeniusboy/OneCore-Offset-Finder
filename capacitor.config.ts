import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onecore.offsetfinder',
  appName: 'OneCore Offset Finder',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
