// Search module for Kowloon client

import { ValidationError } from '../utils/errors.js';

/**
 * Search client — all methods use GET /search
 * Searchable types: posts, pages, groups, users, bookmarks
 */
export class SearchClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Search across object types
   * @param {Object} options
   * @param {string} options.query - Search query
   * @param {number} [options.page]
   * @param {string} [options.type] - Sub-type filter (e.g. Note, Article for posts)
   * @param {string} [options.since] - ISO date cursor
   * @param {Object} [options.searchIn] - { posts?, pages?, groups?, users?, bookmarks? }
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
   */
  async searchPosts(options) {
    return this.search({ ...options, searchIn: { posts: true } });
  }

  /**
   * Search groups
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
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
   */
  async searchBookmarks(options) {
    return this.search({ ...options, searchIn: { bookmarks: true } });
  }

  /**
   * Search pages
   * @param {Object} options
   * @param {string} options.query
   * @param {number} [options.page]
   * @param {string} [options.since]
   */
  async searchPages(options) {
    return this.search({ ...options, searchIn: { pages: true } });
  }
}

export default SearchClient;
