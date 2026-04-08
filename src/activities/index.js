// Activities module for Kowloon client
// Handles creating posts, replies, reacts, circles, groups, bookmarks, pages, user actions, and file uploads

import { ValidationError } from '../utils/errors.js';

/**
 * Activities client — all methods post to /outbox as Activities
 */
export class ActivitiesClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   * @param {FilesClient} files - Files client instance (for upload delegation)
   */
  constructor(http, files, auth) {
    this.http = http;
    this.files = files;
    this.auth = auth;
  }

  /**
   * Build an actor object from the currently authenticated user.
   * Included in outgoing activities so the server never needs to look it up.
   * @private
   */
  _actorFromUser() {
    const u = this.auth?.getUser?.();
    if (!u?.id) return undefined;
    // Derive server (@domain) and URLs from the actor ID (@user@domain)
    const domain = u.id.replace(/^@/, '').split('@')[1] ?? '';
    const baseUrl = domain ? `https://${domain}` : '';
    const userPath = `${baseUrl}/users/${encodeURIComponent(u.id)}`;
    return {
      id: u.id,
      type: u.type ?? 'Person',
      name: u.profile?.name ?? u.username,
      icon: u.profile?.icon ?? null,
      url: u.url ?? `${baseUrl}/users/${encodeURIComponent(u.id)}`,
      inbox: u.inbox ?? `${userPath}/inbox`,
      outbox: u.outbox ?? `${userPath}/outbox`,
      server: u.server ?? (domain ? `@${domain}` : null),
    };
  }

  /**
   * Post an activity to /outbox, automatically injecting actor if not already set.
   * All write operations should use this instead of http.post('/outbox', ...) directly.
   * @private
   */
  _post(activity) {
    const actor = this._actorFromUser();
    const enriched = (actor && !activity.actor) ? { ...activity, actor } : activity;
    return this.http.post('/outbox', enriched);
  }

  // ---- Posts ----

  /**
   * Create a post
   * @param {Object} options
   * @param {string} options.type - Post type (Note, Article, Link, Media, Event)
   * @param {string} options.to - Audience (@public, @domain, circle:id, group:id, or actorId)
   * @param {string} options.canReply - Who can reply
   * @param {string} options.canReact - Who can react
   * @param {string} options.content - Post content
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
    const {
      type = 'Note', to, canReply, canReact,
      content, source,          // accept both; content takes precedence
      title, name,              // accept both; title takes precedence
      href, url,                // accept both; href takes precedence (for Link type)
      tags, tag,                // accept both; tags takes precedence
      location, startTime, endTime, attachments, featuredImage,
      target,    // ID of the post being shared (for Link-type shares)
    } = options;

    const body  = content ?? source ?? '';
    const label = title ?? name;
    const link  = href ?? url;

    // Normalize tags: accept strings or ActivityStreams Hashtag objects
    const rawTags = tags ?? tag;
    const tagsValue = rawTags?.length
      ? rawTags.map((t) => {
          if (typeof t === 'string') return t.replace(/^#+/, '');
          if (t?.name) return String(t.name).replace(/^#+/, '');
          return String(t);
        })
      : undefined;

    // Notes always require content; other types may have title/date/attachments only
    if (type === 'Note' && !body) {
      throw new ValidationError('content is required for Note posts');
    }

    const object = { type };
    if (body) object.content = body;
    if (label && type !== 'Note') object.title = label;
    if (link) object.href = link;
    if (tagsValue) object.tags = tagsValue;
    if (location) object.location = location;
    if (startTime) object.startTime = startTime;
    if (endTime) object.endTime = endTime;
    if (attachments) object.attachments = attachments;
    if (featuredImage) object.featuredImage = featuredImage;
    if (target) object.target = target;

    const activity = { type: 'Create', objectType: 'Post', object };
    if (to) activity.to = to;
    if (canReply) activity.canReply = canReply;
    if (canReact) activity.canReact = canReact;

    return await this._post(activity);
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
  async updatePost(options, legacyUpdates) {
    // Accept either updatePost({ postId, updates }) or updatePost(postId, updates)
    const postId  = typeof options === 'string' ? options : options.postId;
    const updates = typeof options === 'string' ? legacyUpdates : (options.updates ?? options);

    if (!postId) throw new ValidationError('postId is required');

    const patch = updates || {};
    const object = {};
    if (patch.content !== undefined) object.source = { content: patch.content };
    if (patch.title !== undefined) object.title = patch.title;
    if (patch.tags !== undefined) object.tags = patch.tags;
    if (patch.location !== undefined) object.location = patch.location;
    if (patch.startTime !== undefined) object.startTime = patch.startTime;
    if (patch.endTime !== undefined) object.endTime = patch.endTime;
    if (patch.attachments !== undefined) object.attachments = patch.attachments;
    if (patch.featuredImage !== undefined) object.featuredImage = patch.featuredImage;

    if (patch.to !== undefined) object.to = patch.to;
    if (patch.canReply !== undefined) object.canReply = patch.canReply;
    if (patch.canReact !== undefined) object.canReact = patch.canReact;

    return await this._post({ type: 'Update', objectType: 'Post', target: postId, object });
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

    return await this._post({ type: 'Delete', objectType: 'Post', target: postId });
  }

  // ---- Replies & Reactions ----

  /**
   * Reply to a post or page
   * @param {Object} options
   * @param {string} options.postId - ID of the item to reply to
   * @param {string} options.content - Reply content
   * @param {Object[]} [options.attachments]
   * @returns {Promise<Object>}
   */
  async reply(options) {
    const { postId, content, attachments } = options;

    if (!postId) throw new ValidationError('postId is required');
    if (!content || typeof content !== 'string') throw new ValidationError('content is required');

    const object = { type: 'Reply', content };
    if (attachments) object.attachments = attachments;

    return await this._post({
      type: 'Reply',
      objectType: 'Reply',
      to: postId,
      object,
    });
  }

  /** Alias for reply() */
  async createReply(options) {
    // Support legacy { toItemId, body } shape
    const normalized = {
      postId: options.postId || options.toItemId,
      content: options.content || options.body,
      attachments: options.attachments,
    };
    return this.reply(normalized);
  }

  /**
   * React to an object
   * @param {Object} options
   * @param {string} options.postId - ID of the object to react to
   * @param {string} options.emoji - Emoji character (e.g. '👍')
   * @param {string} [options.name] - Emoji name (e.g. 'thumbsup'); derived from emoji if omitted
   * @returns {Promise<Object>}
   */
  async react(options) {
    const { postId, emoji, name } = options;

    if (!postId) throw new ValidationError('postId is required');
    if (!emoji || typeof emoji !== 'string') throw new ValidationError('emoji is required');

    return await this._post({
      type: 'React',
      objectType: 'React',
      to: postId,
      object: { type: 'React', emoji, name: name || emoji },
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

    return await this._post({ type: 'Undo', objectType: 'React', target: reactId });
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

    return await this._post(activity);
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

    return await this._post(activity);
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

    return await this._post(activity);
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

    return await this._post({ type: 'Delete', objectType: 'Circle', target: circleId });
  }

  /**
   * Add a member to a circle
   * @param {Object} options
   * @param {string} options.circleId
   * @param {string} options.memberId - @user@domain or server actorId
   * @returns {Promise<Object>}
   */
  async addToCircle(options) {
    const { circleId, memberId, userId } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    const member = memberId || userId;
    if (!member) throw new ValidationError('memberId is required');

    return await this._post({
      type: 'Add',
      objectType: 'Circle',
      target: circleId,
      object: member,
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
    const { circleId, memberId, userId } = options;
    if (!circleId) throw new ValidationError('circleId is required');
    const member = memberId || userId;
    if (!member) throw new ValidationError('memberId is required');

    return await this._post({
      type: 'Remove',
      objectType: 'Circle',
      target: circleId,
      object: member,
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
    const { name, description, location, icon, to, membershipPolicy, rsvpPolicy } = options;
    if (!name || typeof name !== 'string') throw new ValidationError('Group name is required');

    const object = { type: 'Group', name, description: description || '' };
    if (location) object.location = location;
    if (icon) object.icon = icon;
    const policy = rsvpPolicy || membershipPolicy;
    if (policy) object.rsvpPolicy = policy;

    const activity = { type: 'Create', objectType: 'Group', object };
    if (to) activity.to = to;

    return await this._post(activity);
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

    return await this._post(activity);
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

    return await this._post({ type: 'Delete', objectType: 'Group', target: groupId });
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

    return await this._post({ type: 'Join', objectType: 'Group', target: groupId });
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

    return await this._post({ type: 'Leave', objectType: 'Group', target: groupId });
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

    return await this._post({ type: 'Add', to: groupId, object: userId });
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

    return await this._post({ type: 'Reject', to: groupId, object: userId });
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
    const {
      type = 'Bookmark', href, title, parentFolder, to,
      canReply = 'public', canReact = 'public',
      body, image, featuredImage, tags,
    } = options;

    if (!title) throw new ValidationError('Bookmark title is required');
    if (type === 'Bookmark' && !href) throw new ValidationError('href is required for Bookmarks');

    const object = { type, title };
    if (href) object.href = href;
    if (parentFolder) object.parentFolder = parentFolder;
    // Send body as source so Bookmark pre-save can render it to HTML
    if (body) object.source = { content: body, mediaType: 'text/markdown' };
    const img = featuredImage ?? image;
    if (img) object.image = img;
    if (tags?.length) object.tags = tags;

    const activity = { type: 'Create', objectType: 'Bookmark', object };
    if (to) activity.to = to;
    activity.canReply = canReply;
    activity.canReact = canReact;

    return await this._post(activity);
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

    return await this._post(activity);
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

    return await this._post({ type: 'Delete', objectType: 'Bookmark', target: bookmarkId });
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

    return await this._post(activity);
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

    return await this._post(activity);
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

    return await this._post({ type: 'Delete', objectType: 'Page', target: pageId });
  }

  // ---- User Actions ----

  /**
   * Update the current user's profile
   * @param {Object} options
   * @param {Object} options.updates - Fields to update (email, profile, prefs, etc.)
   * @returns {Promise<Object>}
   */
  async updateProfile(options) {
    // Accept either { updates: {...} } or the fields directly
    const updates = (options.updates && typeof options.updates === 'object')
      ? options.updates
      : options;
    if (!updates || typeof updates !== 'object') throw new ValidationError('updates object is required');

    return await this._post({
      type: 'Update',
      objectType: 'User',
      object: updates,
    });
  }

  /**
   * Follow a user — adds them to the current user's Following circle
   * @param {Object} options
   * @param {string} options.userId - User ID or @handle to follow
   * @returns {Promise<Object>}
   */
  async follow(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    const circleId = this.auth?._user?.following;
    if (!circleId) throw new ValidationError('No Following circle found — are you logged in?');

    return await this._post({
      type: 'Add',
      object: userId,
      target: circleId,
    });
  }

  /**
   * Unfollow a user — removes them from the current user's Following circle
   * @param {Object} options
   * @param {string} options.userId - User ID or @handle to unfollow
   * @returns {Promise<Object>}
   */
  async unfollow(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    const circleId = this.auth?._user?.following;
    if (!circleId) throw new ValidationError('No Following circle found — are you logged in?');

    return await this._post({
      type: 'Remove',
      object: userId,
      target: circleId,
    });
  }

  /**
   * Block a user
   * @param {Object} options
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async block(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    return await this._post({ type: 'Block', objectType: 'User', target: userId });
  }

  /**
   * Unblock a user
   * @param {Object} options
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async unblock(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    return await this._post({ type: 'Unblock', objectType: 'User', target: userId });
  }

  /**
   * Mute a user
   * @param {Object} options
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async mute(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    return await this._post({ type: 'Mute', objectType: 'User', target: userId });
  }

  /**
   * Unmute a user
   * @param {Object} options
   * @param {string} options.userId
   * @returns {Promise<Object>}
   */
  async unmute(options) {
    const { userId } = options;
    if (!userId) throw new ValidationError('userId is required');

    return await this._post({ type: 'Unmute', objectType: 'User', target: userId });
  }

  /**
   * Flag content for moderation
   * @param {Object} options
   * @param {string} options.targetId - ID of content to flag
   * @param {string} options.reason - Reason string
   * @param {string} [options.notes] - Additional notes
   * @returns {Promise<Object>}
   */
  async flag(options) {
    const { targetId, reason, notes } = options;
    if (!targetId) throw new ValidationError('targetId is required');
    if (!reason || typeof reason !== 'string') throw new ValidationError('reason is required');

    const flagObject = { reason: reason.trim() };
    if (notes) flagObject.notes = notes.trim();

    return await this._post({
      type: 'Flag',
      target: targetId,
      object: flagObject,
    });
  }

  // ---- Files ----

  /**
   * Upload a file. Delegates to FilesClient.upload().
   * @param {Object} options - See FilesClient.upload() for full option list
   * @param {Buffer|Blob} options.file - File data
   * @param {string} options.filename - Original filename
   * @param {string} [options.to] - Visibility
   * @param {string} [options.parentObject] - Parent object ID (inherits visibility)
   * @returns {Promise<Object>} { ok, file: { id, url, thumbnails, metadata } }
   */
  async upload(options) {
    return this.files.upload(options);
  }
}

export default ActivitiesClient;
