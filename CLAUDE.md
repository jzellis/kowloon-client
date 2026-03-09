# Kowloon Client

Isomorphic JavaScript client library for the Kowloon federated social media server. Works in Node.js, browsers, and React Native.

## Architecture

### Module Structure

```
src/
  index.js               — Main KowloonClient class, wires everything together
  http/client.js         — HttpClient (fetch wrapper with JWT injection, timeout, error mapping)
  auth/index.js          — AuthClient (register, login, logout, session management)
  activities/index.js    — ActivitiesClient (write ops: posts, replies, reacts, circles, groups, bookmarks, pages, user actions)
  feed/index.js          — FeedClient (read ops: content feeds, single objects, collections, files)
  search/index.js        — SearchClient (search: posts, pages, groups, users, bookmarks)
  files/index.js         — FilesClient (upload, list, getMeta, serveUrl, delete)
  notifications/index.js — NotificationsClient (list, unreadCount, markRead, markUnread, markAllRead, dismiss)
  admin/index.js         — AdminClient (35 methods: CRUD for all types, settings, moderation) — separate export
  utils/errors.js        — Error classes (KowloonError, AuthenticationError, ValidationError, etc.)
  utils/storage.js       — Auto-detect storage adapter (localStorage, AsyncStorage, in-memory)
```

### Key Design Decisions — DO NOT CHANGE

- **All methods take options objects** (not positional args): `client.feeds.getPost({ postId: "..." })`
- **No follow/unfollow methods** — Kowloon uses circles. `addToCircle`/`removeFromCircle` IS the follow.
- **Reply is separate from Post** on the server. `createReply` sends `{ type: "Reply", objectType: "Reply", to: parentPostId }`.
- **React is separate** too. `react` sends `{ type: "React", objectType: "React", to: targetId }`.
- **Notifications are in NotificationsClient** — not in FeedClient.
- **Files are in FilesClient** — `activities.upload()` delegates to `files.upload()`.
- **Admin is a separate package export** — `import { AdminClient } from '@kowloon/client/admin'`
- **Profile updates are Activities** — `updateProfile()` posts to outbox with `type: "Update"`

### Client Initialization

```js
import KowloonClient from '@kowloon/client';

const client = new KowloonClient({ baseUrl: 'https://kwln.org' });
await client.init(); // restores session if available

// Sub-clients:
client.auth           // AuthClient
client.activities     // ActivitiesClient
client.feeds          // FeedClient (note: plural)
client.files          // FilesClient
client.notifications  // NotificationsClient
client.search         // SearchClient
```

### Write Operations (ActivitiesClient)

All write operations go through `POST /outbox`.

Methods: createPost, updatePost, deletePost, createReply, react, deleteReact, createActivity, createCircle, updateCircle, deleteCircle, addToCircle, removeFromCircle, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup, approveJoinRequest, rejectJoinRequest, createBookmark, updateBookmark, deleteBookmark, createPage, updatePage, deletePage, updateProfile, block, unblock, mute, unmute, flag, upload (delegates to FilesClient)

### Read Operations (FeedClient)

All read operations are GET requests.

Content feeds: getServerPosts, getServerPages, getCirclePosts, getGroupPosts, getUserPosts
Single objects: getPost, getGroup, getUser, getBookmark, getPage, getCircle
Collections: getGroupMembers, getCircleMembers, getUserCircles, getUserBookmarks, getReplies, getReacts
Files: getFile (metadata at `/files/:id/meta`)

### Files (FilesClient)

- `upload(options)` — `POST /files` multipart. Accepts `to`, `parentObject`, `generateThumbnail`, `thumbnailSizes`.
- `list(options)` — `GET /files` (authenticated user's files)
- `getMeta(fileId)` — `GET /files/:id/meta`
- `serveUrl(fileId, { size?, token? })` — builds URL for `<img src>` etc. (not an HTTP call)
- `delete(fileId)` — `DELETE /files/:id`

Files are served at `GET /files/:id` (auth-controlled proxy). Thumbnails: `?size=200`.
Visibility inherited from parent object at serve time if `parentObject` is set.

### Notifications (NotificationsClient)

- `list(options)` — `GET /notifications`
- `unreadCount(options)` — `GET /notifications/unread/count`
- `markRead(id)` — `POST /notifications/:id/read`
- `markUnread(id)` — `POST /notifications/:id/unread`
- `markAllRead(options)` — `POST /notifications/read-all`
- `dismiss(id)` — `POST /notifications/:id/dismiss`

### Search (SearchClient)

Searchable types: **posts, pages, groups, users, bookmarks** (not circles, activities, or notifications).

General: `search({ query, searchIn: { posts: true, users: true } })`
Convenience: searchPosts, searchPages, searchGroups, searchUsers, searchBookmarks

### Error Handling

HttpClient maps HTTP status codes to typed errors:
- 401 → AuthenticationError
- 403 → AuthorizationError
- 404 → NotFoundError
- 400-499 → ValidationError
- 500+ → ServerError
- Network failures → NetworkError

All extend KowloonError with `statusCode`, `response`, `requestId`.

## Related Project

The server is at `../kowloon/`. See its CLAUDE.md for server architecture, schema details, and route patterns.

## Consolidated API Spec

The full spec is in Joplin (note ID: 1cfd6eaee9b64494a577617d4f9e5847). Read with:
```
curl "http://localhost:41184/notes/1cfd6eaee9b64494a577617d4f9e5847?token=$JOPLIN_TOKEN&fields=body"
```
