import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { FriendAction, FriendEntry } from '../api/friends';
import { theme } from '../core/theme';
import AppButton from './ui/AppButton';
import UserAvatar from './ui/UserAvatar';

type Props = {
  person: FriendEntry;
  busyAction: FriendAction | null;
  disabled: boolean;
  confirmingRemove: boolean;
  onAction: (action: FriendAction) => void;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
};

export default function FriendRow({ person, busyAction, disabled, confirmingRemove, onAction, onConfirmRemove, onCancelRemove }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.row}>
      <View style={[styles.main, width < 650 && styles.narrow]}>
        <View style={styles.identity}>
          <UserAvatar userId={person.id} name={person.name} size={48} />
          <View style={styles.info}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.bio} numberOfLines={2}>{person.bio}</Text>
          </View>
        </View>
        {!confirmingRemove && <View style={styles.actions}>
          {person.relationship === 'none' && <AppButton label="Kết bạn" icon="plus" onPress={() => onAction('send')} disabled={disabled} loading={busyAction === 'send'} />}
          {person.relationship === 'incoming' && <>
            <AppButton label="Chấp nhận" onPress={() => onAction('accept')} disabled={disabled} loading={busyAction === 'accept'} />
            <AppButton label="Từ chối" onPress={() => onAction('decline')} disabled={disabled} loading={busyAction === 'decline'} variant="secondary" />
          </>}
          {person.relationship === 'outgoing' && <>
            <Text style={styles.status}>Đã gửi lời mời</Text>
            <AppButton label="Hủy lời mời" onPress={() => onAction('cancel')} disabled={disabled} loading={busyAction === 'cancel'} variant="secondary" />
          </>}
          {person.relationship === 'friends' && <AppButton label="Hủy kết bạn" onPress={onConfirmRemove} disabled={disabled} variant="secondary" />}
        </View>}
      </View>
      {confirmingRemove && <View style={styles.confirmation}>
        <Text style={styles.confirmText}>Hủy kết bạn với {person.name}?</Text>
        <View style={styles.actions}>
          <AppButton label="Hủy kết bạn" onPress={() => onAction('remove')} disabled={disabled} loading={busyAction === 'remove'} variant="danger" />
          <AppButton label="Giữ lại" onPress={onCancelRemove} disabled={disabled} variant="secondary" />
        </View>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 16 },
  main: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 },
  narrow: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 15, fontWeight: '600', lineHeight: 22, color: theme.colors.text },
  bio: { fontSize: 13, lineHeight: 20, color: theme.colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, flexShrink: 0 },
  status: { fontSize: 12, color: theme.colors.muted },
  confirmation: { backgroundColor: theme.colors.background, padding: 16, borderRadius: 6, gap: 12 },
  confirmText: { fontSize: 14, lineHeight: 22, color: theme.colors.text },
});
