import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Profile } from '../api/profile';
import { theme } from '../core/theme';
import AppButton from './ui/AppButton';
import Icon, { type IconName } from './ui/Icon';

export default function ProfileIntro({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const fields: { icon: IconName; label: string; value: string; empty: string }[] = [
    { icon: 'map', label: 'Sống tại', value: profile.city, empty: 'Chưa cập nhật nơi sống' },
    { icon: 'home', label: 'Đến từ', value: profile.hometown, empty: 'Chưa cập nhật quê quán' },
    { icon: 'briefcase', label: 'Làm việc tại', value: profile.workplace, empty: 'Chưa cập nhật công việc' },
    { icon: 'school', label: 'Học tại', value: profile.education, empty: 'Chưa cập nhật học vấn' },
    { icon: 'mail', label: '', value: profile.email, empty: '' },
  ];
  return <View style={styles.card}>
    <View style={styles.heading}><Text style={styles.title}>Thông tin cá nhân</Text><Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Sửa thông tin cá nhân" style={styles.edit}><Icon name="edit" size={19} color={theme.colors.muted} /></Pressable></View>
    <Text style={styles.bio}>{profile.bio || 'Chưa có thông tin giới thiệu.'}</Text>
    <View style={styles.fields}>{fields.map((field) => <View key={field.icon} style={styles.row}><Icon name={field.icon} size={21} color={theme.colors.muted} /><Text style={styles.value}>{field.value ? `${field.label}${field.label ? ' ' : ''}${field.value}` : field.empty}</Text></View>)}</View>
    <AppButton label="Chỉnh sửa thông tin" onPress={onEdit} variant="secondary" />
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 20, gap: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: theme.colors.text, fontSize: 19, fontWeight: '700' },
  edit: { padding: 4 },
  bio: { color: theme.colors.text, fontSize: 14, lineHeight: 23 },
  fields: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  value: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 22, color: theme.colors.text },
});
