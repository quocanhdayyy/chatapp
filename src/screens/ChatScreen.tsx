import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { getConversations, getMessages, sendMessage } from '../api/chat';
import { getFriends, type FriendEntry } from '../api/friends';
import ConversationRow from '../components/ConversationRow';
import ChatComposer from '../components/ChatComposer';
import AppButton from '../components/ui/AppButton';
import UserAvatar from '../components/ui/UserAvatar';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/StateViews';
import { theme } from '../core/theme';
import { chatTransport } from '../core/chatTransport';
import { simulateIncomingMessage } from '../dev/chatActivity';
import type { User } from '../types/auth';
import type { Conversation, Message } from '../types/chat';
import { mergeChatMessages } from '../utils/chatMessages';

type Props = {
  user: User;
};

export default function ChatScreen({ user }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<FriendEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendErrors, setSendErrors] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [receiveError, setReceiveError] = useState('');
  const [receiveReload, setReceiveReload] = useState(0);
  const [demoError, setDemoError] = useState('');
  const [simulating, setSimulating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');

  const [reload, setReload] = useState(0);
  const [messagesReload, setMessagesReload] = useState(0);
  const { width } = useWindowDimensions();
  const mounted = useRef(false);
  const selectedConversation = useRef<string | null>(null);
  const sendInFlight = useRef(false);
  const simulationInFlight = useRef(false);
  const messageScroll = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Tin nhận được đi qua adapter, không được thêm trực tiếp từ nút thử.
  useFocusEffect(useCallback(() => {
    // Quay lại route thì đọc bù lịch sử, vì lúc rời route đã hủy listener.
    setMessagesReload((value) => value + 1);
    return chatTransport.subscribe(user.id, (message) => {
      if (!mounted.current) return;
      setReceiveError('');
      setThreads((current) => ({
        ...current,
        [message.conversationId]: mergeChatMessages(current[message.conversationId] ?? [], [message], message.conversationId),
      }));
    }, (err) => {
      if (mounted.current) setReceiveError(err.message);
    });
    // receiveReload chủ động khởi động lại listener khi bấm Thử lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, receiveReload]));

  // Khi mở màn hình: lấy các cuộc trò chuyện và danh bạ.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      selectedConversation.current = null;
      setSelectedId(null);
      setThreads({});

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

        if (active && selectedConversation.current === conversationId) {
          setThreads((current) => ({
            ...current,
            [conversationId]: mergeChatMessages(current[conversationId] ?? [], data, conversationId),
          }));
        }
      } catch (err) {
        if (active && selectedConversation.current === conversationId) {
          setMessagesError(
            err instanceof Error
              ? err.message
              : 'Không tải được tin nhắn.',
          );
        }
      } finally {
        if (active && selectedConversation.current === conversationId) setMessagesLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [selectedId, user.id, messagesReload]);

  function selectConversation(id: string) {
    if (id === selectedId) return;

    selectedConversation.current = id;
    setMessagesError('');
    setMessagesLoading(true);
    setSelectedId(id);
  }

  function changeDraft(value: string) {
    const conversationId = selectedId;
    if (!conversationId) return;
    setDrafts((current) => ({ ...current, [conversationId]: value }));
    setSendErrors((current) => ({ ...current, [conversationId]: '' }));
  }

  async function handleSend() {
    const conversationId = selectedId;
    if (!conversationId || selectedConversation.current !== conversationId ||
        sendInFlight.current || messagesLoading || messagesError) return;

    const draft = drafts[conversationId] ?? '';
    const content = draft.trim();
    if (!content) return;

    // Khóa ngay khi bấm, trước khi React kịp cập nhật nút Gửi.
    sendInFlight.current = true;
    setSendingId(conversationId);
    setSendErrors((current) => ({ ...current, [conversationId]: '' }));

    try {
      const message = await sendMessage(conversationId, content);
      if (!mounted.current) return;

      // Lưu kết quả theo đúng cuộc trò chuyện, kể cả khi đã chọn người khác.
      setThreads((current) => ({
        ...current,
        [conversationId]: mergeChatMessages(current[conversationId] ?? [], [message], conversationId),
      }));
      setDrafts((current) => current[conversationId] === draft
        ? { ...current, [conversationId]: '' }
        : current);
    } catch (err) {
      if (mounted.current) {
        setSendErrors((current) => ({
          ...current,
          [conversationId]: err instanceof Error ? err.message : 'Không gửi được tin nhắn. Hãy thử lại.',
        }));
      }
    } finally {
      sendInFlight.current = false;
      if (mounted.current) setSendingId(null);
    }
  }

  async function handleSimulate() {
    const conversationId = selectedId ?? conversations[0]?.id;
    if (!conversationId || simulationInFlight.current) return;
    simulationInFlight.current = true;
    setSimulating(true);
    setDemoError('');

    try {
      // Chỉ tạo dữ liệu; adapter nhận sự kiện rồi tự cập nhật giao diện.
      await simulateIncomingMessage(conversationId);
    } catch (err) {
      if (mounted.current) setDemoError(err instanceof Error ? err.message : 'Không tạo được tin nhắn thử.');
    } finally {
      simulationInFlight.current = false;
      if (mounted.current) setSimulating(false);
    }
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
  const demoConversation = selected ?? conversations[0];
  const demoPerson = demoConversation ? otherPerson(demoConversation) : null;
  const messages = selectedId ? threads[selectedId] ?? [] : [];
  const draft = selectedId ? drafts[selectedId] ?? '' : '';
  const sendError = selectedId ? sendErrors[selectedId] ?? '' : '';
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

              const history = threads[conversation.id];
              const last = history?.[history.length - 1];
              const lastMessage = last
                ? `${last.senderId === user.id ? 'Bạn: ' : ''}${last.content}`
                : history ? 'Chưa có tin nhắn' : 'Mở cuộc trò chuyện';

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

        {__DEV__ && demoPerson && (
          <View style={styles.demoTools}>
            <AppButton
              label={`${demoPerson.name} gửi tin thử`}
              icon="comment"
              variant="secondary"
              loading={simulating}
              onPress={() => { void handleSimulate(); }}
            />
            {!!demoError && <Text style={styles.demoError} accessibilityRole="alert">{demoError}</Text>}
          </View>
        )}
      </View>

      <View style={styles.main}>
        {!!receiveError && (
          <ErrorState message={receiveError} onRetry={() => {
            setReceiveError('');
            setReceiveReload((value) => value + 1);
          }} />
        )}
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
              ref={messageScroll}
              onContentSizeChange={() => messageScroll.current?.scrollToEnd({ animated: false })}
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

            <ChatComposer
              key={selectedId}
              value={draft}
              onChange={changeDraft}
              onSend={() => { void handleSend(); }}
              disabled={messagesLoading || !!messagesError || sendingId !== null}
              sending={sendingId !== null && sendingId === selectedId}
              error={sendError}
            />
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
  demoTools: { flexShrink: 0, padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  demoError: { fontSize: 12, lineHeight: 18, color: theme.colors.error },
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
