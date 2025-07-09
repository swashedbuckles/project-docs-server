/**
 * @fileoverview HTML generation utilities for directory listings and file content
 */

const path = require('node:path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const { getFileIcon, formatFileSize } = require('./fileUtils');

/**
 * Generates HTML for directory listing with breadcrumbs and file table
 * @param {string} dirPath - Absolute path to the directory
 * @param {Array<Object>} files - Array of file information objects
 * @param {string} currentPath - Current path relative to root
 * @param {string} rootDir - Root directory path
 * @returns {string} Complete HTML document for directory listing
 */
function generateDirectoryHTML(dirPath, files, currentPath, rootDir) {
  const relativePath = path.relative(rootDir, dirPath);
  const breadcrumbs = relativePath ? relativePath.split(path.sep) : [];
  
  let breadcrumbHTML = `<a href="/">📁 Root</a>`;
  let buildPath = '';
  for (const crumb of breadcrumbs) {
    buildPath += '/' + crumb;
    breadcrumbHTML += ` / <a href="${buildPath}">${crumb}</a>`;
  }

  const fileRows = files.map(file => {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const icon = file.isDirectory ? '📁' : getFileIcon(file.extension);
    const size = file.isDirectory ? '-' : formatFileSize(file.size);
    const modified = file.modified.toLocaleDateString();
    
    return `
      <tr>
        <td><a href="${filePath}">${icon} ${file.name}</a></td>
        <td>${size}</td>
        <td>${modified}</td>
        <td>${file.type}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Directory: ${relativePath || 'Root'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; transition: background-color 0.3s, color 0.3s; }
        .breadcrumb { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; transition: background-color 0.3s; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; transition: border-color 0.3s; }
        th { background-color: #f2f2f2; transition: background-color 0.3s; }
        a { text-decoration: none; color: #0066cc; transition: color 0.3s; }
        a:hover { text-decoration: underline; }
        .back-button { margin-bottom: 20px; }
        .theme-toggle { position: fixed; top: 20px; right: 20px; background: #007acc; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; transition: background-color 0.3s; }
        .theme-toggle:hover { background: #005a9e; }
        
        /* Dark mode styles */
        [data-theme="dark"] { background-color: #1a1a1a; color: #e0e0e0; }
        [data-theme="dark"] .breadcrumb { background: #2d2d2d; }
        [data-theme="dark"] th { background-color: #2d2d2d; }
        [data-theme="dark"] th, [data-theme="dark"] td { border-bottom: 1px solid #404040; }
        [data-theme="dark"] a { color: #66b3ff; }
        [data-theme="dark"] .theme-toggle { background: #404040; }
        [data-theme="dark"] .theme-toggle:hover { background: #555555; }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      
      <div class="breadcrumb">
        ${breadcrumbHTML}
      </div>
      
      ${currentPath ? `<div class="back-button"><a href="${path.dirname(currentPath) || '/'}">&larr; Back</a></div>` : ''}
      
      <h1>📁 ${relativePath || 'Root Directory'}</h1>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${fileRows}
        </tbody>
      </table>
      
      <script>
        function toggleTheme() {
          const body = document.body;
          const button = document.querySelector('.theme-toggle');
          const currentTheme = body.getAttribute('data-theme');
          const lightTheme = document.getElementById('hljs-light');
          const darkTheme = document.getElementById('hljs-dark');
          
          if (currentTheme === 'dark') {
            body.setAttribute('data-theme', 'light');
            button.textContent = '🌙';
            localStorage.setItem('theme', 'light');
            if (lightTheme) lightTheme.disabled = false;
            if (darkTheme) darkTheme.disabled = true;
          } else {
            body.setAttribute('data-theme', 'dark');
            button.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
            if (lightTheme) lightTheme.disabled = true;
            if (darkTheme) darkTheme.disabled = false;
          }
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        const lightTheme = document.getElementById('hljs-light');
        const darkTheme = document.getElementById('hljs-dark');
        if (savedTheme === 'dark') {
          if (lightTheme) lightTheme.disabled = true;
          if (darkTheme) darkTheme.disabled = false;
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Generates HTML for individual file content with syntax highlighting and dark mode
 * @param {string} fileName - Name of the file being displayed
 * @param {string} content - File content to display
 * @param {string} filePath - Path to the file (for back navigation)
 * @param {boolean} [isMarkdown=false] - Whether to render as markdown
 * @param {string|null} [language=null] - Language for syntax highlighting
 * @param {boolean} [isHtml=false] - Whether the file is HTML (special handling)
 * @returns {string} Complete HTML document for file display
 */
function generateFileHTML(fileName, content, filePath, isMarkdown = false, language = null, isHtml = false) {
  const backPath = path.dirname(filePath) || '/';
  
  let processedContent = content;
  if (isHtml) {
    // For HTML files, inject the navigation header and dark mode support
    processedContent = content.replace(
      '<head>',
      `<head>
        <style>
          body { transition: background-color 0.3s, color 0.3s; }
          .nav-header { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 4px; transition: background-color 0.3s; }
          .nav-header a { text-decoration: none; color: #0066cc; transition: color 0.3s; }
          .nav-header h2 { margin: 5px 0; color: #333; transition: color 0.3s; }
          .theme-toggle { position: fixed; top: 20px; right: 20px; background: #007acc; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; transition: background-color 0.3s; z-index: 1000; }
          .theme-toggle:hover { background: #005a9e; }
          
          [data-theme="dark"] { background-color: #1a1a1a; color: #e0e0e0; }
          [data-theme="dark"] .nav-header { background: #2d2d2d; }
          [data-theme="dark"] .nav-header a { color: #66b3ff; }
          [data-theme="dark"] .nav-header h2 { color: #e0e0e0; }
          [data-theme="dark"] .theme-toggle { background: #404040; }
          [data-theme="dark"] .theme-toggle:hover { background: #555555; }
        </style>`
    ).replace(
      '<body>',
      `<body>
        <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
        <div class="nav-header">
          <a href="${backPath}">&larr; Back</a>
          <h2>📄 ${fileName}</h2>
        </div>
        <script>
          function toggleTheme() {
            const body = document.body;
            const button = document.querySelector('.theme-toggle');
            const currentTheme = body.getAttribute('data-theme');
            
            if (currentTheme === 'dark') {
              body.setAttribute('data-theme', 'light');
              button.textContent = '🌙';
              localStorage.setItem('theme', 'light');
            } else {
              body.setAttribute('data-theme', 'dark');
              button.textContent = '☀️';
              localStorage.setItem('theme', 'dark');
            }
          }
          
          // Load saved theme
          const savedTheme = localStorage.getItem('theme') || 'light';
          document.body.setAttribute('data-theme', savedTheme);
          document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        </script>`
    );
    return processedContent;
  } else if (isMarkdown) {
    processedContent = marked(content);
  } else if (language) {
    try {
      const highlighted = hljs.highlight(content, { language });
      processedContent = `<pre><code class="hljs ${language}">${highlighted.value}</code></pre>`;
    } catch (e) {
      processedContent = `<pre><code>${content}</code></pre>`;
    }
  } else {
    processedContent = `<pre><code>${content}</code></pre>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileName}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css" id="hljs-light">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" id="hljs-dark" disabled>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; transition: background-color 0.3s, color 0.3s; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 20px; transition: background-color 0.3s; }
        .back-button { margin-bottom: 10px; }
        .file-title { margin: 0; color: #333; transition: color 0.3s; }
        pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; transition: background-color 0.3s; }
        code { font-family: 'Courier New', monospace; }
        a { text-decoration: none; color: #0066cc; transition: color 0.3s; }
        a:hover { text-decoration: underline; }
        .theme-toggle { position: fixed; top: 20px; right: 20px; background: #007acc; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; transition: background-color 0.3s; }
        .theme-toggle:hover { background: #005a9e; }
        
        /* Dark mode styles */
        [data-theme="dark"] { background-color: #1a1a1a; color: #e0e0e0; }
        [data-theme="dark"] .header { background: #2d2d2d; }
        [data-theme="dark"] .file-title { color: #e0e0e0; }
        [data-theme="dark"] pre { background: #2d2d2d; }
        [data-theme="dark"] a { color: #66b3ff; }
        [data-theme="dark"] .theme-toggle { background: #404040; }
        [data-theme="dark"] .theme-toggle:hover { background: #555555; }
        [data-theme="dark"] .hljs { background: #2d2d2d !important; }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      
      <div class="header">
        <div class="back-button"><a href="${backPath}">&larr; Back</a></div>
        <h1 class="file-title">📄 ${fileName}</h1>
      </div>
      
      <div class="content">
        ${processedContent}
      </div>
      
      <script>
        function toggleTheme() {
          const body = document.body;
          const button = document.querySelector('.theme-toggle');
          const currentTheme = body.getAttribute('data-theme');
          const lightTheme = document.getElementById('hljs-light');
          const darkTheme = document.getElementById('hljs-dark');
          
          if (currentTheme === 'dark') {
            body.setAttribute('data-theme', 'light');
            button.textContent = '🌙';
            localStorage.setItem('theme', 'light');
            if (lightTheme) lightTheme.disabled = false;
            if (darkTheme) darkTheme.disabled = true;
          } else {
            body.setAttribute('data-theme', 'dark');
            button.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
            if (lightTheme) lightTheme.disabled = true;
            if (darkTheme) darkTheme.disabled = false;
          }
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        const lightTheme = document.getElementById('hljs-light');
        const darkTheme = document.getElementById('hljs-dark');
        if (savedTheme === 'dark') {
          if (lightTheme) lightTheme.disabled = true;
          if (darkTheme) darkTheme.disabled = false;
        }
      </script>
    </body>
    </html>
  `;
}

module.exports = {
  generateDirectoryHTML,
  generateFileHTML
};