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
   * Get server info and public settings (name, domain, likeEmojis, etc.)
   * @returns {Promise<Object>} { name, domain, settings: { likeEmojis, ... }, ... }
   */
  async getServerInfo() {
    return await this.http.get('/');
  }

  // ---- Content Feeds ----

  /**
   * Get public/visible posts from a server
   * @param {Object} options
   * @param {string} options.serverId - Server ID or domain
   * @param {string} [options.type] - Post type filter (Note, Article, etc.)
   * @param {number} [options.page] - Page number
   * @param {string} [options.since] - ISO date cursor
   * @returns {Promise<Object>}
   */
  async getServerPosts(options = {}) {
    const { serverId, type, page, since } = options;

    const params = {};
    if (serverId) params.serverId = serverId;
    if (type) params.type = type;
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
  async getCirclePosts(options) {
    const { circleId, types, type, since, limit } = options;

    if (!circleId) throw new ValidationError('circleId is required');

    const params = {};
    // Accept types (array), type (string), or neither
    const typeList = types ?? (type ? [type] : null);
    if (typeList?.length) params.types = typeList.join(',');
    if (since) params.since = since;
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

    return await this.http.get(`/users/${encodeURIComponent(userId)}`);
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
   * Browse public/server-visible groups with sorting.
   * @param {Object} [options]
   * @param {'date'|'popular'} [options.sort] - Sort order: 'date' (default) or 'popular'
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

  async browseGroups(options = {}) {
    const { sort, page, limit } = options;
    const params = {};
    if (sort === 'popular') params.sort = 'popular';
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return await this.http.get('/groups/browse', { params });
  }

  /**
   * Browse public/server-visible circles with sorting.
   * @param {Object} [options]
   * @param {'date'|'reacts'} [options.sort] - Sort order: 'date' (default) or 'reacts'
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>}
   */
  async browseCircles(options = {}) {
    const { sort, page, limit } = options;
    const params = {};
    if (sort === 'reacts') params.sort = 'reacts';
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return await this.http.get('/circles/browse', { params });
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
