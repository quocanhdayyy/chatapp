const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

// Toàn bộ storage và sự kiện trình duyệt dưới đây nằm trong RAM.
const root = path.dirname(require.resolve('../package.json'));
const messageKey = 'chatapp-chat-messages';
const values = new Map();
const modules = new Map();
let development = true;
let failRead = false;
let failWrite = false;
let writes = 0;
let clock = Date.parse('2026-10-26T11:00:00+07:00');
const storage = {
  getItem(key) {
    if (key === messageKey && failRead) throw new Error('Read blocked');
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    if (key === messageKey && failWrite) throw new Error('Storage full');
    if (key === messageKey) writes += 1;
    values.set(key, String(value));
  },
  removeItem: (key) => values.delete(key),
};

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type, event = {}) { for (const listener of [...(listeners.get(type) ?? [])]) listener(event); },
    count() { return [...listeners.values()].reduce((total, set) => total + set.size, 0); },
  };
}
const browser = { ...eventTarget(), localStorage: storage };
const document = { ...eventTarget(), visibilityState: 'visible' };
class ClockDate extends Date { static now() { return clock; } }

function load(file) {
  const filename = path.resolve(root, file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const wrapper = vm.runInNewContext(`(function(require,module,exports){${output}\n})`, {
    localStorage: storage, window: browser, document,
    crypto: webcrypto, TextEncoder, btoa, atob, Date: ClockDate, Error,
    navigator: { onLine: true }, setTimeout: (callback) => setTimeout(callback, 0),
    get __DEV__() { return development; },
  });
  wrapper((name) => load(path.resolve(path.dirname(filename), `${name}.ts`)), module, module.exports);
  return module.exports;
}

async function main() {
  const activity = load('src/dev/chatActivity.ts');
  const chat = load('src/api/chat.ts');
  const { apiClient } = load('src/core/network/apiClient.ts');
  const sessions = load('src/storage/session.ts');
  const tokens = load('src/dev/mockTokens.ts');
  const network = load('src/dev/mockTransport.ts');
  const store = load('src/storage/chat.ts');
  const transport = load('src/core/chatTransport.ts').chatTransport;
  network.configureMockNetwork({ delayMs: 0 });
  await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.status === 401);
  assert.equal(writes, 0);

  const primary = tokens.issueSession({ id: '1', name: 'Quốc Anh', email: 'anh@example.com' });
  sessions.saveSession(primary);
  const received = [];
  const peer = [];
  const outsider = [];
  const errors = [];
  const timing = [];
  let acknowledged = false;
  const stop = transport.subscribe('1', (message) => { received.push(message); timing.push(acknowledged); }, (error) => errors.push(error));
  const stopPeer = transport.subscribe('2', (message) => peer.push(message));
  const stopOutsider = transport.subscribe('3', (message) => outsider.push(message));
  let throwingCalls = 0;
  const stopThrowing = transport.subscribe('1', () => { throwingCalls += 1; throw new Error('UI listener failed'); });
  assert.equal(received.length, 0, 'Đăng ký nhận không phát lại hai tin mẫu');

  const beforeSession = JSON.stringify(sessions.loadSession());
  const incoming = await activity.simulateIncomingMessage('chat-1', '  Mai vừa nhắn tới  ');
  acknowledged = true;
  assert.equal(incoming.senderId, '2');
  assert.equal(incoming.content, 'Mai vừa nhắn tới');
  assert.equal(received.length, 1);
  assert.equal(received[0].id, incoming.id);
  assert.equal(peer.length, 1);
  assert.equal(outsider.length, 0);
  assert.equal(timing[0], false, 'Tin nhận qua sự kiện lưu trước khi lời gọi mô phỏng trả kết quả');
  assert.equal(JSON.stringify(sessions.loadSession()), beforeSession, 'Mô phỏng không đổi phiên sang tài khoản Mai');
  assert.equal(throwingCalls, 1, 'Listener hỏng không làm POST lưu thành công bị báo lỗi');
  received[0].content = 'Changed listener response';
  assert.equal(peer[0].content, 'Mai vừa nhắn tới');
  assert.equal((await chat.getMessages('chat-1')).find((message) => message.id === incoming.id).content, 'Mai vừa nhắn tới');
  store.saveChatMessages(store.loadChatMessages());
  assert.equal(received.length, 1, 'Ghi lại cùng ID không phát trùng');

  const normal = await chat.sendMessage('chat-1', 'Tin do mình gửi');
  assert.equal(normal.senderId, '1');
  assert.equal(received.at(-1).id, normal.id);
  const merge = load('src/utils/chatMessages.ts').mergeChatMessages;
  const displayed = merge(received, [normal], 'chat-1');
  assert.equal(displayed.filter((message) => message.id === normal.id).length, 1, 'Sự kiện và phản hồi POST chỉ hiện một bong bóng');
  assert.equal((await chat.getMessages('chat-1')).filter((message) => message.senderId === '2').length, 2, 'Gửi thường không tự sinh phản hồi từ Mai');
  console.log('PASS: nhận cùng tab qua adapter, không phát lại/trùng, bản sao riêng, lỗi listener và không đổi phiên đăng nhập.');

  load('src/dev/chatData.ts').initialConversations.push({ id: 'private-chat', participantIds: ['2', '3'] });
  const external = { id: 'external-1', conversationId: 'chat-1', senderId: '2', content: 'Tin từ tab khác', createdAt: ++clock };
  const privateMessage = { id: 'private-1', conversationId: 'private-chat', senderId: '3', content: 'Riêng tư', createdAt: ++clock };
  values.set(messageKey, JSON.stringify([...store.loadChatMessages(), external, privateMessage]));
  const beforeExternal = received.length;
  browser.emit('storage', { key: messageKey, storageArea: storage });
  assert.equal(received.length, beforeExternal + 1);
  assert.equal(received.at(-1).id, external.id);
  assert.equal(received.some((message) => message.id === privateMessage.id), false);
  assert.ok(peer.some((message) => message.id === privateMessage.id));
  assert.equal(outsider.length, 1);
  assert.equal(outsider[0].id, privateMessage.id);
  browser.emit('storage', { key: messageKey, storageArea: storage });
  assert.equal(received.length, beforeExternal + 1);

  const missed = { ...external, id: 'missed-on-focus', content: 'Bắt kịp khi quay lại', createdAt: ++clock };
  values.set(messageKey, JSON.stringify([...store.loadChatMessages(), missed]));
  browser.emit('storage', { key: 'other-key', storageArea: storage });
  browser.emit('storage', { key: messageKey, storageArea: {} });
  assert.equal(received.some((message) => message.id === missed.id), false);
  browser.emit('focus');
  assert.equal(received.at(-1).id, missed.id);

  const afterHidden = { ...external, id: 'after-hidden', content: 'Tin trong lúc ẩn tab', createdAt: ++clock };
  values.set(messageKey, JSON.stringify([...store.loadChatMessages(), afterHidden]));
  document.visibilityState = 'hidden';
  document.emit('visibilitychange');
  assert.equal(received.some((message) => message.id === afterHidden.id), false);
  document.visibilityState = 'visible';
  document.emit('visibilitychange');
  assert.equal(received.at(-1).id, afterHidden.id);
  console.log('PASS: đồng bộ sự kiện từ tab khác, lọc người tham gia, chống phát lặp và bắt kịp khi tab trở lại.');

  const beforeStorageError = values.get(messageKey);
  const beforeErrorEvents = received.length;
  values.set(messageKey, '{broken');
  browser.emit('storage', { key: messageKey, storageArea: storage });
  assert.ok(errors.some((error) => error.code === 'STORAGE_READ'));
  assert.equal(received.length, beforeErrorEvents);
  values.set(messageKey, beforeStorageError);
  browser.emit('storage', { key: messageKey, storageArea: storage });
  assert.equal(received.length, beforeErrorEvents, 'Khôi phục dữ liệu cũ không phát lại tin');

  failWrite = true;
  try {
    await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.code === 'STORAGE_WRITE');
    assert.equal(values.get(messageKey), beforeStorageError);
    assert.equal(received.length, beforeErrorEvents);
  } finally { failWrite = false; }
  failRead = true;
  try {
    await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.code === 'STORAGE_READ');
    assert.equal(received.length, beforeErrorEvents);
  } finally { failRead = false; }

  network.configureMockNetwork({ online: false });
  await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.status === 0);
  network.configureMockNetwork({ online: true, failNext: 500 });
  await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.status === 500);
  assert.equal(received.length, beforeErrorEvents);
  assert.equal(values.get(messageKey), beforeStorageError);
  console.log('PASS: lỗi đọc/ghi/mất mạng/500 không phát tin ảo và không làm mất dữ liệu cũ.');

  sessions.saveSession(tokens.issueSession({ id: '3', name: 'Dũng', email: 'dung@example.com' }));
  await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.status === 404);
  sessions.saveSession(primary);
  for (const content of ['', '   ', 'x'.repeat(2001)]) {
    await assert.rejects(activity.simulateIncomingMessage('chat-1', content), (error) => error.status === 400);
  }
  await assert.rejects(activity.simulateIncomingMessage('missing'), (error) => error.status === 404);
  await assert.rejects(apiClient.get('/dev/chat/chat-1/incoming'), (error) => error.status === 405);
  assert.equal(values.get(messageKey), beforeStorageError);
  const derived = await apiClient.post('/dev/chat/chat-1/incoming', { content: 'Đúng người kia', senderId: '3' });
  assert.equal(derived.senderId, '2');
  const primaryPost = await apiClient.post('/conversations/chat-1/messages', { content: 'Vẫn là mình', senderId: '2' });
  assert.equal(primaryPost.senderId, '1');

  development = false;
  const beforeProduction = values.get(messageKey);
  const beforeProductionEvents = received.length;
  await assert.rejects(activity.simulateIncomingMessage('chat-1'), (error) => error.status === 404);
  await assert.rejects(apiClient.post('/dev/chat/chat-1/incoming', { content: 'Không được chạy ở production' }), (error) => error.status === 404);
  assert.equal(values.get(messageKey), beforeProduction);
  assert.equal(received.length, beforeProductionEvents);
  const productionPost = await chat.sendMessage('chat-1', 'Gửi bình thường vẫn hoạt động');
  assert.equal(productionPost.senderId, '1');
  development = true;
  console.log('PASS: route mô phỏng kiểm tra đăng nhập/quyền/nội dung, không nhận người gửi tùy ý và bị chặn ngoài development.');

  stop(); stopPeer(); stopOutsider(); stopThrowing();
  assert.equal(browser.count(), 0);
  assert.equal(document.count(), 0);
  const beforeStopped = received.length;
  await activity.simulateIncomingMessage('chat-1', 'Sau khi rời màn hình');
  browser.emit('storage', { key: messageKey, storageArea: storage });
  browser.emit('focus');
  assert.equal(received.length, beforeStopped);

  const reconnected = [];
  const off = transport.subscribe('1', (message) => reconnected.push(message));
  assert.equal(reconnected.length, 0, 'Đăng ký lại đọc nền hiện tại, không phát lại lịch sử');
  await activity.simulateIncomingMessage('chat-1', 'Tin mới sau khi đăng ký lại');
  assert.equal(reconnected.length, 1);
  off();
  assert.equal(browser.count(), 0);
  assert.equal(document.count(), 0);
  assert.ok(writes > 0);
  console.log('PASS: hủy đăng ký giải phóng listener; đăng ký lại chỉ nhận tin mới và không tạo vòng lặp tự trả lời.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
