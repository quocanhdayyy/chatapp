import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { changePassword } from '../api/auth';
import { theme } from '../core/theme';
import AppButton from './ui/AppButton';
import AppTextField from './ui/AppTextField';

type Props = { userId: string; onBusyChange: (busy: boolean) => void };

export default function ChangePasswordForm({ userId, onBusyChange }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSave() {
    if (saving) return;
    setError(''); setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) { setError('Vui lòng nhập đầy đủ ba ô mật khẩu.'); return; }
    if (newPassword.length < 6 || newPassword.length > 64) { setError('Mật khẩu mới phải có từ 6 đến 64 ký tự.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setSaving(true); onBusyChange(true);
    try {
      await changePassword(userId, { currentPassword, newPassword, confirmPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setSuccess('Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Không đổi được mật khẩu.'); }
    finally { setSaving(false); onBusyChange(false); }
  }

  function handleCancel() { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); }

  return <View style={styles.form}>
    <Text style={styles.hint}>Mật khẩu mới gồm 6–64 ký tự.</Text>
    <AppTextField label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!saving} />
    <AppTextField label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!saving} />
    <AppTextField label="Nhập lại mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!saving} onSubmitEditing={handleSave} />
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    {!!success && <Text style={styles.success} accessibilityLiveRegion="polite">{success}</Text>}
    <AppButton label={saving ? 'Đang đổi…' : 'Đổi mật khẩu'} onPress={handleSave} loading={saving} />
    <AppButton label="Xóa nội dung đang nhập" onPress={handleCancel} disabled={saving} variant="secondary" />
  </View>;
}

const styles = StyleSheet.create({ form: { gap: 16 }, hint: { color: theme.colors.muted }, error: { color: theme.colors.error }, success: { color: theme.colors.success } });
