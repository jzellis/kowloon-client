// Files module for Kowloon client
// Handles file uploads, retrieval, and serving

import { ValidationError } from '../utils/errors.js';

/**
 * Files client
 */
export class FilesClient {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Upload a file
   * @param {Object} options
   * @param {Buffer|Blob} options.file - File data
   * @param {string} options.filename - Original filename
   * @param {string} [options.contentType] - MIME type
   * @param {string} [options.title] - Display name
   * @param {string} [options.summary] - Alt text / description
   * @param {string} [options.to] - Visibility (default '@public')
   * @param {string} [options.parentObject] - Parent object ID (post/page/etc) — inherits that object's visibility at serve time
   * @param {boolean} [options.generateThumbnail] - Generate thumbnails (for images)
   * @param {number[]} [options.thumbnailSizes] - Thumbnail sizes in px (default [200, 400])
   * @returns {Promise<Object>} { ok, file: { id, url, thumbnails, metadata } }
   */
  async upload(options) {
    const {
      file, filename, contentType, title, summary,
      to, parentObject, generateThumbnail, thumbnailSizes,
    } = options;

    if (!file) throw new ValidationError('file is required for upload');
    if (!filename) throw new ValidationError('filename is required for upload');

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
    if (to) formData.append('to', to);
    if (parentObject) formData.append('parentObject', parentObject);
    if (generateThumbnail) formData.append('generateThumbnail', 'true');
    if (thumbnailSizes) formData.append('thumbnailSizes', JSON.stringify(thumbnailSizes));

    const token = await this.http.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = this.http._buildUrl('/files/');
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

  /**
   * List the authenticated user's files
   * @param {Object} [options]
   * @param {string} [options.type] - Filter by type (Image, Video, Audio, Document)
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>} { ok, files, total, page, limit }
   */
  async list(options = {}) {
    const { type, page, limit } = options;
    const params = {};
    if (type) params.type = type;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return await this.http.get('/files', { params });
  }

  /**
   * Get file metadata
   * @param {string} fileId - File ID (e.g. 'file:abc123@domain')
   * @returns {Promise<Object>} File metadata
   */
  async getMeta(fileId) {
    if (!fileId) throw new ValidationError('fileId is required');
    return await this.http.get(`/files/${encodeURIComponent(fileId)}/meta`);
  }

  /**
   * Build the URL for serving a file (for use in <img src> etc.)
   * The server enforces visibility — pass the token as a query param for
   * non-public files (e.g. in an <img src> where you can't set headers).
   * @param {string} fileId - File ID
   * @param {Object} [options]
   * @param {number} [options.size] - Thumbnail size (e.g. 200, 400)
   * @param {string} [options.token] - Auth token (for non-public files in <img src>)
   * @returns {string} Full URL
   */
  serveUrl(fileId, options = {}) {
    if (!fileId) throw new ValidationError('fileId is required');
    const { size, token } = options;
    let url = this.http._buildUrl(`/files/${encodeURIComponent(fileId)}`);
    const params = new URLSearchParams();
    if (size) params.set('size', String(size));
    if (token) params.set('token', token);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  /**
   * Delete a file (owner or server admin only)
   * @param {string} fileId - File ID (e.g. 'file:abc123@domain')
   * @returns {Promise<Object>} { ok, deleted, id }
   */
  async delete(fileId) {
    if (!fileId) throw new ValidationError('fileId is required');
    return await this.http.delete(`/files/${encodeURIComponent(fileId)}`);
  }
}

export default FilesClient;
