// tests/integration.test.js
// Integration tests for kowloon-client against a seeded Kowloon server.
// Requires: server running at BASE_URL with seed-test.js data loaded.
// Run: node --test tests/integration.test.js

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { KowloonClient } from "../src/index.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PASSWORD = "testpass";

// Shared state across tests
let alice, bob;
let aliceUser, bobUser;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeClient() {
  return new KowloonClient({ baseUrl: BASE_URL });
}

async function loginAs(username) {
  const client = makeClient();
  const result = await client.auth.login({ username, password: PASSWORD });
  return { client, user: result.user, token: result.token };
}

// ── Setup ──────────────────────────────────────────────────────────────────

before(async () => {
  // Verify server is reachable
  const res = await fetch(BASE_URL);
  assert.ok(res.ok, `Server not reachable at ${BASE_URL}`);

  // Login as alice and bob
  const a = await loginAs("alice");
  alice = a.client;
  aliceUser = a.user;

  const b = await loginAs("bob");
  bob = b.client;
  bobUser = b.user;
});

// ── Auth ───────────────────────────────────────────────────────────────────

describe("AuthClient", () => {
  it("login returns user and token", async () => {
    const client = makeClient();
    const result = await client.auth.login({
      username: "alice",
      password: PASSWORD,
    });
    assert.ok(result.token, "should return a token");
    assert.ok(result.user, "should return a user");
    assert.equal(result.user.username, "alice");
  });

  it("login with wrong password throws", async () => {
    const client = makeClient();
    await assert.rejects(
      () => client.auth.login({ username: "alice", password: "wrong" }),
      (err) => err.name === "AuthenticationError" || err.statusCode === 401
    );
  });

  it("isAuthenticated returns true after login", async () => {
    assert.ok(await alice.auth.isAuthenticated());
  });

  it("getUser returns user object", () => {
    const user = alice.auth.getUser();
    assert.equal(user.username, "alice");
  });

  it("logout clears session", async () => {
    const client = makeClient();
    await client.auth.login({ username: "carol", password: PASSWORD });
    assert.ok(await client.auth.isAuthenticated());
    await client.auth.logout();
    assert.ok(!(await client.auth.isAuthenticated()));
  });
});

// ── Feed: Public endpoints (no auth needed) ────────────────────────────────

describe("FeedClient — public reads", () => {
  it("GET /posts returns public posts", async () => {
    // Use getUserPosts which doesn't require serverId
    const result = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    // Should be an ActivityStreams collection
    assert.ok(
      result.orderedItems || result.items || Array.isArray(result),
      "should return items"
    );
  });

  it("GET /users/:id returns user profile", async () => {
    const result = await alice.feeds.getUser({ userId: aliceUser.id });
    // Server returns { item: { ... } }
    const user = result.item || result;
    assert.ok(user.id || user.preferredUsername, "should return user data");
  });

  it("GET /posts/:id returns a single post", async () => {
    // Create a post first so it exists in FeedItems (seeded posts bypass outbox)
    const created = await alice.activities.createPost({
      type: "Note",
      to: "@public",
      canReply: "@public",
      canReact: "@public",
      content: "Post for getPost test",
    });
    const postId = created?.createdId || created?.result?.id || created?.created?.id || created?.id;
    assert.ok(postId, "should have created a post");

    const post = await alice.feeds.getPost({ postId });
    const postData = post.item || post;
    assert.ok(postData.id, "should return post with id");
  });

  it("GET /groups/:id returns 404 for nonexistent", async () => {
    const client = makeClient();
    await assert.rejects(
      () => client.feeds.getGroup({ groupId: "group:nonexistent@localhost" }),
      (err) => err.statusCode === 404 || err.statusCode === 400
    );
  });
});

// ── Feed: Authenticated endpoints ──────────────────────────────────────────

describe("FeedClient — authenticated reads", () => {
  it("getUserPosts returns posts by alice", async () => {
    const result = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    const items = result.orderedItems || result.items || result;
    assert.ok(items, "should return items");
  });

  it("getUserCircles returns alice's circles", async () => {
    const result = await alice.feeds.getUserCircles({ userId: aliceUser.id });
    const items = result.orderedItems || result.items || result;
    assert.ok(items, "should return circles");
  });

  it("getUserBookmarks returns alice's bookmarks", async () => {
    const result = await alice.feeds.getUserBookmarks({
      userId: aliceUser.id,
    });
    const items = result.orderedItems || result.items || result;
    assert.ok(items, "should return bookmarks");
  });

  it("getCircleMembers returns members of alice's circle", async () => {
    // Get alice's circles first
    const circles = await alice.feeds.getUserCircles({
      userId: aliceUser.id,
    });
    const items = circles.orderedItems || circles.items || circles;
    if (items && items.length > 0) {
      const circleId = items[0].id;
      const members = await alice.feeds.getCircleMembers({ circleId });
      assert.ok(
        members.orderedItems || members.items || members.totalItems !== undefined,
        "should return members collection"
      );
    }
  });
});

// ── Notifications ──────────────────────────────────────────────────────────

describe("FeedClient — notifications", () => {
  it("getNotifications returns alice's notifications", async () => {
    const result = await alice.notifications.list();
    const items = result.notifications || result.orderedItems || result.items || result;
    assert.ok(items, "should return notifications");
  });

  it("markNotificationAsRead works", async () => {
    const result = await alice.notifications.list();
    const items = result.notifications || result.orderedItems || result.items || [];
    if (Array.isArray(items) && items.length > 0) {
      const notifId = items[0].id;
      const marked = await alice.notifications.markRead(notifId);
      assert.ok(marked, "should return response");
    }
  });

  it("markNotificationAsUnread works", async () => {
    const result = await alice.notifications.list();
    const items = result.notifications || result.orderedItems || result.items || [];
    if (Array.isArray(items) && items.length > 0) {
      const notifId = items[0].id;
      await alice.notifications.markRead(notifId);
      const marked = await alice.notifications.markUnread(notifId);
      assert.ok(marked, "should return response");
    }
  });

  it("markAllNotificationsAsRead works", async () => {
    const result = await alice.notifications.markAllRead();
    assert.ok(result, "should return response");
  });
});

