const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

// Kiểm tra logic FE bằng storage trong RAM; không đổi tài khoản/dữ liệu trình duyệt.
const root = path.dirname(require.resolve('../package.json'));
const values = new Map();
let modules = new Map();
let clock = Date.now();
let writes = 0;
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => { writes += 1; values.set(key, String(value)); },
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
  let auth = load('src/api/auth.ts');
  let profile = load('src/api/profile.ts');
  let sessions = load('src/storage/session.ts');
  let network = load('src/dev/mockTransport.ts');
  network.configureMockNetwork({ delayMs: 0 });
  assert.equal(sessions.loadSession(), null);
  await assert.rejects(auth.login('anh@example.com', 'wrong'), (error) => error.status === 401);
  await assert.rejects(profile.getMyProfile(), (error) => error.status === 401);

  const signedIn = await auth.login('anh@example.com', '123456');
  assert.equal(signedIn.user.name, 'Quốc Anh');
  assert.ok(signedIn.accessToken.split('.').length === 3);
  sessions.saveSession(signedIn);
  assert.equal((await profile.getMyProfile()).id, '1');
  await assert.rejects(profile.getProfile('2'), (error) => error.status === 403);
  await assert.rejects(profile.updateProfile('1', { name: ' ', bio: '' }), /không được để trống/);
  const edited = await profile.updateProfile('1', { name: '  Tên đã sửa  ', bio: 'Giới thiệu mới' });
  assert.equal(edited.name, 'Tên đã sửa');
  sessions.updateSessionUser({ id: edited.id, name: edited.name, email: edited.email });
  const profileWithDetails = await profile.updateProfile('1', {
    city: ' Hà Nội ', hometown: 'Hải Phòng', workplace: 'Nhóm frontend', education: 'Trường đại học',
  });
  assert.equal(profileWithDetails.name, edited.name, 'Patch thông tin bổ sung không xóa tên');
  assert.equal(profileWithDetails.bio, 'Giới thiệu mới');
  assert.equal(profileWithDetails.city, 'Hà Nội');
  assert.equal(profileWithDetails.avatarImageId, null);
  await assert.rejects(profile.updateProfile('1', { city: 123 }), (error) => error.status === 400);
  await assert.rejects(profile.updateProfile('1', { bio: 'x'.repeat(501) }), (error) => error.status === 400);
  await assert.rejects(profile.updateProfile('1', { email: 'other@example.com' }), (error) => error.status === 400);
  const beforeUnchanged = writes;
  sessions.updateSessionUser({ id: edited.id, name: edited.name, email: edited.email });
  assert.equal(writes, beforeUnchanged, 'Không ghi lặp phiên có cùng dữ liệu');

  modules = new Map();
  auth = load('src/api/auth.ts');
  profile = load('src/api/profile.ts');
  sessions = load('src/storage/session.ts');
  network = load('src/dev/mockTransport.ts');
  network.configureMockNetwork({ delayMs: 0 });
  assert.equal(sessions.loadSession().user.name, 'Tên đã sửa');
  assert.equal((await profile.getMyProfile()).bio, 'Giới thiệu mới');
  assert.equal((await profile.getMyProfile()).city, 'Hà Nội', 'Giữ thông tin mở rộng sau reload');
  console.log('PASS: đăng nhập, lưu/khôi phục phiên, bảo vệ Auth/User API và cập nhật hồ sơ.');

  const { ApiClient } = load('src/core/network/apiClient.ts');
  const { ACCESS_TOKEN_TTL } = load('src/dev/mockTokens.ts');
  let refreshes = 0;
  let protectedRequests = 0;
  const client = new ApiClient(async (request) => {
    if (request.path === '/auth/refresh') refreshes += 1;
    else if (request.path === '/users/me') {
      protectedRequests += 1;
      assert.ok(request.headers.Authorization.startsWith('Bearer '));
    }
    return network.mockTransport(request);
  });
  const oldRefreshToken = sessions.loadSession().refreshToken;
  clock += ACCESS_TOKEN_TTL + 1;
  const results = await Promise.all(Array.from({ length: 4 }, () => client.get('/users/me')));
  assert.ok(results.every((result) => result.name === 'Tên đã sửa'));
  assert.equal(refreshes, 1, 'Nhiều request chỉ dùng một lần refresh');
  assert.equal(protectedRequests, 8, 'Mỗi request chỉ thử lại một lần');
  assert.notEqual(sessions.loadSession().refreshToken, oldRefreshToken);
  assert.throws(() => load('src/dev/mockTokens.ts').validateRefreshToken(oldRefreshToken), /hết hạn/);

  const validRefresh = sessions.loadSession().refreshToken;
  network.configureMockNetwork({ online: false });
  await assert.rejects(profile.getMyProfile(), (error) => error.status === 0);
  assert.equal(sessions.loadSession().refreshToken, validRefresh);
  network.configureMockNetwork({ online: true, failNext: 500 });
  await assert.rejects(profile.getMyProfile(), (error) => error.status === 500);
  assert.equal(sessions.loadSession().refreshToken, validRefresh);
  assert.equal((await profile.getMyProfile()).id, '1');
  console.log('PASS: gắn token, refresh một lần khi có request đồng thời, giữ phiên khi mất mạng/lỗi 500.');

  clock += 8 * 24 * 60 * 60 * 1000;
  let cleared = false;
  const unsubscribe = sessions.subscribeSession((value) => { if (value === null) cleared = true; });
  await assert.rejects(profile.getMyProfile(), (error) => error.status === 401);
  assert.equal(sessions.loadSession(), null);
  assert.equal(cleared, true);
  unsubscribe();

  sessions.saveSession(await auth.login('anh@example.com', '123456'));
  clock += ACCESS_TOKEN_TTL + 1;
  let release;
  let started;
  const gate = new Promise((resolve) => { release = resolve; });
  const refreshStarted = new Promise((resolve) => { started = resolve; });
  const interrupted = new ApiClient(async (request) => {
    if (request.path === '/auth/refresh') { started(); await gate; }
    return network.mockTransport(request);
  });
  const pending = interrupted.get('/users/me');
  await refreshStarted;
  sessions.clearSession();
  release();
  await assert.rejects(pending, (error) => error.status === 401);
  assert.equal(sessions.loadSession(), null, 'Refresh chạy nền không được tự đăng nhập lại');
  console.log('PASS: refresh hết hạn xóa phiên; đăng xuất trong lúc refresh không bị đăng nhập lại.');

  sessions.saveSession(await auth.login('anh@example.com', '123456'));
  const passwordInput = { currentPassword: '123456', newPassword: 'NewDemo123', confirmPassword: 'NewDemo123' };
  await assert.rejects(auth.changePassword('2', passwordInput), (error) => error.status === 403);
  await assert.rejects(auth.changePassword('1', { ...passwordInput, currentPassword: 'wrong' }), /hiện tại không đúng/);
  await assert.rejects(auth.changePassword('1', { ...passwordInput, confirmPassword: 'Mismatch' }), /không khớp/);
  await auth.changePassword('1', passwordInput);
  assert.match(values.get('chatapp-demo-password-hash'), /^[a-f0-9]{64}$/);
  const refreshToken = sessions.loadSession().refreshToken;
  await auth.logout(refreshToken);
  sessions.clearSession();
  await assert.rejects(auth.login('anh@example.com', '123456'), /không đúng/);
  const relogged = await auth.login('anh@example.com', 'NewDemo123');
  assert.equal(relogged.user.name, 'Tên đã sửa');
  sessions.saveSession(relogged);
  console.log('PASS: đổi mật khẩu, quyền tài khoản, đăng xuất và đăng nhập lại bằng mật khẩu mới.');

  const friends = load('src/api/friends.ts');
  const friendKey = 'chatapp-friend-relations';
  const primarySession = sessions.loadSession();
  const stateOf = (data, personId) => data.find((person) => person.id === personId);
  const initialPeople = await friends.getFriends();
  assert.equal(initialPeople.length, 7);
  assert.ok(initialPeople.every((person) => person.id !== '1'));
  assert.equal(initialPeople.filter((person) => person.relationship === 'friends').length, 1);
  assert.equal(initialPeople.filter((person) => person.relationship === 'incoming').length, 2);
  assert.equal(initialPeople.filter((person) => person.relationship === 'outgoing').length, 1);
  assert.equal(values.has(friendKey), false, 'Đọc dữ liệu mẫu không tự ghi vào storage');

  const notificationsApi = load('src/api/notifications.ts');
  let notices = await notificationsApi.getNotifications();
  assert.equal(notices.length, 3, 'Tài khoản 1 có hai lời mời và thông báo chào mừng');
  assert.ok(notices.every((item) => item.recipientId === '1'));
  assert.equal(notices.filter((item) => item.readAt === null).length, 3);
  assert.equal(values.has(friendKey), false, 'Đọc thông báo không tự ghi dữ liệu mẫu');
  assert.equal(notices.find((item) => item.sourceId === 'request-3-1').target.tab, 'incoming');

  sessions.clearSession();
  await assert.rejects(notificationsApi.getNotifications(), (error) => error.status === 401);
  await assert.rejects(notificationsApi.markAllNotificationsRead(), (error) => error.status === 401);
  await assert.rejects(friends.getFriends(), (error) => error.status === 401);
  await assert.rejects(friends.sendFriendRequest('6'), (error) => error.status === 401);
  sessions.saveSession(primarySession);
  await assert.rejects(friends.sendFriendRequest('1'), (error) => error.code === 'SELF_REQUEST');
  await assert.rejects(friends.sendFriendRequest('missing'), (error) => error.status === 404);
  await assert.rejects(friends.sendFriendRequest('2'), (error) => error.status === 409);
  await assert.rejects(friends.sendFriendRequest('3'), (error) => error.status === 409);

  // Mô phỏng dữ liệu bạn bè của bản cũ; giữ nguyên các quan hệ khi lưu lần đầu.
  const legacyRelations = load('src/dev/friendsData.ts').initialFriendRelations;
  values.set(friendKey, JSON.stringify(legacyRelations));
  notices = await notificationsApi.markNotificationRead('welcome:1');
  assert.equal(notices.find((item) => item.id === 'welcome:1').readAt, clock);
  assert.equal(JSON.parse(values.get(friendKey)).version, 2);
  assert.equal(JSON.stringify(JSON.parse(values.get(friendKey)).relations), JSON.stringify(legacyRelations));
  const writesBeforeRepeatRead = writes;
  await notificationsApi.markNotificationRead('welcome:1');
  assert.equal(writes, writesBeforeRepeatRead, 'Đánh dấu đã đọc lần nữa không ghi lặp');
  notices = await notificationsApi.markAllNotificationsRead();
  assert.ok(notices.every((item) => item.readAt !== null));
  assert.equal(JSON.parse(values.get(friendKey)).notifications.find((item) => item.recipientId === '5').readAt, null, 'Đọc tất cả chỉ áp dụng cho chính tài khoản');
  const writesBeforeReadAll = writes;
  await notificationsApi.markAllNotificationsRead();
  assert.equal(writes, writesBeforeReadAll);

  let people = await friends.sendFriendRequest('6');
  const sentId = stateOf(people, '6').relationId;
  assert.equal(stateOf(people, '6').relationship, 'outgoing');
  notices = await notificationsApi.getNotifications();
  assert.ok(notices.every((item) => item.sourceId !== sentId), 'Lời mời gửi đi tạo thông báo cho người nhận, không tự báo cho mình');
  const sentNoticeId = `friend-request:${sentId}`;
  assert.equal(JSON.parse(values.get(friendKey)).notifications.find((item) => item.id === sentNoticeId).recipientId, '6');
  await assert.rejects(notificationsApi.markNotificationRead(sentNoticeId), (error) => error.status === 404);

  await assert.rejects(friends.sendFriendRequest('6'), (error) => error.status === 409);
  await assert.rejects(friends.acceptFriendRequest(sentId), (error) => error.status === 403);
  await assert.rejects(friends.declineFriendRequest(sentId), (error) => error.status === 403);
  await assert.rejects(friends.cancelFriendRequest('request-3-1'), (error) => error.status === 403);
  await assert.rejects(friends.removeFriend('6'), (error) => error.status === 409);

  const concurrentSends = await Promise.allSettled([friends.sendFriendRequest('8'), friends.sendFriendRequest('8')]);
  assert.equal(concurrentSends.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(JSON.parse(values.get(friendKey)).relations.filter((relation) => relation.toId === '8' || relation.fromId === '8').length, 1);

  // Không được xử lý lời mời giữa hai người khác.
  const social = JSON.parse(values.get(friendKey));
  const relations = social.relations;
  values.set(friendKey, JSON.stringify({ ...social, relations: [...relations, { id: 'outside-request', fromId: '3', toId: '4', status: 'pending' }] }));
  await assert.rejects(friends.acceptFriendRequest('outside-request'), (error) => error.status === 403);
  await assert.rejects(friends.declineFriendRequest('outside-request'), (error) => error.status === 403);
  await assert.rejects(friends.cancelFriendRequest('outside-request'), (error) => error.status === 403);

  people = await friends.acceptFriendRequest('request-3-1');
  assert.equal(stateOf(people, '3').relationship, 'friends');
  assert.equal(people.filter((person) => person.relationship === 'friends').length, 2);
  await assert.rejects(friends.acceptFriendRequest('request-3-1'), (error) => error.status === 404);
  notices = await notificationsApi.getNotifications();
  assert.equal(notices.filter((item) => item.type === 'friend_connected' && item.sourceId === 'request-3-1').length, 1);
  assert.ok(notices.find((item) => item.type === 'friend_request' && item.sourceId === 'request-3-1').readAt !== null);
  assert.equal(notices.filter((item) => item.readAt === null).length, 1);
  const { issueSession } = load('src/dev/mockTokens.ts');
  sessions.saveSession(issueSession({ id: '3', name: 'Dũng', email: 'dung@example.com' }));
  assert.equal(stateOf(await friends.getFriends(), '1').relationship, 'friends', 'Quan hệ bạn bè phải có hai chiều');
  const senderNotices = await notificationsApi.getNotifications();
  assert.ok(senderNotices.every((item) => item.recipientId === '3'));
  assert.ok(senderNotices.some((item) => item.type === 'friend_accepted' && item.message.includes('Tên đã sửa')));
  await notificationsApi.markAllNotificationsRead();

  sessions.saveSession(primarySession);

  people = await friends.declineFriendRequest('request-4-1');
  assert.equal(stateOf(people, '4').relationship, 'none');
  people = await friends.cancelFriendRequest('request-1-5');
  assert.equal(stateOf(people, '5').relationship, 'none');
  people = await friends.removeFriend('2');
  assert.equal(stateOf(people, '2').relationship, 'none');
  people = await friends.sendFriendRequest('2');
  assert.equal(stateOf(people, '2').relationship, 'outgoing');
  people = await friends.removeFriend('3');
  assert.equal(stateOf(people, '3').relationship, 'none');

  // Thông báo kết bạn vẫn ở trong lịch sử sau khi hủy kết bạn.
  notices = await notificationsApi.getNotifications();
  const connectedNotice = notices.find((item) => item.type === 'friend_connected');
  assert.equal(connectedNotice.readAt, null, 'Đọc thông báo ở tài khoản khác không đổi tài khoản hiện tại');
  const beforeNotificationFailure = values.get(friendKey);
  const originalSetItem = storage.setItem;
  storage.setItem = () => { throw new Error('Storage full'); };
  try {
    await assert.rejects(notificationsApi.markNotificationRead(connectedNotice.id), (error) => error.code === 'STORAGE_WRITE');
    assert.equal(values.get(friendKey), beforeNotificationFailure);
  } finally { storage.setItem = originalSetItem; }
  notices = await notificationsApi.markAllNotificationsRead();
  assert.ok(notices.every((item) => item.readAt !== null));

  // Tải lại module như khi reload trang; không khởi tạo lại quan hệ đã sửa.
  const persisted = values.get(friendKey);
  modules = new Map();
  const reloadedFriends = load('src/api/friends.ts');
  const reloadedNetwork = load('src/dev/mockTransport.ts');
  reloadedNetwork.configureMockNetwork({ delayMs: 0 });
  const reloadedNotifications = load('src/api/notifications.ts');
  const loadedNotices = await reloadedNotifications.getNotifications();
  assert.ok(loadedNotices.every((item) => item.recipientId === '1' && item.readAt !== null));
  assert.ok(loadedNotices.some((item) => item.type === 'friend_connected'), 'Lịch sử và đã đọc được giữ sau reload');
  const persistedState = JSON.parse(values.get(friendKey));
  values.set(friendKey, JSON.stringify({ ...persistedState, notifications: [] }));
  assert.equal((await reloadedNotifications.getNotifications()).length, 0, 'Danh sách rỗng đã lưu không bị thay bằng dữ liệu mẫu');
  values.set(friendKey, JSON.stringify(persistedState.relations));
  const migratedNotices = await reloadedNotifications.getNotifications();
  assert.ok(migratedNotices.every((item) => item.sourceId !== 'request-3-1' && item.sourceId !== 'request-4-1'), 'Đọc dữ liệu cũ không khôi phục lời mời đã xử lý');
  values.set(friendKey, persisted);

  people = await reloadedFriends.getFriends();
  assert.equal(stateOf(people, '2').relationship, 'outgoing');
  assert.equal(stateOf(people, '3').relationship, 'none');
  assert.equal(stateOf(people, '4').relationship, 'none');
  assert.equal(stateOf(people, '5').relationship, 'none');
  assert.equal(stateOf(people, '6').relationship, 'outgoing');
  assert.equal(stateOf(people, '8').relationship, 'outgoing');

  reloadedNetwork.configureMockNetwork({ online: false });
  await assert.rejects(reloadedNotifications.getNotifications(), (error) => error.status === 0);
  await assert.rejects(reloadedNotifications.markAllNotificationsRead(), (error) => error.status === 0);
  await assert.rejects(reloadedFriends.sendFriendRequest('7'), (error) => error.status === 0);
  assert.equal(values.get(friendKey), persisted);
  reloadedNetwork.configureMockNetwork({ online: true, failNext: 500 });
  await assert.rejects(reloadedFriends.sendFriendRequest('7'), (error) => error.status === 500);
  assert.equal(values.get(friendKey), persisted);

  const setItem = storage.setItem;
  storage.setItem = () => { throw new Error('Storage full'); };
  try {
    await assert.rejects(reloadedFriends.sendFriendRequest('7'), (error) => error.code === 'STORAGE_WRITE');
    assert.equal(values.get(friendKey), persisted, 'Lưu lỗi không được báo thành công hoặc đổi dữ liệu');
  } finally { storage.setItem = setItem; }
  values.set(friendKey, '{broken');
  await assert.rejects(reloadedFriends.getFriends(), (error) => error.code === 'STORAGE_READ');
  await assert.rejects(reloadedNotifications.getNotifications(), (error) => error.code === 'STORAGE_READ');
  assert.equal(values.get(friendKey), '{broken', 'Không ghi đè dữ liệu lỗi bằng mẫu mặc định');
  values.set(friendKey, persisted);
  people = await reloadedFriends.sendFriendRequest('7');
  assert.equal(stateOf(people, '7').relationship, 'outgoing', 'Có thể thử lại sau khi lỗi đã được giải quyết');
  console.log('PASS: bạn bè, lời mời hai chiều, quyền thao tác, chống gửi trùng, lưu sau reload và xử lý lỗi mạng/storage.');
  console.log('PASS: thông báo đúng người nhận, đọc một/tất cả, chống ghi lặp, liên kết lời mời, lịch sử sau reload và chuyển dữ liệu cũ.');

  const posts = load('src/api/posts.ts');
  const comments = load('src/api/comments.ts');
  const post = await posts.createPost(relogged.user, 'Bài kiểm tra sau khi hoàn thiện Core');
  assert.equal((await posts.toggleLike('1', post.id)).likes, 1);
  assert.equal((await posts.updatePost('1', post.id, 'Đã sửa')).likes, 1);
  const comment = await comments.createComment(relogged.user, post.id, 'Bình luận');
  assert.equal((await comments.getComments(post.id))[0].author, 'Tên đã sửa');
  await comments.deleteComment('1', post.id, comment.id);
  assert.equal((await comments.getComments(post.id)).length, 0);
  await posts.deletePost('1', post.id);
  await assert.rejects(posts.getPostById(post.id), /không còn tồn tại/);

  const feedUpdates = load('src/utils/postUpdates.ts');
  const sharingOriginal = await posts.createPost(relogged.user, 'Nội dung bài gốc');
  const sharingUser = { id: '2', name: 'Mai', email: 'mai@example.com' };
  let sharingFeed = await posts.getPosts();
  const sharedOnce = await posts.sharePost(sharingUser, sharingOriginal.id, '  Mọi người xem nhé  ');
  assert.notEqual(sharedOnce.id, sharingOriginal.id);
  assert.equal(sharedOnce.authorId, '2');
  assert.equal(sharedOnce.content, 'Mọi người xem nhé');
  assert.equal(sharedOnce.sharedPostId, sharingOriginal.id);
  assert.equal(sharedOnce.sharedPost.content, 'Nội dung bài gốc');
  assert.equal(sharedOnce.shareCount, 1);
  assert.equal(sharedOnce.likes, 0);
  assert.equal(sharedOnce.images.length, 0, 'Không sao chép ảnh gốc vào bài chia sẻ');
  sharingFeed = feedUpdates.addPostToFeed(sharingFeed, sharedOnce);
  assert.equal(sharingFeed[0].id, sharedOnce.id);
  assert.equal(sharingFeed.find((item) => item.id === sharingOriginal.id).shareCount, 1);

  const sharedAgain = await posts.sharePost(relogged.user, sharedOnce.id);
  assert.equal(sharedAgain.content, '', 'Cho phép chia sẻ không kèm lời nhắn');
  assert.equal(sharedAgain.sharedPostId, sharingOriginal.id, 'Chia sẻ lại trỏ thẳng đến bài gốc');
  assert.equal(sharedAgain.shareCount, 2);
  sharingFeed = feedUpdates.addPostToFeed(sharingFeed, sharedAgain);
  assert.equal(sharingFeed.find((item) => item.id === sharedOnce.id).shareCount, 2);

  const rawSharing = JSON.parse(values.get('chatapp-posts'));
  assert.equal(rawSharing.find((item) => item.id === sharedOnce.id).sharedPost, undefined);
  assert.equal(rawSharing.find((item) => item.id === sharedOnce.id).shareCount, undefined);
  const restoredSharing = load('src/storage/posts.ts').loadPosts();
  assert.equal(restoredSharing.find((item) => item.id === sharedAgain.id).sharedPostId, sharingOriginal.id);
  assert.equal((await posts.getPostById(sharedAgain.id)).sharedPost.content, 'Nội dung bài gốc');

  const editedOriginal = await posts.updatePost('1', sharingOriginal.id, 'Bài gốc đã chỉnh sửa');
  sharingFeed = feedUpdates.updatePostInFeed(sharingFeed, editedOriginal);
  assert.equal(sharingFeed.find((item) => item.id === sharedOnce.id).sharedPost.content, 'Bài gốc đã chỉnh sửa');
  assert.equal((await posts.getPostById(sharedAgain.id)).sharedPost.content, 'Bài gốc đã chỉnh sửa');
  await posts.updatePost('2', sharedOnce.id, '');
  assert.equal((await posts.getPostById(sharingOriginal.id)).content, 'Bài gốc đã chỉnh sửa');
  await assert.rejects(posts.updatePost('1', sharedOnce.id, 'Không phải bài của mình'), /chỉ được sửa/);
  await assert.rejects(posts.deletePost('1', sharedOnce.id), /chỉ được sửa/);
  assert.equal((await posts.toggleLike('1', sharedOnce.id)).likes, 1);
  assert.equal((await posts.getPostById(sharingOriginal.id)).likes, 0, 'Like bài chia sẻ không thay đổi Like bài gốc');
  const sharedComment = await comments.createComment(relogged.user, sharedOnce.id, 'Bình luận ở bài chia sẻ');
  assert.equal((await comments.getComments(sharedOnce.id)).length, 1);
  assert.equal((await comments.getComments(sharingOriginal.id)).length, 0);
  await comments.deleteComment('1', sharedOnce.id, sharedComment.id);

  const beforeSharingFailure = values.get('chatapp-posts');
  await assert.rejects(posts.sharePost(sharingUser, sharingOriginal.id, 'x'.repeat(posts.MAX_POST_LENGTH + 1)), /không được vượt quá/);
  await assert.rejects(posts.sharePost(sharingUser, 'missing-post'), /không còn tồn tại/);
  await assert.rejects(posts.sharePost({ ...sharingUser, id: '' }, sharingOriginal.id), /đăng nhập/);
  assert.equal(values.get('chatapp-posts'), beforeSharingFailure);
  const saveBeforeShareFailure = storage.setItem;
  storage.setItem = () => { throw new Error('Storage full'); };
  try {
    await assert.rejects(posts.sharePost(sharingUser, sharingOriginal.id, 'Thử lại sau'), /Không lưu được/);
    assert.equal(values.get('chatapp-posts'), beforeSharingFailure);
  } finally { storage.setItem = saveBeforeShareFailure; }

  await posts.deletePost('2', sharedOnce.id);
  sharingFeed = feedUpdates.removePostFromFeed(sharingFeed, sharedOnce.id);
  assert.equal(sharingFeed.find((item) => item.id === sharingOriginal.id).shareCount, 1);
  assert.equal((await posts.getPostById(sharingOriginal.id)).shareCount, 1);
  assert.ok((await posts.getPostById(sharedAgain.id)).sharedPost);
  await posts.deletePost('1', sharingOriginal.id);
  sharingFeed = feedUpdates.removePostFromFeed(sharingFeed, sharingOriginal.id);
  assert.equal(sharingFeed.find((item) => item.id === sharedAgain.id).sharedPost, null);
  assert.equal((await posts.getPostById(sharedAgain.id)).sharedPost, null);
  await assert.rejects(posts.sharePost(sharingUser, sharedAgain.id), /Bài viết gốc không còn tồn tại/);
  await posts.updatePost('1', sharedAgain.id, 'Lời nhắn vẫn sửa được sau khi bài gốc bị xóa');
  await posts.deletePost('1', sharedAgain.id);

  const beforeLegacyPosts = values.get('chatapp-posts');
  values.set('chatapp-posts', JSON.stringify([{ id: 'old', authorId: '1', author: 'Cũ', content: 'Bài cũ', likes: 2 }]));
  const legacyPosts = await posts.getPosts();
  assert.equal(legacyPosts[0].images.length, 0);
  assert.equal(legacyPosts[0].likedBy.length, 0);
  assert.equal(legacyPosts[0].shareCount, 0);
  assert.equal(legacyPosts[0].sharedPostId, undefined);
  await posts.sharePost(sharingUser, 'old');
  assert.equal((await posts.getPostById('old')).likes, 2);
  values.set('chatapp-posts', beforeLegacyPosts);
  console.log('PASS: chia sẻ có/không lời nhắn, chia sẻ lại, lưu/reload, sửa/xóa bài gốc, quyền sở hữu, Like/bình luận riêng, bộ đếm, dữ liệu cũ và lỗi lưu.');

  values.set('chatapp-session', '{broken');
  assert.equal(sessions.loadSession(), null);
  values.set('chatapp-session', JSON.stringify({ user: { id: '1' } }));
  assert.equal(sessions.loadSession(), null);
  console.log('PASS: các luồng bài viết/Like/bình luận cũ và dữ liệu phiên không hợp lệ.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
