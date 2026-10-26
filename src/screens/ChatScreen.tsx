import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { getConversations, getMessages } from '../api/chat';
import { getFriends, type FriendEntry } from '../api/friends';
import ConversationRow from '../components/ConversationRow';
import UserAvatar from '../components/ui/UserAvatar';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/StateViews';
import { theme } from '../core/theme';
import type { User } from '../types/auth';
import type { Conversation, Message } from '../types/chat';

type Props = {
  user: User;
};

export default function ChatScreen({ user }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<FriendEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');

  const [reload, setReload] = useState(0);
  const [messagesReload, setMessagesReload] = useState(0);
  const { width } = useWindowDimensions();

  // Khi mở màn hình: lấy các cuộc trò chuyện và danh bạ.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      setSelectedId(null);
      setMessages([]);

      try {
        const [chats, users] = await Promise.all([
          getConversations(),
          getFriends(),
        ]);

        if (active) {
          setConversations(chats);
          setPeople(users);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không tải được cuộc trò chuyện.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [user.id, reload]);

  // Khi chọn một cuộc trò chuyện: lấy tin nhắn của cuộc đó.
  useEffect(() => {
    if (selectedId === null) return;

    const conversationId = selectedId;
    let active = true;

    async function load() {
      setMessagesLoading(true);
      setMessagesError('');

      try {
        const data = await getMessages(conversationId);

        if (active) setMessages(data);
      } catch (err) {
        if (active) {
          setMessagesError(
            err instanceof Error
              ? err.message
              : 'Không tải được tin nhắn.',
          );
        }
      } finally {
        if (active) setMessagesLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [selectedId, user.id, messagesReload]);

  function selectConversation(id: string) {
    if (id === selectedId) return;

    setMessages([]);
    setMessagesError('');
    setMessagesLoading(true);
    setSelectedId(id);
  }

  function otherPerson(conversation: Conversation) {
    const id =
      conversation.participantIds.find((value) => value !== user.id) ?? '';

    return {
      id,
      name: people.find((person) => person.id === id)?.name ?? 'Thành viên',
    };
  }

  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  const person = selected ? otherPerson(selected) : null;
  const compact = width < 760;

  if (loading) {
    return <LoadingState message="Đang tải cuộc trò chuyện…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setReload((value) => value + 1)}
      />
    );
  }

  return (
    <View style={[styles.layout, compact && styles.compact]}>
      <View style={[styles.sidebar, compact && styles.compactSidebar]}>
        <Text style={styles.title}>Tin nhắn</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
        >
          {conversations.length === 0 ? (
            <EmptyState message="Bạn chưa có cuộc trò chuyện nào." />
          ) : (
            conversations.map((conversation) => {
              const partner = otherPerson(conversation);
              const isSelected = conversation.id === selectedId;

              const lastMessage =
                isSelected && !messagesLoading && !messagesError
                  ? messages[messages.length - 1]?.content ??
                    'Chưa có tin nhắn'
                  : 'Mở cuộc trò chuyện';

              return (
                <ConversationRow
                  key={conversation.id}
                  userId={partner.id}
                  name={partner.name}
                  lastMessage={lastMessage}
                  selected={isSelected}
                  onPress={() => selectConversation(conversation.id)}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      <View style={styles.main}>
        {!person ? (
          <View style={styles.center}>
            <EmptyState message="Chọn một cuộc trò chuyện để xem tin nhắn." />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <UserAvatar
                userId={person.id}
                name={person.name}
                size={40}
              />

              <Text numberOfLines={1} style={styles.name}>
                {person.name}
              </Text>
            </View>

            <ScrollView
              key={selectedId}
              style={styles.scroll}
              contentContainerStyle={styles.messages}
            >
              {messagesLoading ? (
                <LoadingState message="Đang tải tin nhắn…" />
              ) : messagesError ? (
                <ErrorState
                  message={messagesError}
                  onRetry={() => setMessagesReload((value) => value + 1)}
                />
              ) : messages.length === 0 ? (
                <EmptyState message="Cuộc trò chuyện chưa có tin nhắn." />
              ) : (
                messages.map((message) => {
                  const own = message.senderId === user.id;

                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.bubble,
                        own ? styles.ownBubble : styles.otherBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          own && styles.ownText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
  },
  compact: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  compactSidebar: {
    width: '100%',
    height: 220,
    borderRightWidth: 0,
    borderBottomWidth: 1,
  },
  title: {
    padding: 20,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    padding: 8,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  messages: {
    padding: 20,
    gap: 12,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  ownText: {
    color: theme.colors.onPrimary,
  },
});