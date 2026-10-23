import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import AppErrorBoundary from './src/components/ui/AppErrorBoundary';
import { theme } from './src/core/theme';
import { AuthProvider } from './src/providers/AuthProvider';

// Expo Router chọn màn hình theo URL. App giữ các provider dùng chung.
export default function App({ children }: PropsWithChildren) {
  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}><AppErrorBoundary><AuthProvider>{children}</AuthProvider></AppErrorBoundary></View>;
}
