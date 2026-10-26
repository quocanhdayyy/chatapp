const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

// Chỉ dùng storage trong RAM, không chạm dữ liệu của trình duyệt.
const root = path.dirname(require.resolve('../package.json'));
const readKey = 'chatapp-chat-read-cursors';
const messageKey = 'chatapp-chat-messages';
const values = new Map();
let modules = new Map();
let readWrites = 0;
let blockedRead = false;
let blockedWrite = false;
const storage = {
  getItem(key) {
    if (key === readKey && blockedRead) throw new Error('Read blocked');
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    if (key === readKey && blockedWrite) throw new Error('Storage full');
    if (key === readKey) readWrites += 1;
    values.set(key, String(value));
  },
  removeItem: (key) => values.delete(key),
};
class ClockDate extends Date { static now() { return Date.parse('2026-10-26T13:00:00+07:00'); } }
function load(file) {
  const filename = path.resolve(root, file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const wrapper = vm.runInNewContext(`(function(require,module,exports){${output}\n})`, {
    localStorage: storage, crypto: webcrypto, TextEncoder, btoa, atob, Date: ClockDate, Error,
    navigator: { onLine: true }, setTimeout: (callback) => setTimeout(callback, 0), __DEV__: true,
  });
  wrapper((name) => load(path.resolve(path.dirname(filename), `${name}.ts`)), module, module.exports);
  return module.exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function main() {
  let chat = load('src/api/chat.ts');
  let network = load('src/dev/mockTransport.ts');
  const sessions = load('src/storage/session.ts');
  const tokens = load('src/dev/mockTokens.ts');
  const simulate = load('src/dev/chatActivity.ts').simulateIncomingMessage;
  const cursors = load('src/storage/chatRead.ts');
  const { ApiClient, apiClient } = load('src/core/network/apiClient.ts');
  const fixtures = load('src/dev/chatData.ts');
  network.configureMockNetwork({ delayMs: 0 });
  const summary = async (id = 'chat-1') => (await chat.getConversationSummaries()).find((item) => item.conversationId === id);

  await assert.rejects(chat.getConversationSummaries(), (error) => error.status === 401);
  await assert.rejects(chat.markConversationRead('chat-1', 'message-1'), (error) => error.status === 401);
  const primary = tokens.issueSession({ id: '1', name: 'Quốc Anh', email: 'anh@example.com' });
  const peer = tokens.issueSession({ id: '2', name: 'Mai', email: 'mai@example.com' });
  const outsider = tokens.issueSession({ id: '3', name: 'Dũng', email: 'dung@example.com' });
  sessions.saveSession(primary);
  assert.equal((await summary()).unreadCount, 1);
  assert.equal(readWrites, 0, 'Đọc số chưa đọc không tự ghi mốc');
  assert.equal(values.has(messageKey), false, 'Không ghi lại tin mẫu khi lấy summary');
  const own = await chat.sendMessage('chat-1', 'Tin mình gửi không tăng chưa đọc');
  assert.equal((await summary()).unreadCount, 1);
  const copied = await summary();
  copied.lastMessage.content = 'Không được sửa dữ liệu gốc';
  assert.equal((await summary()).lastMessage.content, own.content);
  let events = 0;
  const off = cursors.subscribeChatReadCursors(() => { events += 1; });
  const offThrow = cursors.subscribeChatReadCursors(() => { throw new Error('Broken listener'); });
  const firstRead = await chat.markConversationRead('chat-1', own.id);
  assert.equal(firstRead.unreadCount, 0);
  assert.equal(firstRead.lastReadMessageId, own.id);
  assert.equal(events, 1);
  const beforeIdempotent = readWrites;
  await chat.markConversationRead('chat-1', own.id);
  await chat.markConversationRead('chat-1', 'message-1');
  assert.equal(readWrites, beforeIdempotent, 'Mốc trùng/cũ không ghi lại và không lùi');
  assert.equal((await summary()).lastReadMessageId, own.id);
  assert.equal(events, 1);

  const a = await simulate('chat-1', 'Mai A');
  assert.equal((await summary()).unreadCount, 1);
  const gate = deferred();
  const delayed = new ApiClient(async (request) => {
    if (request.path.endsWith('/read')) await gate.promise;
    return network.mockTransport(request);
  });
  const inFlight = delayed.post('/conversations/chat-1/read', { messageId: a.id });
  const b = await simulate('chat-1', 'Mai B tới trong lúc xác nhận đọc');
  assert.equal(a.createdAt, b.createdAt, 'Hai tin cùng thời gian vẫn được phân biệt bằng ID');
  gate.resolve();
  const readA = await inFlight;
  assert.equal(readA.lastReadMessageId, a.id);
  assert.equal(readA.unreadCount, 1, 'Mốc cũ không nuốt tin B mới đến');
  const ownLater = await chat.sendMessage('chat-1', 'Tin tự gửi sau B');
  assert.equal((await summary()).unreadCount, 1, 'Gửi tin không tự đánh dấu đã đọc');
  await chat.markConversationRead('chat-1', ownLater.id);
  assert.equal((await summary()).unreadCount, 0);
  console.log('PASS: tin tự gửi không tăng số; mốc theo ID, không lùi/trùng và không nuốt tin mới cùng thời gian khi API đang chạy.');

  sessions.saveSession(peer);
  assert.ok((await summary()).unreadCount > 0, 'Mai có mốc riêng, không dùng mốc Quốc Anh');
  await apiClient.post('/conversations/chat-1/read', { messageId: 'message-1', userId: '1' });
  const saved = cursors.loadChatReadCursors();
  assert.equal(saved.find((item) => item.userId === '1').messageId, ownLater.id);
  assert.equal(saved.find((item) => item.userId === '2').messageId, 'message-1');
  sessions.saveSession(outsider);
  assert.equal((await chat.getConversationSummaries()).length, 0);
  const beforeForbidden = values.get(readKey);
  await assert.rejects(chat.markConversationRead('chat-1', b.id), (error) => error.status === 404);
  assert.equal(values.get(readKey), beforeForbidden);
  sessions.saveSession(primary);

  const special = 'riêng / ? #';
  fixtures.initialConversations.push({ id: special, participantIds: ['1', '3'] });
  const separate = await simulate(special, 'Tin ở cuộc trò chuyện khác');
  assert.equal((await summary(special)).unreadCount, 1);
  await assert.rejects(chat.markConversationRead('chat-1', separate.id), (error) => error.status === 404);
  await chat.markConversationRead(special, separate.id);
  assert.equal((await summary(special)).unreadCount, 0);
  const beforeInvalid = values.get(readKey);
  for (const body of [null, [], {}, { messageId: 42 }, { messageId: '' }, { messageId: '   ' }]) {
    await assert.rejects(apiClient.post('/conversations/chat-1/read', body), (error) => error.status === 400);
  }
  await assert.rejects(chat.markConversationRead('chat-1', 'missing'), (error) => error.status === 404);
  await assert.rejects(chat.markConversationRead('missing', ownLater.id), (error) => error.status === 404);
  await assert.rejects(apiClient.get('/conversations/chat-1/read'), (error) => error.status === 405);
  await assert.rejects(apiClient.post('/conversations/summary', {}), (error) => error.status === 405);
  assert.equal(values.get(readKey), beforeInvalid);
  console.log('PASS: mốc riêng cho từng người/cuộc trò chuyện, chống đổi userId, truy cập ngoài cuộc chat và xác nhận tin thuộc cuộc khác.');

  const newest = await simulate('chat-1', 'Tin chưa đọc để thử lỗi');
  const beforeFailure = values.get(readKey);
  const beforeErrorEvents = events;
  blockedWrite = true;
  try {
    await assert.rejects(chat.markConversationRead('chat-1', newest.id), (error) => error.code === 'STORAGE_WRITE');
    assert.equal(values.get(readKey), beforeFailure);
    assert.equal(events, beforeErrorEvents);
    assert.equal((await summary()).unreadCount, 1);
  } finally { blockedWrite = false; }
  blockedRead = true;
  try {
    await assert.rejects(chat.getConversationSummaries(), (error) => error.code === 'STORAGE_READ');
    await assert.rejects(chat.markConversationRead('chat-1', newest.id), (error) => error.code === 'STORAGE_READ');
  } finally { blockedRead = false; }
  for (const raw of ['{broken', '{}', '[null]', '[{"userId":"1"}]', JSON.stringify([saved[0], saved[0]])]) {
    values.set(readKey, raw);
    await assert.rejects(chat.getConversationSummaries(), (error) => error.code === 'STORAGE_READ');
    await assert.rejects(chat.markConversationRead('chat-1', newest.id), (error) => error.code === 'STORAGE_READ');
    assert.equal(values.get(readKey), raw, 'Giữ nguyên dữ liệu lỗi để không mất mốc cũ');
  }
  values.set(readKey, beforeFailure);
  network.configureMockNetwork({ online: false });
  await assert.rejects(chat.markConversationRead('chat-1', newest.id), (error) => error.status === 0);
  network.configureMockNetwork({ online: true, failNext: 500 });
  await assert.rejects(chat.markConversationRead('chat-1', newest.id), (error) => error.status === 500);
  assert.equal(values.get(readKey), beforeFailure);
  assert.equal((await summary()).unreadCount, 1);
  await chat.markConversationRead('chat-1', newest.id);
  assert.equal((await summary()).unreadCount, 0);
  off(); offThrow();

  modules = new Map();
  chat = load('src/api/chat.ts');
  network = load('src/dev/mockTransport.ts');
  network.configureMockNetwork({ delayMs: 0 });
  assert.equal((await summary()).unreadCount, 0, 'Tải lại vẫn nhớ mốc đã đọc');
  assert.equal((await summary()).lastReadMessageId, newest.id);
  console.log('PASS: lỗi lưu/đọc/mạng/500 giữ số chưa đọc; dữ liệu hỏng không bị ghi đè; tải lại giữ mốc đã đọc.');

  const requests = [];
  let markFailure = false;
  const inbox = load('src/core/chatInbox.ts').createChatInbox({
    load: () => { const item = deferred(); requests.push(item); return item.promise; },
    mark: async () => { if (markFailure) throw new Error('Cannot save read cursor'); },
  });
  const counted = (count) => [{ conversationId: 'chat-1', unreadCount: count, lastReadMessageId: null, lastMessage: null }];
  let updates = 0;
  const unsubscribe = inbox.subscribe(() => { updates += 1; });
  const stop = inbox.start();
  const newerRequest = inbox.refresh();
  requests[1].resolve(counted(0));
  await newerRequest;
  requests[0].resolve(counted(9));
  await new Promise(setImmediate);
  assert.equal(inbox.getSnapshot().summaries[0].unreadCount, 0, 'Kết quả API cũ không tăng badge trở lại');
  const failing = inbox.refresh();
  requests.at(-1).reject(new Error('Offline'));
  await failing;
  assert.equal(inbox.getSnapshot().error, 'Offline');
  assert.equal(inbox.getSnapshot().summaries[0].unreadCount, 0);
  markFailure = true;
  await assert.rejects(inbox.markRead('chat-1', 'id'), /Cannot save/);
  markFailure = false;
  const mark = inbox.markRead('chat-1', 'id');
  await new Promise(setImmediate);
  requests.at(-1).resolve(counted(1));
  await mark;
  assert.equal(inbox.getSnapshot().summaries[0].unreadCount, 1);
  assert.equal(inbox.getSnapshot().error, '');
  const lateRequest = inbox.refresh();
  const beforeStop = updates;
  stop();
  requests.at(-1).resolve(counted(99));
  await lateRequest;
  assert.equal(updates, beforeStop, 'Provider rời/đổi tài khoản không nhận kết quả cũ');
  unsubscribe();
  const stopAgain = inbox.start();
  requests.at(-1).resolve(counted(2));
  await new Promise(setImmediate);
  assert.equal(inbox.getSnapshot().summaries[0].unreadCount, 2);
  stopAgain();
  console.log('PASS: nguồn badge chung bỏ kết quả cũ, giữ dữ liệu khi lỗi, tải lại sau xác nhận đọc và hủy cập nhật khi dừng.');
}

const timeout = setTimeout(() => { console.error('FAIL: kiểm tra còn Promise chưa hoàn tất.'); process.exitCode = 1; }, 10000);
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
