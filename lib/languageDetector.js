/**
 * @fileoverview Language detection utilities for syntax highlighting
 */

const path = require('node:path');

/**
 * Detects programming language from file extension or content analysis
 * @param {string} filePath - Path to the file
 * @param {string} content - File content for analysis
 * @returns {string|null} Language identifier for syntax highlighting, or null if not detected
 */
function detectLanguage(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  
  const languages = {
    '.js':   'javascript',
    '.ts':   'typescript',
    '.py':   'python',
    '.java': 'java',
    '.cpp':  'cpp',
    '.c':    'c',
    '.css':  'css',
    '.html': 'html',
    '.xml':  'xml',
    '.json': 'json',
    '.yml':  'yaml',
    '.yaml': 'yaml',
    '.sh':   'bash',
    '.php':  'php',
    '.rb':   'ruby',
    '.go':   'go',
    '.rs':   'rust',
    '.sql':  'sql'
  };
  
  if (languages[ext]) {
    return languages[ext];
  }
  
  // Detect language by content for files without extensions
  if (!ext) {
    const firstLine = content.split('\n')[0];
    if (firstLine.includes('#!/usr/bin/env node') || firstLine.includes('#!/usr/bin/node')) {
      return 'javascript';
    }
    if (firstLine.includes('#!/usr/bin/env python') || firstLine.includes('#!/usr/bin/python')) {
      return 'python';
    }
    if (firstLine.includes('#!/bin/bash') || firstLine.includes('#!/bin/sh')) {
      return 'bash';
    }
    
    // Basic JavaScript detection
    if (content.includes('function ') || content.includes('const ') || content.includes('let ') || 
        content.includes('var ') || content.includes('class ') || content.includes('console.log')) {
      return 'javascript';
    }
    
    // Basic Python detection
    if (content.includes('def ') || content.includes('import ') || content.includes('from ') || 
        content.includes('print(')) {
      return 'python';
    }
  }
  
  return null;
}

module.exports = {
  detectLanguage
};