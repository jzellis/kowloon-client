// Notifications module for Kowloon client
// Handles fetching and managing user notifications

/**
 * Notifications client
 */
export class NotificationsClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List notifications with filtering and pagination
   * @param {Object} [options]
   * @param {string[]} [options.types] - Notification types to filter (reply, react, follow, etc.)
   * @param {boolean} [options.unread] - Only show unread notifications
   * @param {number} [options.limit] - Max notifications to return (default 20, max 100)
   * @param {number} [options.offset] - Pagination offset
   * @returns {Promise<Object>} { notifications, pagination, filters }
   */
  async list(options = {}) {
    const { types, unread, limit, offset } = options;

    const params = {};
    if (types && types.length > 0) params.types = types.join(',');
    if (unread) params.unread = 'true';
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    return await this.http.get('/notifications', { params });
  }

  /**
   * Get count of unread notifications
   * @param {Object} [options]
   * @param {string[]} [options.types] - Notification types to filter
   * @returns {Promise<Object>} { count, filters }
   */
  async unreadCount(options = {}) {
    const { types } = options;

    const params = {};
    if (types && types.length > 0) params.types = types.join(',');

    return await this.http.get('/notifications/unread/count', { params });
  }

  /**
   * Get notification type counts
   * @param {Object} [options]
   * @param {boolean} [options.unread] - Only count unread
   * @returns {Promise<Object>} { types, filters }
   */
  async typeCounts(options = {}) {
    const { unread } = options;

    const params = {};
    if (unread) params.unread = 'true';

    return await this.http.get('/notifications/types', { params });
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} { notification }
   */
  async markRead(notificationId) {
    return await this.http.post(`/notifications/${encodeURIComponent(notificationId)}/read`);
  }

  /**
   * Mark all notifications as read
   * @param {Object} [options]
   * @param {string[]} [options.types] - Only mark these types as read
   * @returns {Promise<Object>} { count, filters }
   */
  async markAllRead(options = {}) {
    const { types } = options;

    const params = {};
    if (types && types.length > 0) params.types = types.join(',');

    return await this.http.post('/notifications/read-all', null, { params });
  }

  /**
   * Dismiss a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} { success }
   */
  async dismiss(notificationId) {
    return await this.http.post(`/notifications/${encodeURIComponent(notificationId)}/dismiss`);
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} { success }
   */
  async delete(notificationId) {
    return await this.http.delete(`/notifications/${encodeURIComponent(notificationId)}`);
  }
}

export default NotificationsClient;
