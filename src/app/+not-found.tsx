import { router } from 'expo-router';
import AppButton from '../components/ui/AppButton';
import Page from '../components/ui/Page';
import { EmptyState } from '../components/ui/StateViews';

export default function NotFoundRoute() {
  return <Page title="Không tìm thấy trang"><EmptyState message="Đường dẫn bạn mở không tồn tại." /><AppButton label="Về trang chủ" onPress={() => router.replace('/')} /></Page>;
}
