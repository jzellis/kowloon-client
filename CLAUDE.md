# Kowloon Client

Isomorphic JavaScript client library for the Kowloon federated social media server. Works in Node.js, browsers, and React Native.

## Architecture

### Module Structure

```
src/
  index.js          — Main KowloonClient class, wires everything together
  http/client.js    — HttpClient (fetch wrapper with JWT injection, timeout, error mapping)
  auth/index.js     — AuthClient (register, login, logout, session management)
  activities/index.js — ActivitiesClient (27 methods: posts, replies, reacts, circles, groups, bookmarks, pages, user actions, files)
  feed/index.js     — FeedClient (20 methods: content feeds, single objects, collections, notifications)
  search/index.js   — SearchClient (8 methods: search across object types)
  admin/index.js    — AdminClient (35 methods: CRUD for all types, settings, moderation) — separate export
  utils/errors.js   — Error classes (KowloonError, AuthenticationError, ValidationError, etc.)
  utils/storage.js  — Auto-detect storage adapter (localStorage, AsyncStorage, in-memory)
```

### Key Design Decisions — DO NOT CHANGE

- **All methods take options objects** (not positional args): `client.feeds.getPost({ postId: "..." })`
- **No follow/unfollow methods** — Kowloon uses circles, not a social graph. `addToCircle`/`removeFromCircle` IS the follow.
- **Reply is a separate object from Post** on the server. `createReply` sends `{ type: "Reply", objectType: "Reply", to: parentPostId }`. The server's Reply handler is self-contained (does NOT delegate to Create).
- **React is a separate object** too. `react` sends `{ type: "React", objectType: "React", to: targetId }`.
- **Notifications are in FeedClient** — they're just a type of feed
- **Files/upload is in ActivitiesClient** — uses `POST /files/upload` with multipart FormData
- **Admin is a separate package export** — `import { AdminClient } from 'kowloon-client/admin'`
- **Profile updates are Activities** — `updateProfile()` posts to outbox with `type: "Update"`

### Client Initialization

```js
import KowloonClient from 'kowloon-client';

const client = new KowloonClient({ baseUrl: 'https://kwln.org' });
await client.init(); // restores session if available

// Sub-clients:
client.auth        // AuthClient
client.activities  // ActivitiesClient
client.feeds       // FeedClient (note: plural)
client.search      // SearchClient
```

### Write Operations (ActivitiesClient)

All write operations go through `POST /outbox`. The client builds the Activity object and posts it.

Methods: createPost, updatePost, deletePost, createReply, react, deleteReact, createActivity, createCircle, updateCircle, deleteCircle, addToCircle, removeFromCircle, createGroup, updateGroup, deleteGroup, joinGroup, leaveGroup, approveJoinRequest, rejectJoinRequest, createBookmark, updateBookmark, deleteBookmark, createPage, updatePage, deletePage, updateProfile, block, unblock, mute, unmute, flag, upload

### Read Operations (FeedClient)

All read operations are GET requests.

Content feeds: getServerPosts, getServerPages, getCirclePosts, getGroupPosts, getUserPosts
Single objects: getPost, getGroup, getUser, getBookmark, getPage, getCircle
Collections: getGroupMembers, getCircleMembers, getUserCircles, getUserBookmarks, getReplies, getReacts
Notifications: getNotifications, markNotificationAsRead, markNotificationAsUnread, markAllNotificationsAsRead

### Search (SearchClient)

General: `search({ query, searchIn: { posts: true, users: true } })`
Convenience: searchPosts, searchCircles, searchGroups, searchUsers, searchBookmarks, searchActivities, searchNotifications

### Error Handling

HttpClient maps HTTP status codes to typed errors:
- 401 -> AuthenticationError
- 403 -> AuthorizationError
- 404 -> NotFoundError
- 400-499 -> ValidationError
- 500+ -> ServerError
- Network failures -> NetworkError

All extend KowloonError with `statusCode`, `response`, `requestId`.

## Server API Mapping

Client notification methods use `/notifications/*` (convenience route on server that resolves user from JWT). The canonical routes are at `/users/:id/notifications/*`.

## Related Project

The server is at `../kowloon/`. See its CLAUDE.md for server architecture, schema details, and route patterns.

## Consolidated API Spec

The full spec is in Joplin (note ID: 1cfd6eaee9b64494a577617d4f9e5847). Read with:
```
curl "http://localhost:41184/notes/1cfd6eaee9b64494a577617d4f9e5847?token=$JOPLIN_TOKEN&fields=body"
```
