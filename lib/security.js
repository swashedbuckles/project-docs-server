/**
 * @fileoverview Security utilities for path validation and access control
 */

const path = require('node:path');

/**
 * Checks if a child path is within the parent directory (prevents path traversal attacks)
 * @param {string} parent - The parent directory path
 * @param {string} child - The child path to check
 * @returns {boolean} True if child is within parent directory, false otherwise
 */
function isSubPath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  isSubPath
};