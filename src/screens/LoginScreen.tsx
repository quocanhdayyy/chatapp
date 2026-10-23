import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/ui/AppButton';
import AppTextField from '../components/ui/AppTextField';
import Brand from '../components/ui/Brand';
import { theme } from '../core/theme';

type Props = { onSubmit: (email: string, password: string) => Promise<void> };

export default function LoginScreen({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (loading) return;
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError('Vui lòng nhập email hợp lệ và mật khẩu.');
      return;
    }
    setLoading(true);
    try { await onSubmit(email, password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.'); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Brand compact />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Nhập tài khoản của bạn để tiếp tục.</Text>
        </View>
        <AppTextField label="Địa chỉ email" placeholder="ban@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!loading} />
        <AppTextField label="Mật khẩu" placeholder="Nhập mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!loading} onSubmitEditing={handleLogin} />
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <AppButton label={loading ? 'Đang đăng nhập…' : 'Đăng nhập'} onPress={handleLogin} loading={loading} />
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Tài khoản dùng thử</Text>
          <Text style={styles.hint}>Email: anh@example.com</Text>
          <Text style={styles.hint}>Mật khẩu ban đầu: 123456</Text>
          <Text style={styles.hint}>Nếu đã đổi mật khẩu, hãy dùng mật khẩu mới.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  form: { width: '100%', maxWidth: 420, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 28, gap: 22 },
  heading: { gap: 8, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '600', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 22 },
  error: { color: theme.colors.error, fontSize: 13, lineHeight: 20 },
  demo: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 20, gap: 6 },
  demoTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  hint: { color: theme.colors.muted, fontSize: 12, lineHeight: 19 },
});
