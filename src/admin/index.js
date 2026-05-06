// Admin module for Kowloon client
// Separate import: import { AdminClient } from 'kowloon-client/admin'
// Requires server admin or moderator role.

import { ValidationError } from '../utils/errors.js';

/**
 * Admin client — all methods hit /admin/* endpoints
 * Bypasses normal visibility, can optionally include soft-deleted items.
 */
export class AdminClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Build standard list params
   * @private
   */
  _listParams({ page, since, showDeleted, type } = {}) {
    const params = {};
    if (page) params.page = page;
    if (since) params.since = since;
    if (showDeleted) params.deleted = 'true';
    if (type) params.type = type;
    return params;
  }

  // ---- Activities ----

  async getActivities(options = {}) {
    return await this.http.get('/admin/activities', { params: this._listParams(options) });
  }

  async getActivity(options) {
    const { activityId } = options;
    if (!activityId) throw new ValidationError('activityId is required');
    return await this.http.get(`/admin/activities/${encodeURIComponent(activityId)}`);
  }

  async updateActivity(options) {
    const { activityId, updates } = options;
    if (!activityId) throw new ValidationError('activityId is required');
    return await this.http.patch(`/admin/activities/${encodeURIComponent(activityId)}`, updates);
  }

  async deleteActivity(options) {
    const { activityId, fullDelete } = options;
    if (!activityId) throw new ValidationError('activityId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/activities/${encodeURIComponent(activityId)}`, { params });
  }

  // ---- Users ----

  async getUsers(options = {}) {
    return await this.http.get('/admin/users', { params: this._listParams(options) });
  }

  async getUser(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');
    return await this.http.get(`/admin/users/${encodeURIComponent(userId)}`);
  }

  async updateUser(options) {
    const { userId, updates } = options;
    if (!userId) throw new ValidationError('userId is required');
    return await this.http.patch(`/admin/users/${encodeURIComponent(userId)}`, updates);
  }

  async deleteUser(options) {
    const { userId, fullDelete } = options;
    if (!userId) throw new ValidationError('userId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/users/${encodeURIComponent(userId)}`, { params });
  }

  async restoreUser(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');
    return await this.http.post(`/admin/users/${encodeURIComponent(userId)}/restore`);
  }

  // ---- Circles ----

  async getCircles(options = {}) {
    return await this.http.get('/admin/circles', { params: this._listParams(options) });
  }

  async getCircle(options) {
    const { circleId } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    return await this.http.get(`/admin/circles/${encodeURIComponent(circleId)}`);
  }

  async updateCircle(options) {
    const { circleId, updates } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    return await this.http.patch(`/admin/circles/${encodeURIComponent(circleId)}`, updates);
  }

  async deleteCircle(options) {
    const { circleId, fullDelete } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/circles/${encodeURIComponent(circleId)}`, { params });
  }

  // ---- Groups ----

  async getGroups(options = {}) {
    return await this.http.get('/admin/groups', { params: this._listParams(options) });
  }

  async getGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    return await this.http.get(`/admin/groups/${encodeURIComponent(groupId)}`);
  }

  async updateGroup(options) {
    const { groupId, updates } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    return await this.http.patch(`/admin/groups/${encodeURIComponent(groupId)}`, updates);
  }

  async deleteGroup(options) {
    const { groupId, fullDelete } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/groups/${encodeURIComponent(groupId)}`, { params });
  }

  async restoreGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    return await this.http.post(`/admin/groups/${encodeURIComponent(groupId)}/restore`);
  }

  // ---- Posts ----

  async getPosts(options = {}) {
    return await this.http.get('/admin/posts', { params: this._listParams(options) });
  }

  async getPost(options) {
    const { postId } = options;
    if (!postId) throw new ValidationError('postId is required');
    return await this.http.get(`/admin/posts/${encodeURIComponent(postId)}`);
  }

  async updatePost(options) {
    const { postId, updates } = options;
    if (!postId) throw new ValidationError('postId is required');
    return await this.http.patch(`/admin/posts/${encodeURIComponent(postId)}`, updates);
  }

  async deletePost(options) {
    const { postId, fullDelete } = options;
    if (!postId) throw new ValidationError('postId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/posts/${encodeURIComponent(postId)}`, { params });
  }

  async restorePost(options) {
    const { postId } = options;
    if (!postId) throw new ValidationError('postId is required');
    return await this.http.post(`/admin/posts/${encodeURIComponent(postId)}/restore`);
  }

  // ---- Bookmarks ----

  async getBookmarks(options = {}) {
    return await this.http.get('/admin/bookmarks', { params: this._listParams(options) });
  }

  async getBookmark(options) {
    const { bookmarkId } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');
    return await this.http.get(`/admin/bookmarks/${encodeURIComponent(bookmarkId)}`);
  }

  async updateBookmark(options) {
    const { bookmarkId, updates } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');
    return await this.http.patch(`/admin/bookmarks/${encodeURIComponent(bookmarkId)}`, updates);
  }

  async deleteBookmark(options) {
    const { bookmarkId, fullDelete } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/bookmarks/${encodeURIComponent(bookmarkId)}`, { params });
  }

  // ---- Pages ----

  async getPages(options = {}) {
    return await this.http.get('/admin/pages', { params: this._listParams(options) });
  }

  async getPage(options) {
    const { pageId } = options;
    if (!pageId) throw new ValidationError('pageId is required');
    return await this.http.get(`/admin/pages/${encodeURIComponent(pageId)}`);
  }

  async updatePage(options) {
    const { pageId, updates } = options;
    if (!pageId) throw new ValidationError('pageId is required');
    return await this.http.patch(`/admin/pages/${encodeURIComponent(pageId)}`, updates);
  }

  async createPage(options = {}) {
    const { title, slug, type, summary, source, to, canReply, canReact, order, parentId, href, tags } = options;
    if (!title) throw new ValidationError('title is required');
    const body = { title };
    if (slug) body.slug = slug;
    if (type) body.type = type;
    if (summary) body.summary = summary;
    if (source) body.source = source;
    if (to) body.to = to;
    if (canReply) body.canReply = canReply;
    if (canReact) body.canReact = canReact;
    if (order !== undefined) body.order = order;
    if (parentId) body.parentId = parentId;
    if (href) body.href = href;
    if (tags) body.tags = tags;
    if ('image' in options) body.image = options.image;
    return await this.http.post('/admin/pages', body);
  }

  async deletePage(options) {
    const { pageId, fullDelete } = options;
    if (!pageId) throw new ValidationError('pageId is required');
    const params = {};
    if (fullDelete) params.fullDelete = 'true';
    return await this.http.delete(`/admin/pages/${encodeURIComponent(pageId)}`, { params });
  }

  async restorePage(options) {
    const { pageId } = options;
    if (!pageId) throw new ValidationError('pageId is required');
    return await this.http.post(`/admin/pages/${encodeURIComponent(pageId)}/restore`);
  }

  // ---- Invites ----

  async createInvite(options = {}) {
    const { type, recipient, amount, expiresAt } = options;

    const body = {};
    if (type) body.type = type;
    if (recipient) body.recipient = recipient;
    if (amount) body.amount = amount;
    if (expiresAt) body.expiresAt = expiresAt;

    return await this.http.post('/admin/invites', body);
  }

  async getInvites(options = {}) {
    const { page, type, redeemed, since } = options;

    const params = {};
    if (page) params.page = page;
    if (type) params.type = type;
    if (redeemed !== undefined) params.redeemed = String(redeemed);
    if (since) params.since = since;

    return await this.http.get('/admin/invites', { params });
  }

  async deleteInvite(options) {
    const { inviteId } = options;
    if (!inviteId) throw new ValidationError('inviteId is required');
    return await this.http.delete(`/admin/invites/${encodeURIComponent(inviteId)}`);
  }

  // ---- Moderation ----

  async getFlagged(options = {}) {
    return await this.http.get('/admin/flagged', { params: this._listParams(options) });
  }

  async getFlag(options) {
    const { flagId } = options;
    if (!flagId) throw new ValidationError('flagId is required');
    return await this.http.get(`/admin/flagged/${encodeURIComponent(flagId)}`);
  }

  async resolveFlag(options) {
    const { flagId, status, notes } = options;
    if (!flagId) throw new ValidationError('flagId is required');
    if (!['resolved', 'dismissed'].includes(status)) throw new ValidationError("status must be 'resolved' or 'dismissed'");
    return await this.http.patch(`/admin/flagged/${encodeURIComponent(flagId)}`, { status, notes });
  }

  // ---- Settings ----

  async getSettings(options = {}) {
    const params = {};
    if (options.page) params.page = options.page;
    return await this.http.get('/admin/settings', { params });
  }

  async getSetting(options) {
    const { settingId } = options;
    if (!settingId) throw new ValidationError('settingId is required');
    return await this.http.get(`/admin/settings/${encodeURIComponent(settingId)}`);
  }

  async updateSetting(options) {
    const { settingId, value } = options;
    if (!settingId) throw new ValidationError('settingId is required');
    return await this.http.patch(`/admin/settings/${encodeURIComponent(settingId)}`, { value });
  }

  async deleteSetting(options) {
    const { settingId } = options;
    if (!settingId) throw new ValidationError('settingId is required');
    return await this.http.delete(`/admin/settings/${encodeURIComponent(settingId)}`);
  }

  // ---- Server Management ----

  async restartServer() {
    return await this.http.post('/admin/server/restart');
  }

  async serverStats() {
    return await this.http.get('/admin/system');
  }

  async adminSearch(options) {
    const { query, page, since, showDeleted, searchIn } = options;
    if (!query) throw new ValidationError('query is required');

    const params = { q: query };
    if (page) params.page = page;
    if (since) params.since = since;
    if (showDeleted) params.deleted = 'true';
    if (searchIn) {
      const types = Object.entries(searchIn)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (types.length > 0) params.searchIn = types.join(',');
    }

    return await this.http.get('/admin/search', { params });
  }
}

export default AdminClient;
