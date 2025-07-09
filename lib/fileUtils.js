/**
 * @fileoverview File utility functions for handling file metadata and formatting
 */

const fs   = require('node:fs');
const path = require('node:path');

/**
 * Gets file information including size, modification time, and type
 * @param {string} filePath - The path to the file
 * @returns {Object} File information object
 * @returns {string} returns.name - The file name
 * @returns {boolean} returns.isDirectory - Whether the file is a directory
 * @returns {number|null} returns.size - File size in bytes (null for directories)
 * @returns {Date} returns.modified - Last modification date
 * @returns {string} returns.extension - File extension
 * @returns {string} returns.type - File type classification
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  const ext   = path.extname(filePath).toLowerCase();
  return {
    name:        path.basename(filePath),
    isDirectory: stats.isDirectory(),
    size:        stats.isDirectory() ? null:        stats.size,
    modified:    stats.mtime,
    extension:   ext,
    type:        stats.isDirectory() ? 'directory': getFileType(ext)
  };
}

/**
 * Maps file extensions to human-readable file types
 * @param {string} ext - File extension (including the dot)
 * @returns {string} Human-readable file type
 */
function getFileType(ext) {
  const types = {
    '.md':   'markdown',
    '.html': 'html',
    '.htm':  'html',
    '.js':   'javascript',
    '.ts':   'typescript',
    '.json': 'json',
    '.css':  'css',
    '.py':   'python',
    '.txt':  'text',
    '.yml':  'yaml',
    '.yaml': 'yaml'
  };
  return types[ext] || 'file';
}

/**
 * Gets an appropriate emoji icon for a file based on its extension
 * @param {string} ext - File extension (including the dot)
 * @returns {string} Emoji icon representing the file type
 */
function getFileIcon(ext) {
  const icons = {
    '.md':   '📝',
    '.html': '🌐',
    '.htm':  '🌐',
    '.js':   '📜',
    '.ts':   '📜',
    '.json': '📋',
    '.css':  '🎨',
    '.py':   '🐍',
    '.txt':  '📄',
    '.yml':  '⚙️',
    '.yaml': '⚙️'
  };
  return icons[ext] || '📄';
}

/**
 * Formats file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 KB", "2.3 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = {
  getFileInfo,
  getFileType,
  getFileIcon,
  formatFileSize
};