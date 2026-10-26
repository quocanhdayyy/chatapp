const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

// Chỉ dùng dữ liệu trong RAM; không đọc hoặc sửa dữ liệu Safari của người dùng.
const root = path.dirname(require.resolve('../package.json'));
const messageKey = 'chatapp-chat-messages';
const values = new Map();
let modules = new Map();
let clock = Date.parse('2026-10-26T10:00:00+07:00');
let messageWrites = 0;
let failMessageRead = false;
let failMessageWrite = false;
const storage = {
  getItem(key) {
    if (key === messageKey && failMessageRead) throw new Error('Storage blocked');
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    if (key === messageKey && failMessageWrite) throw new Error('Storage full');
    if (key === messageKey) messageWrites += 1;
    values.set(key, String(value));
  },
  removeItem: (key) => values.delete(key),
};
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
    localStorage: storage, crypto: webcrypto, TextEncoder, btoa, atob, Date: ClockDate, Error,
    navigator: { onLine: true }, setTimeout: (callback) => setTimeout(callback, 0),
  });
  wrapper((name) => load(path.resolve(path.dirname(filename), `${name}.ts`)), module, module.exports);
  return module.exports;
}

async function main() {
  let chat = load('src/api/chat.ts');
  let sessions = load('src/storage/session.ts');
  let network = load('src/dev/mockTransport.ts');
  const { issueSession, ACCESS_TOKEN_TTL } = load('src/dev/mockTokens.ts');
  const { MAX_MESSAGE_LENGTH } = load('src/core/chat.ts');
  network.configureMockNetwork({ delayMs: 0 });

  await assert.rejects(chat.getConversations(), (error) => error.status === 401);
  await assert.rejects(chat.getMessages('chat-1'), (error) => error.status === 401);
  await assert.rejects(chat.sendMessage('chat-1', 'Chưa đăng nhập'), (error) => error.status === 401);
  assert.equal(values.has(messageKey), false);

  const primary = issueSession({ id: '1', name: 'Quốc Anh', email: 'anh@example.com' });
  sessions.saveSession(primary);
  let conversations = await chat.getConversations();
  assert.equal(conversations.length, 1);
  assert.equal(conversations[0].id, 'chat-1');
  const seed = await chat.getMessages('chat-1');
  assert.equal(seed.length, 2);
  assert.equal(messageWrites, 0, 'Đọc tin mẫu không tự ghi storage');
  conversations[0].participantIds[0] = 'changed';
  seed[0].content = 'Changed response';
  assert.equal((await chat.getConversations())[0].participantIds[0], '1');
  assert.equal((await chat.getMessages('chat-1'))[0].content, 'Chào Anh!');

  const beforeSend = messageWrites;
  const sent = await chat.sendMessage('chat-1', '  Xin chào\nMai  ');
  assert.equal(sent.content, 'Xin chào\nMai');
  assert.equal(sent.senderId, '1');
  assert.equal(sent.conversationId, 'chat-1');
  assert.equal(sent.createdAt, clock);
  assert.ok(sent.id && sent.id !== 'message-1' && sent.id !== 'message-2');
  assert.equal(messageWrites, beforeSend + 1);
  assert.equal(JSON.parse(values.get(messageKey)).length, 3, 'Giữ hai tin mẫu khi lưu tin đầu tiên');
  sent.content = 'Changed after send';
  assert.equal((await chat.getMessages('chat-1')).find((message) => message.id === sent.id).content, 'Xin chào\nMai');

  modules = new Map();
  chat = load('src/api/chat.ts');
  sessions = load('src/storage/session.ts');
  network = load('src/dev/mockTransport.ts');
  network.configureMockNetwork({ delayMs: 0 });
  assert.equal((await chat.getMessages('chat-1')).length, 3, 'Tải lại module vẫn đọc được tin đã lưu');
  console.log('PASS: API chat, phiên đăng nhập, tin mẫu, gửi/lưu đúng người, xuống dòng, bản sao và tải lại.');

  let client = load('src/core/network/apiClient.ts').apiClient;
  const forged = await client.post('/conversations/chat-1/messages', { content: 'Kiểm tra người gửi', senderId: '2' });
  assert.equal(forged.senderId, '1', 'Người gửi lấy từ token, không lấy từ body');
  sessions.saveSession(issueSession({ id: '2', name: 'Mai', email: 'mai@example.com' }));
  const fromMai = await chat.sendMessage('chat-1', 'Mai trả lời');
  assert.equal(fromMai.senderId, '2');
  assert.equal((await chat.getMessages('chat-1')).length, 5);

  sessions.saveSession(issueSession({ id: '3', name: 'Dũng', email: 'dung@example.com' }));
  const beforeForbidden = values.get(messageKey);
  assert.equal((await chat.getConversations()).length, 0);
  await assert.rejects(chat.getMessages('chat-1'), (error) => error.status === 404);
  await assert.rejects(chat.sendMessage('chat-1', 'Không được gửi'), (error) => error.status === 404);
  assert.equal(values.get(messageKey), beforeForbidden);
  sessions.saveSession(primary);

  const beforeInvalid = values.get(messageKey);
  for (const body of [null, [], true, 42, 'text', {}, { content: 1 }, { content: '' }, { content: '   \n ' }, { content: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) }]) {
    await assert.rejects(client.post('/conversations/chat-1/messages', body), (error) => error.status === 400 && error.code === 'VALIDATION');
  }
  await assert.rejects(chat.sendMessage('missing', 'Không tồn tại'), (error) => error.status === 404);
  await assert.rejects(chat.getMessages('missing'), (error) => error.status === 404);
  await assert.rejects(client.post('/conversations', {}), (error) => error.status === 405);
  await assert.rejects(client.patch('/conversations/chat-1/messages', {}), (error) => error.status === 405);
  await assert.rejects(client.get('/conversations/invalid'), (error) => error.status === 404);
  assert.equal(values.get(messageKey), beforeInvalid);
  const atLimit = await chat.sendMessage('chat-1', 'x'.repeat(MAX_MESSAGE_LENGTH));
  assert.equal(atLimit.content.length, MAX_MESSAGE_LENGTH);
  console.log('PASS: quyền hai người tham gia, chống giả người gửi, nội dung rỗng/sai kiểu/quá dài và phương thức/đường dẫn.');

  const beforeFailure = values.get(messageKey);
  failMessageWrite = true;
  try {
    await assert.rejects(chat.sendMessage('chat-1', 'Gửi lại sau lỗi lưu'), (error) => error.code === 'STORAGE_WRITE');
    assert.equal(values.get(messageKey), beforeFailure);
  } finally { failMessageWrite = false; }
  const retried = await chat.sendMessage('chat-1', 'Gửi lại sau lỗi lưu');
  assert.equal((await chat.getMessages('chat-1')).filter((message) => message.content === retried.content).length, 1);

  const beforeNetworkFailure = values.get(messageKey);
  network.configureMockNetwork({ online: false });
  await assert.rejects(chat.sendMessage('chat-1', 'Mất mạng'), (error) => error.status === 0);
  network.configureMockNetwork({ online: true, failNext: 500 });
  await assert.rejects(chat.sendMessage('chat-1', 'Lỗi máy chủ giả'), (error) => error.status === 500);
  assert.equal(values.get(messageKey), beforeNetworkFailure);
  assert.equal(sessions.loadSession().user.id, '1');

  const beforeConcurrent = (await chat.getMessages('chat-1')).length;
  const concurrent = await Promise.all([
    chat.sendMessage('chat-1', 'Tin gửi đồng thời A'),
    chat.sendMessage('chat-1', 'Tin gửi đồng thời B'),
  ]);
  assert.notEqual(concurrent[0].id, concurrent[1].id);
  const afterConcurrent = await chat.getMessages('chat-1');
  assert.equal(afterConcurrent.length, beforeConcurrent + 2);
  assert.ok(concurrent.every((message) => afterConcurrent.some((saved) => saved.id === message.id)));
  console.log('PASS: lỗi lưu/mất mạng/500 giữ nguyên dữ liệu; gửi lại không tạo tin lỗi ảo; hai yêu cầu không làm mất tin.');

  const storageApi = load('src/storage/chat.ts');
  const savedMessages = values.get(messageKey);
  const validMessage = { id: 'valid', conversationId: 'chat-1', senderId: '1', content: 'Dữ liệu thử', createdAt: clock };
  for (const corrupt of [
    '{broken', '{}', JSON.stringify([null]), JSON.stringify([{ ...validMessage, createdAt: null }]),
    JSON.stringify([{ ...validMessage, id: '' }]), JSON.stringify([{ ...validMessage, senderId: ' ' }]),
    JSON.stringify([{ ...validMessage, conversationId: '' }]), JSON.stringify([validMessage, validMessage]),
  ]) {
    values.set(messageKey, corrupt);
    await assert.rejects(chat.getMessages('chat-1'), (error) => error.code === 'STORAGE_READ');
    await assert.rejects(chat.sendMessage('chat-1', 'Không ghi đè dữ liệu hỏng'), (error) => error.code === 'STORAGE_READ');
    assert.equal(values.get(messageKey), corrupt);
  }
  values.set(messageKey, savedMessages);
  failMessageRead = true;
  try {
    await assert.rejects(chat.getMessages('chat-1'), (error) => error.code === 'STORAGE_READ');
    await assert.rejects(chat.sendMessage('chat-1', 'Storage bị chặn'), (error) => error.code === 'STORAGE_READ');
    assert.equal(values.get(messageKey), savedMessages);
  } finally { failMessageRead = false; }
  storageApi.saveChatMessages([]);
  assert.equal((await chat.getMessages('chat-1')).length, 0, 'Mảng rỗng đã lưu không bị thay bằng tin mẫu');
  values.set(messageKey, savedMessages);
  console.log('PASS: dữ liệu hỏng/trùng ID/storage bị chặn được báo lỗi và giữ nguyên; danh sách rỗng không bị khởi tạo lại.');

  const { ApiClient } = load('src/core/network/apiClient.ts');
  let refreshes = 0;
  let sendAttempts = 0;
  client = new ApiClient(async (request) => {
    if (request.path === '/auth/refresh') refreshes += 1;
    if (request.path === '/conversations/chat-1/messages' && request.method === 'POST') sendAttempts += 1;
    return network.mockTransport(request);
  });
  clock += ACCESS_TOKEN_TTL + 1;
  const beforeRefreshWrite = messageWrites;
  await client.post('/conversations/chat-1/messages', { content: 'Gửi sau khi token hết hạn' });
  assert.equal(refreshes, 1);
  assert.equal(sendAttempts, 2);
  assert.equal(messageWrites, beforeRefreshWrite + 1, 'Retry 401 chỉ lưu một tin');

  const current = await chat.getMessages('chat-1');
  const merge = load('src/utils/chatMessages.ts').mergeChatMessages;
  const stale = current.slice(0, -1);
  const wrongThread = { ...validMessage, id: 'wrong-thread', conversationId: 'other-chat' };
  const beforeMerge = JSON.stringify(current);
  const merged = merge([...current, wrongThread], stale, 'chat-1');
  assert.equal(merged.length, current.length, 'Lịch sử cũ trả về muộn không xóa tin vừa gửi');
  assert.equal(new Set(merged.map((message) => message.id)).size, merged.length);
  assert.ok(merged.every((message) => message.conversationId === 'chat-1'));
  assert.ok(merged.every((message, index) => index === 0 || merged[index - 1].createdAt <= message.createdAt));
  assert.equal(JSON.stringify(current), beforeMerge);

  const specialId = 'trò chuyện / dấu ? #';
  load('src/dev/chatData.ts').initialConversations.push({ id: specialId, participantIds: ['1', '2'] });
  const special = await chat.sendMessage(specialId, 'Đúng mã cuộc trò chuyện');
  assert.equal(special.conversationId, specialId);
  assert.equal((await chat.getMessages(specialId)).length, 1);
  assert.ok((await chat.getMessages('chat-1')).every((message) => message.id !== special.id));
  console.log('PASS: refresh token không gửi trùng; gộp lịch sử không mất tin/trộn cuộc trò chuyện; mã chứa ký tự đặc biệt.');

  modules = new Map();
  chat = load('src/api/chat.ts');
  load('src/dev/mockTransport.ts').configureMockNetwork({ delayMs: 0 });
  const restored = await chat.getMessages('chat-1');
  assert.equal(restored.length, current.length);
  assert.ok(restored.some((message) => message.content === 'Gửi sau khi token hết hạn'));
  console.log('PASS: tải lại cuối luồng giữ đầy đủ tin nhắn đã gửi.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
