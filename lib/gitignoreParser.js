/**
 * @fileoverview Gitignore parsing utilities for filtering files and directories
 */

const fs     = require('node:fs');
const path   = require('node:path');
const ignore = require('ignore');

/**
 * Cache for gitignore instances by directory path
 * @type {Map<string, import('ignore').Ignore>}
 */
const gitignoreCache = new Map();

/**
 * Loads and parses .gitignore files from the given directory and its parents
 * @param {string} rootDir - The root directory to start searching from
 * @returns {import('ignore').Ignore} Configured ignore instance
 */
function loadGitignoreRules(rootDir) {
  if (gitignoreCache.has(rootDir)) {
    return gitignoreCache.get(rootDir);
  }

  const ig = ignore();
  
  ig.add('.git');
  
  let currentDir = rootDir;
  const checkedDirs = new Set();
  
  while (currentDir && !checkedDirs.has(currentDir)) {
    checkedDirs.add(currentDir);
    
    const gitignorePath = path.join(currentDir, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        ig.add(gitignoreContent);
      } catch (error) {
        console.warn(`Warning: Could not read .gitignore file at ${gitignorePath}:`, error.message);
      }
    }
    
    const parentDir = path.dirname(currentDir);
    const isFilesystemRoot = parentDir === currentDir;
    if (isFilesystemRoot) {
      break;
    }
    currentDir = parentDir;
  }
  
  gitignoreCache.set(rootDir, ig);
  return ig;
}

/**
 * Checks if a file or directory should be ignored based on gitignore rules
 * @param {string} filePath - Absolute path to the file or directory
 * @param {string} rootDir - Root directory for the server
 * @returns {boolean} True if the file should be ignored
 */
function shouldIgnoreFile(filePath, rootDir) {
  const ig = loadGitignoreRules(rootDir);
  const relativePath = path.relative(rootDir, filePath);
  
  // If the file is outside the root directory, don't ignore it
  if (relativePath.startsWith('..')) {
    return false;
  }
  
  const isRootDirectory = !relativePath || relativePath === '.'
  if (isRootDirectory) {
    return false;
  }
  
  // Convert Windows path separators to Unix style for gitignore matching
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  return ig.ignores(normalizedPath);
}

/**
 * Filters an array of file paths, removing those that should be ignored
 * @param {string[]} filePaths - Array of absolute file paths
 * @param {string} rootDir - Root directory for the server
 * @returns {string[]} Filtered array of file paths
 */
function filterIgnoredFiles(filePaths, rootDir) {
  return filePaths.filter(filePath => !shouldIgnoreFile(filePath, rootDir));
}

/**
 * Clears the gitignore cache (useful for testing or when .gitignore files change)
 */
function clearGitignoreCache() {
  gitignoreCache.clear();
}

module.exports = {
  loadGitignoreRules,
  shouldIgnoreFile,
  filterIgnoredFiles,
  clearGitignoreCache
};