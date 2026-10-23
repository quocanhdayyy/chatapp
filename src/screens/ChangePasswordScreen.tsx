import { useState } from 'react';
import ChangePasswordForm from '../components/ChangePasswordForm';
import Page from '../components/ui/Page';

export default function ChangePasswordScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  return <Page title="Đổi mật khẩu" onBack={onBack} busy={busy}><ChangePasswordForm userId={userId} onBusyChange={setBusy} /></Page>;
}
