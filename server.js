#!/usr/bin/env node

/**
 * @fileoverview A simple HTTP server for browsing and viewing documentation files
 * Supports markdown rendering, syntax highlighting, and dark mode
 * @version 1.0.0
 */

const path = require('node:path');
const fs   = require('node:fs');

const express = require('express');
const mime    = require('mime');

const { isSubPath }                               = require('./lib/security');
const { getFileInfo }                             = require('./lib/fileUtils');
const { generateDirectoryHTML, generateFileHTML } = require('./lib/htmlGenerator');
const { detectLanguage }                          = require('./lib/languageDetector');
const { shouldIgnoreFile }                        = require('./lib/gitignoreParser');

const ROOT_DIR_ARG_INDEX = 2;
const PORT_ARG_INDEX = 3;

const app = express();
let PORT  = 4040;

let ROOT_DIR = process.cwd();

if (process.argv[ROOT_DIR_ARG_INDEX]) {
  ROOT_DIR = path.resolve(process.argv[2]);
}

if (process.argv[PORT_ARG_INDEX]) {
  PORT = parseInt(process.argv[PORT_ARG_INDEX], 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    console.error('Error: Port must be a number between 1 and 65535');
    process.exit(1);
  }
}

if (!fs.existsSync(ROOT_DIR)) {
  console.error(`Error: Directory "${ROOT_DIR}" does not exist.`);
  process.exit(1);
}

console.log(`Starting docs server on http://localhost:${PORT}`);
console.log(`Serving directory: ${ROOT_DIR}`);

/**
 * Main route handler for serving files and directories
 * Handles directory listings, file content with syntax highlighting, and security checks
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
app.get('*', (req, res) => {
  const requestedPath = decodeURIComponent(req.path);
  const fullPath = path.join(ROOT_DIR, requestedPath);
  
  // Security check: prevent path traversal attacks
  if (!isSubPath(ROOT_DIR, fullPath) && fullPath !== ROOT_DIR) {
    return res.status(403).send('Access denied: Path outside of root directory');
  }

  if (shouldIgnoreFile(fullPath, ROOT_DIR)) {
    return res.status(404).send('File not found');
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }

    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath)
        .filter(file => !file.startsWith('.'))
        .map(file => path.join(fullPath, file))
        .filter(filePath => !shouldIgnoreFile(filePath, ROOT_DIR))
        .map(filePath => getFileInfo(filePath))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

      const html = generateDirectoryHTML(fullPath, files, requestedPath === '/' ? '' : requestedPath, ROOT_DIR);
      res.send(html);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      const fileName = path.basename(fullPath);
      
      const mimeType = mime.getType(fullPath);
      if (mimeType && (mimeType.startsWith('text/') || mimeType === 'application/javascript' || mimeType === 'application/json')) {
        const content    = fs.readFileSync(fullPath, 'utf-8');
        
        const isMarkdown = ext === '.md';
        const isHtml     = ext === '.html' || ext === '.htm';
        const language   = detectLanguage(fullPath, content);
        
        const html       = generateFileHTML(fileName, content, requestedPath, isMarkdown, language, isHtml);
        res.send(html);
      } else {
        res.sendFile(fullPath);
      }
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * Start the Express server
 * @listens {number} PORT - The port number to listen on
 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});