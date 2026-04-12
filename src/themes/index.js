// Themes client for Kowloon
// GET /themes and GET /themes/:id are public (no auth required).
// Create/update/delete/setDefault require admin auth.

export class ThemesClient {
  constructor(http) {
    this.http = http;
  }

  /**
   * List all themes and the server's default theme ID.
   * @returns {Promise<{ themes: Object[], defaultThemeId: string }>}
   */
  async list() {
    return await this.http.get('/themes');
  }

  /**
   * Get a single theme by ID.
   * @param {string} id
   * @returns {Promise<{ theme: Object }>}
   */
  async getById(id) {
    return await this.http.get(`/themes/${encodeURIComponent(id)}`);
  }

  /**
   * Create a new theme (admin only).
   * @param {Object} theme - { id, name, description, colorScheme, colors, postColors }
   * @returns {Promise<{ theme: Object }>}
   */
  async create(theme) {
    return await this.http.post('/themes', theme);
  }

  /**
   * Update an existing non-built-in theme (admin only).
   * @param {string} id
   * @param {Object} updates - { name, description, colorScheme, colors, postColors }
   * @returns {Promise<{ theme: Object }>}
   */
  async update(id, updates) {
    return await this.http.put(`/themes/${encodeURIComponent(id)}`, updates);
  }

  /**
   * Delete a non-built-in theme (admin only).
   * @param {string} id
   * @returns {Promise<{ ok: boolean }>}
   */
  async delete(id) {
    return await this.http.delete(`/themes/${encodeURIComponent(id)}`);
  }

  /**
   * Set the server default theme (admin only).
   * @param {string} themeId
   * @returns {Promise<{ defaultThemeId: string }>}
   */
  async setDefault(themeId) {
    return await this.http.patch('/themes/default', { themeId });
  }
}

export default ThemesClient;
