import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { Profile } from '../api/profile';
import { theme } from '../core/theme';
import { useStoredImage } from '../hooks/useStoredImage';
import AppButton from './ui/AppButton';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';

export type ProfileTab = 'posts' | 'about' | 'friends' | 'photos';
export type ProfileImageField = 'avatarImageId' | 'coverImageId';
type Props = {
  profile: Profile; friendCount: number | null; tab: ProfileTab; busy: ProfileImageField | null;
  onTab: (tab: ProfileTab) => void; onImage: (field: ProfileImageField) => void;
  onEdit: () => void; onPassword: () => void; onWrite: () => void; canWrite: boolean;
  error: string; notice: string;
  followCounts: { following: number; followers: number } | null;
  onFollowing: () => void; onFollowers: () => void;
};

export default function ProfileHero({ profile, friendCount, tab, busy, onTab, onImage, onEdit, onPassword, onWrite, canWrite, error, notice, followCounts, onFollowing, onFollowers }: Props) {
  const { width } = useWindowDimensions();
  const cover = useStoredImage(profile.coverImageId);
  const avatar = useStoredImage(profile.avatarImageId);
  const small = width < 760;
  const compact = width < 1080;
  const summary = [profile.workplace, profile.education].filter(Boolean).join(' · ');
  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: 'Bài viết' }, { key: 'about', label: 'Giới thiệu' },
    { key: 'friends', label: 'Bạn bè' }, { key: 'photos', label: 'Ảnh' },
  ];

  return (
    <View style={styles.hero}>
      <View style={styles.frame}>
        <View style={[styles.cover, small && styles.smallCover]}>
          {cover.uri && <Image source={{ uri: cover.uri }} style={styles.coverImage} resizeMode="cover" accessibilityLabel="Ảnh bìa cá nhân" />}
          {!!cover.error && <View style={styles.coverError}><Text style={styles.errorText}>{cover.error}</Text><Pressable onPress={cover.retry} accessibilityRole="button"><Text style={styles.retry}>Thử lại</Text></Pressable></View>}
          <Pressable onPress={() => onImage('coverImageId')} disabled={!!busy} accessibilityRole="button" style={[styles.coverButton, !!busy && styles.disabled]}>
            <Icon name="camera" size={18} /><Text style={styles.coverButtonText}>{busy === 'coverImageId' ? 'Đang lưu…' : profile.coverImageId ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}</Text>
          </Pressable>
        </View>
        <View style={[styles.identity, compact && styles.compactIdentity, small && styles.smallIdentity]}>
          <View style={styles.avatarFrame}>
            <Avatar name={profile.name} size={small ? 128 : 160} uri={avatar.uri} />
            <Pressable onPress={() => onImage('avatarImageId')} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Đổi ảnh đại diện" style={[styles.camera, !!busy && styles.disabled]}><Icon name="camera" size={21} /></Pressable>
          </View>
          <View style={[styles.details, small && styles.smallDetails]}>
            <Text style={[styles.name, small && styles.smallName]} accessibilityRole="header">{profile.name}</Text>
            <View style={styles.stats}>
            <Pressable onPress={() => onTab('friends')} accessibilityRole="button"><Text style={styles.friendCount}>{friendCount === null ? 'Bạn bè' : `${friendCount} người bạn`}</Text></Pressable>
              <Pressable onPress={onFollowers} accessibilityRole="button"><Text style={styles.friendCount}>{followCounts ? `${followCounts.followers} người theo dõi` : 'Người theo dõi'}</Text></Pressable>
              <Pressable onPress={onFollowing} accessibilityRole="button"><Text style={styles.friendCount}>{followCounts ? `Đang theo dõi ${followCounts.following}` : 'Đang theo dõi'}</Text></Pressable>
            </View>
            {!!summary && <Text numberOfLines={2} style={styles.summary}>{summary}</Text>}
            {!!avatar.error && <Pressable onPress={avatar.retry} accessibilityRole="button"><Text style={styles.retry}>Thử tải lại ảnh đại diện</Text></Pressable>}
          </View>
          <View style={[styles.actions, compact && styles.compactActions, small && styles.smallActions]}>
            <AppButton label="Tạo bài viết" icon="plus" onPress={onWrite} disabled={!canWrite || !!busy} />
            <AppButton label="Chỉnh sửa hồ sơ" icon="edit" onPress={onEdit} disabled={!!busy} variant="secondary" />
            <Pressable onPress={onPassword} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Đổi mật khẩu" style={styles.password}><Icon name="lock" size={19} color={theme.colors.muted} /></Pressable>
          </View>
        </View>
        {!!error && <Text style={styles.feedbackError} accessibilityRole="alert">{error}</Text>}
        {!!notice && <Text style={styles.feedback} accessibilityLiveRegion="polite">{notice}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>
          <View style={styles.tabList} accessibilityRole="tablist">
            {tabs.map((item) => <Pressable key={item.key} onPress={() => onTab(item.key)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} style={[styles.tab, tab === item.key && styles.activeTab]}><Text style={[styles.tabText, tab === item.key && styles.activeText]}>{item.label}</Text></Pressable>)}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, alignItems: 'center' },
  frame: { width: '100%', maxWidth: 1180 },
  cover: { height: 320, backgroundColor: '#E2E6EB', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' },
  smallCover: { height: 205 },
  coverImage: { width: '100%', height: '100%' },
  coverButton: { position: 'absolute', right: 24, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 14 },
  coverButtonText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  identity: { paddingHorizontal: 32, paddingBottom: 24, marginTop: -40, flexDirection: 'row', alignItems: 'flex-end', gap: 22 },
  compactIdentity: { flexWrap: 'wrap' },
  smallIdentity: { paddingHorizontal: 20, flexDirection: 'column', alignItems: 'flex-start', gap: 16 },
  avatarFrame: { padding: 5, backgroundColor: theme.colors.surface, borderRadius: 90 },
  camera: { position: 'absolute', right: 6, bottom: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.secondary, borderWidth: 3, borderColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, minWidth: 0, paddingBottom: 12, gap: 7 },
  smallDetails: { flex: 0, width: '100%', paddingBottom: 0 },
  name: { fontSize: 32, fontWeight: '700', lineHeight: 40, color: theme.colors.text },
  smallName: { fontSize: 27, lineHeight: 35 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  friendCount: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
  summary: { color: theme.colors.muted, fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, flexWrap: 'wrap', maxWidth: 440 },
  compactActions: { width: '100%', maxWidth: '100%' },
  smallActions: { maxWidth: '100%', paddingBottom: 0 },
  password: { width: 42, height: 42, backgroundColor: theme.colors.secondary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabScroll: { flexGrow: 0, borderTopWidth: 1, borderTopColor: theme.colors.border, marginHorizontal: 20 },
  tabs: { paddingHorizontal: 8 },
  tabList: { flexDirection: 'row', gap: 12 },
  tab: { paddingHorizontal: 18, paddingVertical: 21, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
  activeText: { color: theme.colors.primary },
  feedback: { color: theme.colors.success, fontSize: 13, paddingHorizontal: 32, paddingBottom: 18 },
  feedbackError: { color: theme.colors.error, fontSize: 13, lineHeight: 21, paddingHorizontal: 32, paddingBottom: 18 },
  coverError: { alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 },
  errorText: { color: theme.colors.muted, fontSize: 13 },
  retry: { color: theme.colors.primary, fontSize: 12 },
  disabled: { opacity: 0.5 },
});
