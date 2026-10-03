import type { CapacitorConfig } from '@capacitor/cli';

// 背景色 = tokens 的 bg/base，避免 WebView 加载前白闪
const config: CapacitorConfig = {
  appId: 'com.sphaxe.milo',
  appName: '慢牛',
  webDir: 'dist',
  backgroundColor: '#0A0A0B',
  android: { backgroundColor: '#0A0A0B' },
  plugins: {
    // Android 15 起强制全面屏：由 Capacitor 注入 --safe-area-inset-*，页面自己留边（global.css）
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'DARK' },
  },
};

export default config;
