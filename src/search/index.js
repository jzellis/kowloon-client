// Search module for Kowloon client

import { ValidationError } from '../utils/errors.js';

/**
 * Search client — all methods use GET /search
 */
export class SearchClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Search across all object types
   * @param {Object} options
   * @param {string} options.query - Search query
   * @param {number} [options.page]
   * @param {string} [options.type] - Filter by object type
   * @param {string} [options.since] - ISO date cursor
   * @param {Object} [options.searchIn] - { posts?, pages?, groups?, circles?, bookmarks?, users? }
   * @returns {Promise<Object>}
   */
  async search(options) {
    const { query, page, type, since, searchIn } = options;
    if (!query) throw new ValidationError('query is required');

    const params = { q: query };
    if (page) params.page = page;
    if (type) params.type = type;
    if (since) params.since = since;
    if (searchIn) {
      const types = Object.entries(searchIn)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (types.length > 0) params.searchIn = types.join(',');
    }

    return await this.http.get('/search', { params });
  }

  /**
   * Search posts
   * @param {Object} options
   * @param {string} options.query
   * @param {string} [options.type] - Post type filter (Note, Article, etc.)
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchPosts(options) {
    return this.search({ ...options, searchIn: { posts: true } });
  }

  /**
   * Search circles
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchCircles(options) {
    return this.search({ ...options, searchIn: { circles: true } });
  }

  /**
   * Search groups
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchGroups(options) {
    return this.search({ ...options, searchIn: { groups: true } });
  }

  /**
   * Search users
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchUsers(options) {
    return this.search({ ...options, searchIn: { users: true } });
  }

  /**
   * Search bookmarks
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchBookmarks(options) {
    return this.search({ ...options, searchIn: { bookmarks: true } });
  }

  /**
   * Search activities
   * @param {Object} options
   * @param {string} options.query
   * @param {string} [options.type] - Activity type filter (Create, Reply, React, etc.)
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchActivities(options) {
    return this.search({ ...options, searchIn: { activities: true } });
  }

  /**
   * Search the user's notifications
   * @param {Object} options
   * @param {string} options.query
   * @param {string} [options.type] - Notification type filter
   * @param {number} [options.page]
   * @param {string} [options.since]
   * @returns {Promise<Object>}
   */
  async searchNotifications(options) {
    return this.search({ ...options, searchIn: { notifications: true } });
  }
}

export default SearchClient;
