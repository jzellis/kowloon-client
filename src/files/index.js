// Files module for Kowloon client
// Handles file uploads and retrieval

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
   * @param {Buffer|Blob|ReadableStream} options.file - File data
   * @param {string} options.filename - Original filename
   * @param {string} [options.contentType] - MIME type
   * @param {string} [options.title] - Display name for the file
   * @param {string} [options.summary] - Alt text / description
   * @param {boolean} [options.generateThumbnail] - Generate thumbnails (for images)
   * @returns {Promise<Object>} { file: { id, url, thumbnails, metadata } }
   */
  async upload(options) {
    const { file, filename, contentType, title, summary, generateThumbnail } = options;

    if (!file) {
      throw new ValidationError('file is required for upload');
    }

    if (!filename) {
      throw new ValidationError('filename is required for upload');
    }

    // Build FormData
    const formData = new FormData();

    // Handle different file types (Node.js Buffer, browser Blob, etc.)
    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      formData.append('file', file, filename);
    } else if (Buffer.isBuffer(file)) {
      // Node.js: create a Blob from Buffer
      formData.append('file', new Blob([file], { type: contentType }), filename);
    } else {
      formData.append('file', file, filename);
    }

    if (title) formData.append('title', title);
    if (summary) formData.append('summary', summary);
    if (generateThumbnail) formData.append('generateThumbnail', 'true');

    // Use raw fetch for multipart uploads (don't JSON-stringify the body)
    const token = await this.http.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = this.http._buildUrl('/files');
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
   * Get file metadata
   * @param {string} fileKey - File key/ID
   * @returns {Promise<Object>} File metadata
   */
  async get(fileKey) {
    return await this.http.get(`/files/${encodeURIComponent(fileKey)}`);
  }

  /**
   * Delete a file
   * @param {string} fileKey - File key/ID
   * @returns {Promise<Object>} Result
   */
  async delete(fileKey) {
    return await this.http.delete(`/files/${encodeURIComponent(fileKey)}`);
  }
}

export default FilesClient;
