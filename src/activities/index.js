// Activities module for Kowloon client
// Handles creating posts, replies, reacts, circles, groups, bookmarks, pages, user actions, and file uploads

import { ValidationError } from '../utils/errors.js';

/**
 * Activities client — all methods post to /outbox as Activities
 */
export class ActivitiesClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  // ---- Posts ----

  /**
   * Create a post
   * @param {Object} options
   * @param {string} options.type - Post type (Note, Article, Link, Media, Event)
   * @param {string} options.to - Audience (@public, @domain, circle:id, group:id, or actorId)
   * @param {string} options.canReply - Who can reply
   * @param {string} options.canReact - Who can react
   * @param {string} options.body - Post content
   * @param {string} [options.title] - Post title (for non-Note types)
   * @param {string[]} [options.tags] - Tags
   * @param {Object} [options.location] - GeoPoint object
   * @param {string} [options.startTime] - ISO date (for Event type)
   * @param {string} [options.endTime] - ISO date (for Event type)
   * @param {Object[]} [options.attachments] - Array of { fileId, title?, alt?, description?, metadata? }
   * @param {string} [options.featuredImage] - File ID for featured image
   * @returns {Promise<Object>}
   */
  async createPost(options) {
    const { type = 'Note', to, canReply, canReact, body, title, tags, location, startTime, endTime, attachments, featuredImage } = options;

    if (!body || typeof body !== 'string') {
      throw new ValidationError('Post body is required');
    }

    const object = { type, content: body };
    if (title && type !== 'Note') object.title = title;
    if (tags) object.tags = tags;
    if (location) object.location = location;
    if (startTime) object.startTime = startTime;
    if (endTime) object.endTime = endTime;
    if (attachments) object.attachments = attachments;
    if (featuredImage) object.featuredImage = featuredImage;

    const activity = { type: 'Create', objectType: 'Post', object };
    if (to) activity.to = to;
    if (canReply) activity.canReply = canReply;
    if (canReact) activity.canReact = canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Update a post
   * @param {Object} options
   * @param {string} options.postId - Post ID to update
   * @param {string} [options.to] [options.canReply] [options.canReact] [options.body] [options.title]
   * @param {string[]} [options.tags] [options.location] [options.startTime] [options.endTime]
   * @param {Object[]} [options.attachments] [options.featuredImage]
   * @returns {Promise<Object>}
   */
  async updatePost(options) {
    const { postId, ...updates } = options;

    if (!postId) throw new ValidationError('postId is required to update post');

    const object = {};
    if (updates.body !== undefined) object.content = updates.body;
    if (updates.title !== undefined) object.title = updates.title;
    if (updates.tags !== undefined) object.tags = updates.tags;
    if (updates.location !== undefined) object.location = updates.location;
    if (updates.startTime !== undefined) object.startTime = updates.startTime;
    if (updates.endTime !== undefined) object.endTime = updates.endTime;
    if (updates.attachments !== undefined) object.attachments = updates.attachments;
    if (updates.featuredImage !== undefined) object.featuredImage = updates.featuredImage;

    const activity = { type: 'Update', objectType: 'Post', target: postId, object };
    if (updates.to !== undefined) activity.to = updates.to;
    if (updates.canReply !== undefined) activity.canReply = updates.canReply;
    if (updates.canReact !== undefined) activity.canReact = updates.canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Delete a post
   * @param {Object} options
   * @param {string} options.postId
   * @returns {Promise<Object>}
   */
  async deletePost(options) {
    const { postId } = options;
    if (!postId) throw new ValidationError('postId is required to delete post');

    return await this.http.post('/outbox', { type: 'Delete', objectType: 'Post', target: postId });
  }

  // ---- Replies & Reactions ----

  /**
   * Reply to a post or page
   * @param {Object} options
   * @param {string} options.toItemId - ID of the item to reply to
   * @param {string} options.body - Reply content
   * @param {Object[]} [options.attachments]
   * @returns {Promise<Object>}
   */
  async createReply(options) {
    const { toItemId, body, attachments } = options;

    if (!toItemId) throw new ValidationError('toItemId is required for replies');
    if (!body || typeof body !== 'string') throw new ValidationError('Reply body is required');

    const object = { type: 'Reply', content: body };
    if (attachments) object.attachments = attachments;

    return await this.http.post('/outbox', {
      type: 'Reply',
      objectType: 'Reply',
      to: toItemId,
      object,
    });
  }

  /**
   * React to an object
   * @param {Object} options
   * @param {string} options.targetId - ID of the object to react to
   * @param {string} options.reaction - Emoji string
   * @returns {Promise<Object>}
   */
  async react(options) {
    const { targetId, reaction } = options;

    if (!targetId) throw new ValidationError('targetId is required for reactions');
    if (!reaction || typeof reaction !== 'string') throw new ValidationError('reaction is required');

    return await this.http.post('/outbox', {
      type: 'React',
      objectType: 'React',
      to: targetId,
      object: { type: 'React', content: reaction },
    });
  }

  /**
   * Remove a reaction
   * @param {Object} options
   * @param {string} options.reactId
   * @returns {Promise<Object>}
   */
  async deleteReact(options) {
    const { reactId } = options;
    if (!reactId) throw new ValidationError('reactId is required to remove reaction');

    return await this.http.post('/outbox', { type: 'Undo', objectType: 'React', target: reactId });
  }

  // ---- Generic Activity ----

  /**
   * Create a generic activity (escape hatch)
   * @param {Object} options
   * @param {Object} options.activity - Activity object sent directly to outbox
   * @returns {Promise<Object>}
   */
  async createActivity(options) {
    const { activity } = options;
    if (!activity || typeof activity !== 'object') throw new ValidationError('activity object is required');

    return await this.http.post('/outbox', activity);
  }

  // ---- Circles ----

  /**
   * Create a circle
   * @param {Object} options
   * @param {string} options.name
   * @param {string} [options.description]
   * @param {string} [options.icon]
   * @param {string} [options.to]
   * @returns {Promise<Object>}
   */
  async createCircle(options) {
    const { name, description, icon, to } = options;
    if (!name || typeof name !== 'string') throw new ValidationError('Circle name is required');

    const activity = {
      type: 'Create',
      objectType: 'Circle',
      object: { type: 'Circle', name, summary: description || '' },
    };
    if (icon) activity.object.icon = icon;
    if (to) activity.to = to;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Update a circle
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string} [options.name] [options.description] [options.icon] [options.to]
   * @returns {Promise<Object>}
   */
  async updateCircle(options) {
    const { circleId, name, description, icon, to } = options;
    if (!circleId) throw new ValidationError('circleId is required');

    const object = {};
    if (name !== undefined) object.name = name;
    if (description !== undefined) object.summary = description;
    if (icon !== undefined) object.icon = icon;

    const activity = { type: 'Update', objectType: 'Circle', target: circleId, object };
    if (to !== undefined) activity.to = to;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Delete a circle
   * @param {Object} options
   * @param {string} options.circleId
   * @returns {Promise<Object>}
   */
  async deleteCircle(options) {
    const { circleId } = options;
    if (!circleId) throw new ValidationError('circleId is required to delete circle');

    return await this.http.post('/outbox', { type: 'Delete', objectType: 'Circle', target: circleId });
  }

  /**
   * Add a member to a circle
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string} options.memberId - @user@domain or server actorId
   * @returns {Promise<Object>}
   */
  async addToCircle(options) {
    const { circleId, memberId } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    if (!memberId) throw new ValidationError('memberId is required');

    return await this.http.post('/outbox', {
      type: 'Add',
      objectType: 'Circle',
      target: circleId,
      object: memberId,
    });
  }

  /**
   * Remove a member from a circle
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string} options.memberId
   * @returns {Promise<Object>}
   */
  async removeFromCircle(options) {
    const { circleId, memberId } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    if (!memberId) throw new ValidationError('memberId is required');

    return await this.http.post('/outbox', {
      type: 'Remove',
      objectType: 'Circle',
      target: circleId,
      object: memberId,
    });
  }

  // ---- Groups ----

  /**
   * Create a group
   * @param {Object} options
   * @param {string} options.name
   * @param {string} [options.description]
   * @param {Object} [options.location]
   * @param {string} [options.icon]
   * @param {string} [options.to]
   * @param {string} [options.membershipPolicy] - open, serverOpen, serverApproval, approvalOnly
   * @returns {Promise<Object>}
   */
  async createGroup(options) {
    const { name, description, location, icon, to, membershipPolicy } = options;
    if (!name || typeof name !== 'string') throw new ValidationError('Group name is required');

    const object = { type: 'Group', name, description: description || '' };
    if (location) object.location = location;
    if (icon) object.icon = icon;
    if (membershipPolicy) object.rsvpPolicy = membershipPolicy;

    const activity = { type: 'Create', objectType: 'Group', object };
    if (to) activity.to = to;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Update a group
   * @param {Object} options
   * @param {string} options.groupId
   * @param {string} [options.name] [options.description] [options.location] [options.icon] [options.to] [options.membershipPolicy]
   * @returns {Promise<Object>}
   */
  async updateGroup(options) {
    const { groupId, name, description, location, icon, to, membershipPolicy } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    const object = {};
    if (name !== undefined) object.name = name;
    if (description !== undefined) object.description = description;
    if (location !== undefined) object.location = location;
    if (icon !== undefined) object.icon = icon;
    if (membershipPolicy !== undefined) object.rsvpPolicy = membershipPolicy;

    const activity = { type: 'Update', objectType: 'Group', target: groupId, object };
    if (to !== undefined) activity.to = to;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Delete a group
   * @param {Object} options
   * @param {string} options.groupId
   * @returns {Promise<Object>}
   */
  async deleteGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    return await this.http.post('/outbox', { type: 'Delete', objectType: 'Group', target: groupId });
  }

  /**
   * Join a group (or request to join if approval required)
   * @param {Object} options
   * @param {string} options.groupId
   * @returns {Promise<Object>}
   */
  async joinGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    return await this.http.post('/outbox', { type: 'Join', objectType: 'Group', target: groupId });
  }

  /**
   * Leave a group
   * @param {Object} options
   * @param {string} options.groupId
   * @returns {Promise<Object>}
   */
  async leaveGroup(options) {
    const { groupId } = options;
    if (!groupId) throw new ValidationError('groupId is required');

    return await this.http.post('/outbox', { type: 'Leave', objectType: 'Group', target: groupId });
  }

  /**
   * Approve a join request
   * @param {Object} options
   * @param {string} options.groupId
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async approveJoinRequest(options) {
    const { groupId, userId } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    if (!userId) throw new ValidationError('userId is required');

    return await this.http.post('/outbox', { type: 'Add', to: groupId, object: userId });
  }

  /**
   * Reject a join request
   * @param {Object} options
   * @param {string} options.groupId
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async rejectJoinRequest(options) {
    const { groupId, userId } = options;
    if (!groupId) throw new ValidationError('groupId is required');
    if (!userId) throw new ValidationError('userId is required');

    return await this.http.post('/outbox', { type: 'Reject', to: groupId, object: userId });
  }

  // ---- Bookmarks ----

  /**
   * Create a bookmark or folder
   * @param {Object} options
   * @param {string} options.type - "Bookmark" or "Folder"
   * @param {string} [options.href] - URL (required for Bookmark)
   * @param {string} options.title
   * @param {string} [options.parentId] - Parent folder ID
   * @param {string} options.to - Audience
   * @param {string} options.canReact
   * @param {string} [options.body] [options.icon] [options.featuredImage]
   * @returns {Promise<Object>}
   */
  async createBookmark(options) {
    const { type = 'Bookmark', href, title, parentId, to, canReact, body, icon, featuredImage } = options;

    if (!title) throw new ValidationError('Bookmark title is required');
    if (type === 'Bookmark' && !href) throw new ValidationError('href is required for Bookmarks');

    const object = { type, title };
    if (href) object.href = href;
    if (parentId) object.parentId = parentId;
    if (body) object.content = body;
    if (icon) object.icon = icon;
    if (featuredImage) object.featuredImage = featuredImage;

    const activity = { type: 'Create', objectType: 'Bookmark', object };
    if (to) activity.to = to;
    if (canReact) activity.canReact = canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Update a bookmark
   * @param {Object} options
   * @param {string} options.bookmarkId
   * @returns {Promise<Object>}
   */
  async updateBookmark(options) {
    const { bookmarkId, ...updates } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');

    const object = {};
    if (updates.type !== undefined) object.type = updates.type;
    if (updates.href !== undefined) object.href = updates.href;
    if (updates.title !== undefined) object.title = updates.title;
    if (updates.parentId !== undefined) object.parentId = updates.parentId;
    if (updates.body !== undefined) object.content = updates.body;
    if (updates.icon !== undefined) object.icon = updates.icon;
    if (updates.featuredImage !== undefined) object.featuredImage = updates.featuredImage;

    const activity = { type: 'Update', objectType: 'Bookmark', target: bookmarkId, object };
    if (updates.to !== undefined) activity.to = updates.to;
    if (updates.canReact !== undefined) activity.canReact = updates.canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Delete a bookmark
   * @param {Object} options
   * @param {string} options.bookmarkId
   * @returns {Promise<Object>}
   */
  async deleteBookmark(options) {
    const { bookmarkId } = options;
    if (!bookmarkId) throw new ValidationError('bookmarkId is required');

    return await this.http.post('/outbox', { type: 'Delete', objectType: 'Bookmark', target: bookmarkId });
  }

  // ---- Pages ----

  /**
   * Create a page or folder
   * @param {Object} options
   * @param {string} options.type - "Page" or "Folder"
   * @param {string} options.title
   * @param {string} options.body - Page content
   * @param {string} options.to
   * @param {string} options.canReply
   * @param {string} options.canReact
   * @param {string} [options.parentId]
   * @param {string} [options.featuredImage]
   * @param {string[]} [options.tags]
   * @param {Object[]} [options.attachments]
   * @returns {Promise<Object>}
   */
  async createPage(options) {
    const { type = 'Page', title, body, to, canReply, canReact, parentId, featuredImage, tags, attachments } = options;

    if (!title) throw new ValidationError('Page title is required');
    if (type === 'Page' && (!body || typeof body !== 'string')) throw new ValidationError('Page body is required');

    const object = { type, title, content: body || '' };
    if (parentId) object.parentId = parentId;
    if (featuredImage) object.featuredImage = featuredImage;
    if (tags) object.tags = tags;
    if (attachments) object.attachments = attachments;

    const activity = { type: 'Create', objectType: 'Page', object };
    if (to) activity.to = to;
    if (canReply) activity.canReply = canReply;
    if (canReact) activity.canReact = canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Update a page
   * @param {Object} options
   * @param {string} options.pageId
   * @returns {Promise<Object>}
   */
  async updatePage(options) {
    const { pageId, ...updates } = options;
    if (!pageId) throw new ValidationError('pageId is required');

    const object = {};
    if (updates.title !== undefined) object.title = updates.title;
    if (updates.body !== undefined) object.content = updates.body;
    if (updates.parentId !== undefined) object.parentId = updates.parentId;
    if (updates.featuredImage !== undefined) object.featuredImage = updates.featuredImage;
    if (updates.tags !== undefined) object.tags = updates.tags;
    if (updates.attachments !== undefined) object.attachments = updates.attachments;

    const activity = { type: 'Update', objectType: 'Page', target: pageId, object };
    if (updates.to !== undefined) activity.to = updates.to;
    if (updates.canReply !== undefined) activity.canReply = updates.canReply;
    if (updates.canReact !== undefined) activity.canReact = updates.canReact;

    return await this.http.post('/outbox', activity);
  }

  /**
   * Delete a page
   * @param {Object} options
   * @param {string} options.pageId
   * @returns {Promise<Object>}
   */
  async deletePage(options) {
    const { pageId } = options;
    if (!pageId) throw new ValidationError('pageId is required');

    return await this.http.post('/outbox', { type: 'Delete', objectType: 'Page', target: pageId });
  }

  // ---- User Actions ----

  /**
   * Update the current user's profile
   * @param {Object} options
   * @param {Object} options.updates - Fields to update (email, profile, prefs, etc.)
   * @returns {Promise<Object>}
   */
  async updateProfile(options) {
    const { updates } = options;
    if (!updates || typeof updates !== 'object') throw new ValidationError('updates object is required');

    return await this.http.post('/outbox', {
      type: 'Update',
      objectType: 'User',
      object: updates,
    });
  }

  /**
   * Block a user or server
   * @param {Object} options
   * @param {string} options.actorId
   * @returns {Promise<Object>}
   */
  async block(options) {
    const { actorId } = options;
    if (!actorId) throw new ValidationError('actorId is required');

    return await this.http.post('/outbox', { type: 'Block', objectType: 'User', target: actorId });
  }

  /**
   * Unblock a user or server
   * @param {Object} options
   * @param {string} options.actorId
   * @returns {Promise<Object>}
   */
  async unblock(options) {
    const { actorId } = options;
    if (!actorId) throw new ValidationError('actorId is required');

    return await this.http.post('/outbox', { type: 'Unblock', objectType: 'User', target: actorId });
  }

  /**
   * Mute a user or server
   * @param {Object} options
   * @param {string} options.actorId
   * @returns {Promise<Object>}
   */
  async mute(options) {
    const { actorId } = options;
    if (!actorId) throw new ValidationError('actorId is required');

    return await this.http.post('/outbox', { type: 'Mute', objectType: 'User', target: actorId });
  }

  /**
   * Unmute a user or server
   * @param {Object} options
   * @param {string} options.actorId
   * @returns {Promise<Object>}
   */
  async unmute(options) {
    const { actorId } = options;
    if (!actorId) throw new ValidationError('actorId is required');

    return await this.http.post('/outbox', { type: 'Unmute', objectType: 'User', target: actorId });
  }

  /**
   * Flag content for moderation
   * @param {Object} options
   * @param {string} options.itemId - ID of content to flag
   * @param {string} options.reason - Reason string
   * @returns {Promise<Object>}
   */
  async flag(options) {
    const { itemId, reason } = options;
    if (!itemId) throw new ValidationError('itemId is required');
    if (!reason || typeof reason !== 'string') throw new ValidationError('reason is required');

    return await this.http.post('/outbox', {
      type: 'Flag',
      target: itemId,
      object: { reason: reason.trim() },
    });
  }

  // ---- Files ----

  /**
   * Upload a file
   * @param {Object} options
   * @param {Buffer|Blob|ReadableStream} options.file - File data
   * @param {string} [options.filename] - Original filename
   * @param {string} [options.contentType] - MIME type
   * @param {string} [options.title] - Display name
   * @param {string} [options.summary] - Alt text / description
   * @returns {Promise<Object>} { file: { id, url, thumbnails, metadata } }
   */
  async upload(options) {
    const { file, filename, contentType, title, summary } = options;

    if (!file) throw new ValidationError('file is required for upload');

    const formData = new FormData();

    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      formData.append('file', file, filename);
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file)) {
      formData.append('file', new Blob([file], { type: contentType }), filename);
    } else {
      formData.append('file', file, filename);
    }

    if (title) formData.append('title', title);
    if (summary) formData.append('summary', summary);

    const token = await this.http.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = this.http._buildUrl('/files/upload');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  }
}

export default ActivitiesClient;
