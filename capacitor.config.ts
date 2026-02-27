import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.helixai.app',
  appName: 'Helix AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
