// Feed module for Kowloon client
// Handles content feeds, single object retrieval, collections, and notifications

import { ValidationError } from '../utils/errors.js';

/**
 * Feed client — all methods are GET requests (read-only)
 */
export class FeedClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  // ---- Server Info ----

  /**
   * Get server info and public settings (name, domain, reactEmojis, etc.)
   * @returns {Promise<Object>} { name, domain, settings: { reactEmojis, ... }, ... }
   */
  async getServerInfo() {
    return await this.http.get('/');
  }

  /**
   * Fetch a link preview (OpenGraph / link-preview-js) for an external URL.
   * Server-side SSRF guard rejects loopback / private hosts.
   * @param {Object} options
   * @param {string} options.url - The URL to preview
   * @returns {Promise<Object>} { url, title, summary, contentType, image, favicon }
   */
  async getLinkPreview(options) {
    const { url } = options;
    if (!url) throw new ValidationError('url is required');
    return await this.http.get('/preview', { params: { url } });
  }

  // ---- Content Feeds ----

  /**
   * Get public/visible posts from a server
   * @param {Object} options
   * @param {string} options.serverId - Server ID or domain
   * @param {string} [options.type] - Single post type filter (Note, Article, etc.)
   * @param {string[]} [options.types] - Multi post type filter; sent as comma-separated `type` param
   * @param {'public'|'server'} [options.to] - Restrict to a single visibility tier.
   *   Omitted = default merged view (public + server for authed local users).
   *   'public' = public firehose only. 'server' = server-only (requires local auth).
   * @param {number} [options.page] - Page number
   * @param {string} [options.since] - ISO date cursor
   * @returns {Promise<Object>}
   */
  async getServerPosts(options = {}) {
    const { serverId, type, types, to, page, since } = options;

    const params = {};
    if (serverId) params.serverId = serverId;
    if (types && types.length) params.type = types.join(',');
    else if (type) params.type = type;
    if (to) params.to = to;
    if (page) params.page = page;
    if (since) params.since = since;

    return await this.http.get('/posts', { params });
  }

  /**
   * Get public/visible pages from a server
   * @param {Object} options
   * @param {string} options.serverId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getServerPages(options) {
    const { serverId, page } = options;

    if (!serverId) throw new ValidationError('serverId is required');

    const params = { serverId };
    if (page) params.page = page;

    return await this.http.get('/pages', { params });
  }

  /**
   * Get posts from members of a circle (primary timeline view)
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string} [options.type] - Post type filter
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  /**
   * Advance the high-water mark for a circle feed (idempotent — server ignores regressions)
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string|Date} options.lastSeenAt - ISO string or Date of the most recent post seen
   */
  async markCircleSeen(options) {
    const { circleId, lastSeenAt } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    if (!lastSeenAt) throw new ValidationError('lastSeenAt is required');
    const ts = lastSeenAt instanceof Date ? lastSeenAt.toISOString() : lastSeenAt;
    return await this.http.patch(`/circles/${encodeURIComponent(circleId)}/seen`, { lastSeenAt: ts });
  }

  async getCirclePosts(options) {
    const { circleId, types, type, before, limit } = options;

    if (!circleId) throw new ValidationError('circleId is required');

    const params = {};
    // Accept types (array), type (string), or neither
    const typeList = types ?? (type ? [type] : null);
    if (typeList?.length) params.types = typeList.join(',');
    if (before) params.before = before;
    if (limit) params.limit = limit;

    return await this.http.get(`/circles/${encodeURIComponent(circleId)}/posts`, { params });
  }

  /**
   * Get posts addressed to a group
   * @param {Object} options
   * @param {string} options.groupId
   * @param {string} [options.type] - Post type filter
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getGroupPosts(options) {
    const { groupId, type, page } = options;

    if (!groupId) throw new ValidationError('groupId is required');

    const params = {};
    if (type) params.type = type;
    if (page) params.page = page;

    return await this.http.get(`/groups/${encodeURIComponent(groupId)}/posts`, { params });
  }

  /**
   * Get posts by a specific user
   * @param {Object} options
   * @param {string} options.userId
   * @param {string} [options.type]
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async getUserPosts(options) {
    const { userId, type, page, since } = options;

    if (!userId) throw new ValidationError('userId is required');

    const params = {};
    if (type) params.type = type;
    if (page) params.page = page;
    if (since) params.since = since;

    return await this.http.get(`/users/${encodeURIComponent(userId)}/posts`, { params });
  }

  // ---- Single Object Retrieval ----

  /**
   * Get a single post by ID
   * @param {Object} options
   * @param {string} options.postId
   * @returns {Promise<Object>}
   */
  async getPost(options) {
    const { postId } = options;
    if (!postId) throw new ValidationError('postId is required');

    return await this.http.get(`/posts/${encodeURIComponent(postId)}`);
  }

  /**
   * Get a single group by ID
   * @param {Object} options
   * @param {string} options.groupId
   * @returns {Promise<Object>}
   */
  async getGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    return await this.http.get(`/groups/${encodeURIComponent(groupId)}`);
  }

  /**
   * Get a user's profile
   * @param {Object} options
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async getUser(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    try {
      return await this.http.get(`/users/${encodeURIComponent(userId)}`);
    } catch (err) {
      // GET /users/:id is local-only. A federated handle (@name@remote-domain)
      // isn't in the local users collection, so it 404s -- fall back to /lookup,
      // which fetches and hydrates the remote actor and returns the same
      // { item } shape. Only retry for remote-looking ids to avoid masking real
      // 404s for local users.
      const isRemoteHandle = /^@[^@/]+@[^@/]+$/.test(userId);
      if (err?.statusCode === 404 && isRemoteHandle) {
        return await this.lookup({ id: userId });
      }
      throw err;
    }
  }

  /**
   * Get a single bookmark by ID
   * @param {Object} options
   * @param {string} options.bookmarkId
   * @returns {Promise<Object>}
   */
  async getBookmark(options) {
    const { bookmarkId } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');

    return await this.http.get(`/bookmarks/${encodeURIComponent(bookmarkId)}`);
  }

  /**
   * Get a single page by ID or slug
   * @param {Object} options
   * @param {string} options.pageId
   * @returns {Promise<Object>}
   */
  async getPage(options) {
    const { pageId } = options;
    if (!pageId) throw new ValidationError('pageId is required');

    return await this.http.get(`/pages/${encodeURIComponent(pageId)}`);
  }

  /**
   * List public/server-visible groups.
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>}
   */
  async getGroups(options = {}) {
    const { limit, page } = options;
    const params = {};
    if (limit) params.limit = limit;
    if (page) params.page = page;
    return await this.http.get('/groups', { params });
  }

  /**
   * List all circles visible to the viewer (public + viewer-scoped), sortable.
   * A user's OWN circles are getUserCircles() / GET /users/:id/circles.
   * @param {Object} [options]
   * @param {'date'|'reacts'} [options.sort] - Sort order: 'date' (default) or 'reacts'
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>}
   */
  async getCircles(options = {}) {
    const { sort, page, limit } = options;
    const params = {};
    if (sort) params.sort = sort;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return await this.http.get('/circles', { params });
  }

  /**
   * Get the server's curated Discover shelves. Viewer-aware: authenticated
   * local users get public + server-tier items, everyone else public only.
   * @returns {Promise<Object>} { type, sections: [{ id, name, summary, items }] }
   */
  async getRecommendations() {
    return await this.http.get('/recommendations');
  }

  // ---- Remote Server Browsing ----

  /**
   * List remote Kowloon servers known to this server.
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {'name'|'discoveredAt'} [options.sort] - Default: discoveredAt (newest first)
   * @returns {Promise<Object>} OrderedCollection of server profiles
   */
  async getServers(options = {}) {
    const { page, limit, sort } = options;
    const params = {};
    if (page)  params.page  = page;
    if (limit) params.limit = limit;
    if (sort)  params.sort  = sort;
    return await this.http.get('/servers', { params });
  }

  /**
   * Get the cached profile for a specific remote server, fetching fresh
   * data if the cache is stale.
   * @param {Object} options
   * @param {string} options.domain - Remote server domain (e.g. "kowloon.network")
   * @param {boolean} [options.refresh=false] - Force a fresh fetch regardless of cache age
   * @returns {Promise<Object>} FederatedServer profile including cachedCircles, cachedGroups, cachedPages
   */
  async getServer(options) {
    const { domain, refresh } = options;
    if (!domain) throw new ValidationError('domain is required');
    const params = {};
    if (refresh) params.refresh = 'true';
    return await this.http.get(`/servers/${encodeURIComponent(domain)}`, { params });
  }

  /**
   * Get a single circle by ID (owner-only for user circles)
   * @param {Object} options
   * @param {string} options.circleId
   * @returns {Promise<Object>}
   */
  async getCircle(options) {
    const { circleId } = options;
    if (!circleId) throw new ValidationError('circleId is required');

    return await this.http.get(`/circles/${encodeURIComponent(circleId)}`);
  }

  // ---- Collections ----

  /**
   * Get members of a group
   * @param {Object} options
   * @param {string} options.groupId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getGroupMembers(options) {
    const { groupId, page } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    const params = {};
    if (page) params.page = page;

    return await this.http.get(`/groups/${encodeURIComponent(groupId)}/members`, { params });
  }

  /**
   * Get members of a circle (owner-only)
   * @param {Object} options
   * @param {string} options.circleId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getCircleMembers(options) {
    const { circleId, page } = options;
    if (!circleId) throw new ValidationError('circleId is required');

    const params = {};
    if (page) params.page = page;

    return await this.http.get(`/circles/${encodeURIComponent(circleId)}/members`, { params });
  }

  /**
   * Get circles belonging to a user (owner sees type:"Circle" only; others see none)
   * @param {Object} options
   * @param {string} options.userId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getUserCircles(options) {
    const { userId, page } = options;
    if (!userId) throw new ValidationError('userId is required');

    const params = {};
    if (page) params.page = page;

    return await this.http.get(`/users/${encodeURIComponent(userId)}/circles`, { params });
  }

  /**
   * Get a user's group memberships (groups they belong to). Owner sees all;
   * others see only groups visible to them (@public + server/shared-circle).
   * @param {Object} options
   * @param {string} options.userId
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>}
   */
  async getUserGroups(options) {
    const { userId, page, limit } = options;
    if (!userId) throw new ValidationError('userId is required');

    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;

    return await this.http.get(`/users/${encodeURIComponent(userId)}/groups`, { params });
  }

  /**
   * Get bookmarks belonging to a user
   * @param {Object} options
   * @param {string} options.userId
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async getUserBookmarks(options) {
    const { userId, page, since, type, parentFolder } = options;
    if (!userId) throw new ValidationError('userId is required');

    const params = {};
    if (page) params.page = page;
    if (since) params.since = since;
    if (type) params.type = type;
    if (parentFolder) params.parentFolder = parentFolder;

    return await this.http.get(`/users/${encodeURIComponent(userId)}/bookmarks`, { params });
  }

  /**
   * Get replies to a post
   * @param {Object} options
   * @param {string} options.postId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getReplies(options) {
    const { postId, page } = options;
    if (!postId) throw new ValidationError('postId is required');

    const params = {};
    if (page) params.page = page;

    return await this.http.get(`/posts/${encodeURIComponent(postId)}/replies`, { params });
  }

  /**
   * Get reactions to a post
   * @param {Object} options
   * @param {string} options.postId
   * @param {number} [options.page]
   * @returns {Promise<Object>}
   */
  async getReacts(options) {
    const { postId, page } = options;
    if (!postId) throw new ValidationError('postId is required');

    const params = {};
    if (page) params.page = page;

    return await this.http.get(`/posts/${encodeURIComponent(postId)}/reacts`, { params });
  }

  // ---- Lookup / Search ----

  /**
   * Resolve ANY object by its Kowloon id — local, cached, or fetched fresh from a
   * remote server (hydrated + cached). Works for users, posts, circles, groups.
   * Auth required — the server proxies the outbound fetch. The local→remote
   * counterpart of /resolve. (Servers: use getServer() / GET /servers/:domain.)
   * @param {Object} options
   * @param {string} options.id - e.g. "@bob@kwln2.local", "post:abc@kwln2.local"
   * @returns {Promise<Object>} { item }
   */
  async lookup(options) {
    const { id } = options;
    if (!id) throw new ValidationError('id is required');
    return await this.http.get('/lookup', { params: { id } });
  }

  /** @deprecated Use lookup() — /users/lookup folded into the generic /lookup. */
  async lookupUser(options) {
    return this.lookup(options);
  }

  /**
   * Search local users by name or username fragment.
   * @param {Object} options
   * @param {string} options.q - Search query (2+ chars recommended)
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>} OrderedCollection of matching users
   */
  async searchUsers(options) {
    const { q, page, limit } = options;
    if (!q) throw new ValidationError('q is required');
    const params = { q, searchIn: 'users' };
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return await this.http.get('/search', { params });
  }

  // ---- Files ----

  /**
   * Get file metadata
   * @param {Object} options
   * @param {string} options.fileId - File ID (e.g. 'file:abc123@domain')
   * @returns {Promise<Object>}
   */
  async getFile(options) {
    const { fileId } = options;
    if (!fileId) throw new ValidationError('fileId is required');
    return await this.http.get(`/files/${encodeURIComponent(fileId)}/meta`);
  }
}

export default FeedClient;
