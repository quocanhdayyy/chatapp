import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import UserAvatar from './ui/UserAvatar';

type Props = {
  userId: string;
  name: string;
  lastMessage: string;
  selected: boolean;
  onPress: () => void;
};

export default function ConversationRow({
  userId,
  name,
  lastMessage,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Mở cuộc trò chuyện với ${name}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <UserAvatar userId={userId} name={name} size={46} />

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>

        <Text numberOfLines={1} style={styles.preview}>
          {lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  selected: {
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    color: theme.colors.muted,
    fontSize: 13,
  },
});