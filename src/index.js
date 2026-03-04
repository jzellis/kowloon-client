// Kowloon Client - Isomorphic JavaScript client for Kowloon
// Works in Node.js, browsers, and React Native

import { HttpClient } from './http/client.js';
import { AuthClient } from './auth/index.js';
import { ActivitiesClient } from './activities/index.js';
import { FeedClient } from './feed/index.js';
import { SearchClient } from './search/index.js';
import { detectStorage } from './utils/storage.js';

/**
 * Main Kowloon client
 */
export class KowloonClient {
  /**
   * @param {Object} options
   * @param {string} options.baseUrl - Base URL for Kowloon server (e.g., 'https://kwln.org')
   * @param {Object} [options.storage] - Custom storage adapter
   * @param {Object} [options.headers] - Default headers for all requests
   * @param {number} [options.timeout] - Request timeout in ms (default: 30000)
   */
  constructor(options = {}) {
    const { baseUrl, storage, headers, timeout } = options;

    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }

    // Storage adapter (auto-detect or custom)
    this.storage = storage || detectStorage();

    // HTTP client
    this.http = new HttpClient({
      baseUrl,
      getToken: () => this.auth.getToken(),
      headers,
      timeout,
    });

    // Auth client
    this.auth = new AuthClient(this.http, this.storage);

    // Activities client (posts, replies, reacts, circles, groups, bookmarks, pages, user actions, files)
    this.activities = new ActivitiesClient(this.http);

    // Feed client (content feeds, single object retrieval, collections, notifications)
    this.feeds = new FeedClient(this.http);

    // Search client
    this.search = new SearchClient(this.http);
  }

  /**
   * Initialize client and restore session if available
   * @returns {Promise<Object|null>} User object if session restored, null otherwise
   */
  async init() {
    return await this.auth.restoreSession();
  }
}

// Export everything
export { HttpClient } from './http/client.js';
export { AuthClient } from './auth/index.js';
export { ActivitiesClient } from './activities/index.js';
export { FeedClient } from './feed/index.js';
export { SearchClient } from './search/index.js';
export * from './utils/errors.js';
export * from './utils/storage.js';

export default KowloonClient;