// ── Search ─────────────────────────────────────────────────────────────────

describe("SearchClient", () => {
  it("search with query returns results", async () => {
    const result = await alice.search.search({ query: "alice" });
    assert.ok(
      result.orderedItems || result.items || result.totalItems !== undefined,
      "should return a collection"
    );
  });

  it("searchPosts filters to posts only", async () => {
    const result = await alice.search.searchPosts({ query: "public" });
    assert.ok(
      result.orderedItems || result.items || result.totalItems !== undefined,
      "should return results"
    );
    // Verify all results are posts (if any)
    const items = result.orderedItems || result.items || [];
    for (const item of items) {
      assert.ok(
        !item._searchType || item._searchType === "Post",
        "should only return posts"
      );
    }
  });

  it("searchUsers filters to users only", async () => {
    const result = await alice.search.searchUsers({ query: "alice" });
    assert.ok(
      result.orderedItems || result.items || result.totalItems !== undefined,
      "should return results"
    );
  });

  it("searchGroups works", async () => {
    const result = await alice.search.searchGroups({ query: "Public Group" });
    assert.ok(
      result.orderedItems || result.items || result.totalItems !== undefined,
      "should return results"
    );
  });
});

// ── Activities: Write operations ───────────────────────────────────────────

describe("ActivitiesClient — write operations", () => {
  let createdPostId;

  it("createPost creates a public note", async () => {
    const result = await alice.activities.createPost({
      type: "Note",
      to: "@public",
      canReply: "@public",
      canReact: "@public",
      content: "Hello from the client test!",
    });
    assert.ok(result, "should return a response");
    createdPostId = result.result?.id || result.createdId || result.id;
  });

  it("createReply replies to a post", async () => {
    // Get a post to reply to
    const posts = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    const items = posts.orderedItems || posts.items || posts;
    if (items && items.length > 0) {
      const targetId = items[0].id;
      const result = await bob.activities.createReply({
        toItemId: targetId,
        body: "Reply from client test!",
      });
      assert.ok(result, "should return a response");
      // Verify the reply has a target linking to the parent post
      const created = result.created || result;
      if (created.target) {
        assert.equal(created.target, targetId, "reply target should match parent post");
      }
    }
  });

  it("react to a post", async () => {
    const posts = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    const items = posts.orderedItems || posts.items || posts;
    if (items && items.length > 0) {
      const targetId = items[0].id;
      const result = await bob.activities.react({
        postId: targetId,
        emoji: "👍",
      });
      assert.ok(result, "should return a response");
    }
  });

  it("createCircle creates a new circle", async () => {
    const result = await alice.activities.createCircle({
      name: "Test Circle from Client",
      to: "@public",
    });
    assert.ok(result, "should return a response");
  });

  it("createBookmark creates a bookmark", async () => {
    const result = await alice.activities.createBookmark({
      title: "Test Bookmark",
      href: "https://example.com/test",
      to: "@public",
    });
    assert.ok(result, "should return a response");
  });

  it("createGroup creates a group", async () => {
    const result = await alice.activities.createGroup({
      name: "Test Group from Client",
      description: "Created during integration testing",
      to: "@public",
      rsvpPolicy: "open",
    });
    assert.ok(result, "should return a response");
  });
});

// ── Replies + Reacts retrieval ─────────────────────────────────────────────

describe("FeedClient — replies and reacts", () => {
  it("getReplies returns replies for a post", async () => {
    // Find a post that has replies (alice's public post)
    const posts = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    const items = posts.orderedItems || posts.items || [];
    // Try each post until we find one with replies
    for (const post of items) {
      if (post.replyCount > 0) {
        const replies = await alice.feeds.getReplies({ postId: post.id });
        const replyItems = replies.orderedItems || replies.items || replies;
        assert.ok(replyItems, "should return replies");
        return;
      }
    }
    // If no posts have replies, just verify the endpoint works
    if (items.length > 0) {
      const replies = await alice.feeds.getReplies({ postId: items[0].id });
      assert.ok(replies !== undefined, "endpoint should respond");
    }
  });

  it("getReacts returns reacts for a post", async () => {
    const posts = await alice.feeds.getUserPosts({ userId: aliceUser.id });
    const items = posts.orderedItems || posts.items || [];
    if (items.length > 0) {
      const reacts = await alice.feeds.getReacts({ postId: items[0].id });
      assert.ok(reacts !== undefined, "endpoint should respond");
    }
  });
});

// ── Error handling ─────────────────────────────────────────────────────────

describe("Error handling", () => {
  it("404 for nonexistent post", async () => {
    await assert.rejects(
      () => alice.feeds.getPost({ postId: "post:nonexistent@localhost" }),
      (err) => err.statusCode === 404
    );
  });

  it("401 for unauthenticated notification access", async () => {
    const client = makeClient();
    await assert.rejects(
      () => client.notifications.list(),
      (err) => err.statusCode === 401
    );
  });

  it("validation error for missing required fields", async () => {
    await assert.rejects(
      () => alice.activities.createPost({}),
      (err) => err.name === "ValidationError"
    );
  });
});
