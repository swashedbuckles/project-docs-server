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
      <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
      <style>
        /* Dark mode override - takes precedence over Simple.css auto detection */
        [data-theme="dark"] {
          color-scheme: dark;
          --bg: #212121;
          --accent-bg: #2b2b2b;
          --text: #dcdcdc;
          --text-light: #ababab;
          --border: #666;
          --accent: #ffb300;
          --accent-hover: #ffcc02;
          --accent-text: var(--bg);
          --code: #f06292;
          --preformatted: #ccc;
          --marked: #ffdd33;
          --disabled: #111;
        }
        
        /* Light mode override */
        [data-theme="light"] {
          color-scheme: light;
          --bg: #fff;
          --accent-bg: #f5f7ff;
          --text: #212121;
          --text-light: #585858;
          --border: #898EA4;
          --accent: #0d47a1;
          --accent-hover: #1976d2;
          --accent-text: var(--bg);
          --code: #d81b60;
          --preformatted: #444;
          --marked: #ffdd33;
          --disabled: #efefef;
        }

        .theme-toggle { 
          position: fixed; 
          top: 1rem; 
          right: 1rem; 
          background: var(--accent); 
          color: var(--accent-text); 
          border: none; 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 1.2rem; 
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .theme-toggle:hover { 
          background: var(--accent-hover); 
          transform: scale(1.05);
        }
        /* Override Simple.css grid layout for wider content */
        body {
          display: block !important;
          grid-template-columns: none !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 1rem !important;
        }
        
        main {
          display: block !important;
          grid-column: none !important;
          max-width: none !important;
          width: 100% !important;
        }
        
        @media (max-width: 1240px) {
          body {
            max-width: calc(100% - 2rem) !important;
          }
        }

        .breadcrumb { 
          background: var(--accent-bg); 
          padding: 1rem; 
          border-radius: 4px; 
          margin-bottom: 1rem; 
        }
        .file-icon { margin-right: 0.5rem; }
        .back-button { margin-bottom: 1rem; }
        .back-button a { 
          background: var(--accent); 
          color: var(--accent-text); 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          text-decoration: none; 
        }
        .back-button a:hover { background: var(--accent-hover); }
        table { margin-top: 1rem; }
        .directory-title { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          margin-bottom: 1rem; 
        }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      
      <main>
        <nav class="breadcrumb">
          ${breadcrumbHTML}
        </nav>
        
        ${currentPath ? `<div class="back-button"><a href="${path.dirname(currentPath) || '/'}">&larr; Back</a></div>` : ''}
        
        <header class="directory-title">
          <h1>📁 ${relativePath || 'Root Directory'}</h1>
        </header>
        
        <section>
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
        </section>
      </main>
      
      <script>
        function toggleTheme() {
          const html = document.documentElement;
          const button = document.querySelector('.theme-toggle');
          const currentTheme = html.getAttribute('data-theme');
          
          if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            button.textContent = '🌙';
            localStorage.setItem('theme', 'light');
          } else {
            html.setAttribute('data-theme', 'dark');
            button.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
          }
        }
        
        // Load saved theme - Simple.css uses data-theme on html element
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
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
 * @param {boolean} [isMermaid=false] - Whether to render as mermaid diagram
 * @returns {string} Complete HTML document for file display
 */
function generateFileHTML(fileName, content, filePath, isMarkdown = false, language = null, isHtml = false, isMermaid = false) {
  const backPath = path.dirname(filePath) || '/';
  
  let processedContent = content;
  if (isHtml) {
    // For HTML files, inject the navigation header and dark mode support
    processedContent = content.replace(
      '<head>',
      `<head>
        <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
        <style>
          /* Dark mode override - takes precedence over Simple.css auto detection */
          [data-theme="dark"] {
            color-scheme: dark;
            --bg: #212121;
            --accent-bg: #2b2b2b;
            --text: #dcdcdc;
            --text-light: #ababab;
            --border: #666;
            --accent: #ffb300;
            --accent-hover: #ffcc02;
            --accent-text: var(--bg);
            --code: #f06292;
            --preformatted: #ccc;
            --marked: #ffdd33;
            --disabled: #111;
          }
          
          /* Light mode override */
          [data-theme="light"] {
            color-scheme: light;
            --bg: #fff;
            --accent-bg: #f5f7ff;
            --text: #212121;
            --text-light: #585858;
            --border: #898EA4;
            --accent: #0d47a1;
            --accent-hover: #1976d2;
            --accent-text: var(--bg);
            --code: #d81b60;
            --preformatted: #444;
            --marked: #ffdd33;
            --disabled: #efefef;
          }

          .theme-toggle { 
            position: fixed; 
            top: 1rem; 
            right: 1rem; 
            background: var(--accent); 
            color: var(--accent-text); 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 1.2rem; 
            z-index: 1000;
            transition: all 0.3s ease;
          }
          .theme-toggle:hover { 
            background: var(--accent-hover); 
            transform: scale(1.05);
          }
          /* Override Simple.css grid layout for wider content */
          body {
            display: block !important;
            grid-template-columns: none !important;
            max-width: 1200px !important;
            margin: 0 auto !important;
            padding: 1rem !important;
          }
          
          main {
            display: block !important;
            grid-column: none !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          @media (max-width: 1240px) {
            body {
              max-width: calc(100% - 2rem) !important;
            }
          }

          .nav-header { 
            background: var(--accent-bg); 
            padding: 1rem; 
            margin-bottom: 1rem; 
            border-radius: 4px; 
          }
          .nav-header a { 
            background: var(--accent); 
            color: var(--accent-text); 
            padding: 0.5rem 1rem; 
            border-radius: 4px; 
            text-decoration: none; 
            display: inline-block;
            margin-bottom: 0.5rem;
          }
          .nav-header a:hover { background: var(--accent-hover); }
          .nav-header h2 { 
            margin: 0; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
          }
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
            const html = document.documentElement;
            const button = document.querySelector('.theme-toggle');
            const currentTheme = html.getAttribute('data-theme');
            
            if (currentTheme === 'dark') {
              html.setAttribute('data-theme', 'light');
              button.textContent = '🌙';
              localStorage.setItem('theme', 'light');
            } else {
              html.setAttribute('data-theme', 'dark');
              button.textContent = '☀️';
              localStorage.setItem('theme', 'dark');
            }
          }
          
          // Load saved theme - Simple.css uses data-theme on html element
          const savedTheme = localStorage.getItem('theme') || 'light';
          document.documentElement.setAttribute('data-theme', savedTheme);
          document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        </script>`
    );
    return processedContent;
  } else if (isMermaid) {
    processedContent = `<div class="mermaid-diagram" data-diagram="${content.replace(/"/g, '&quot;')}">${content}</div>`;
  } else if (isMarkdown) {
    const renderer = new marked.Renderer();
    const originalCode = renderer.code;
    
    renderer.code = function(code, info) {
      if (info === 'mermaid') {
        return `<div class="mermaid-diagram" data-diagram="${code.replace(/"/g, '&quot;')}">${code}</div>`;
      }
      return originalCode.call(this, code, info);
    };
    
    processedContent = marked(content, { renderer });
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
      <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css" id="hljs-light">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" id="hljs-dark" disabled>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
      <style>
        /* Dark mode override - takes precedence over Simple.css auto detection */
        [data-theme="dark"] {
          color-scheme: dark;
          --bg: #212121;
          --accent-bg: #2b2b2b;
          --text: #dcdcdc;
          --text-light: #ababab;
          --border: #666;
          --accent: #ffb300;
          --accent-hover: #ffcc02;
          --accent-text: var(--bg);
          --code: #f06292;
          --preformatted: #ccc;
          --marked: #ffdd33;
          --disabled: #111;
        }
        
        /* Light mode override */
        [data-theme="light"] {
          color-scheme: light;
          --bg: #fff;
          --accent-bg: #f5f7ff;
          --text: #212121;
          --text-light: #585858;
          --border: #898EA4;
          --accent: #0d47a1;
          --accent-hover: #1976d2;
          --accent-text: var(--bg);
          --code: #d81b60;
          --preformatted: #444;
          --marked: #ffdd33;
          --disabled: #efefef;
        }

        .theme-toggle { 
          position: fixed; 
          top: 1rem; 
          right: 1rem; 
          background: var(--accent); 
          color: var(--accent-text); 
          border: none; 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 1.2rem; 
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .theme-toggle:hover { 
          background: var(--accent-hover); 
          transform: scale(1.05);
        }
        /* Override Simple.css grid layout for wider content */
        body {
          display: block !important;
          grid-template-columns: none !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 1rem !important;
        }
        
        main {
          display: block !important;
          grid-column: none !important;
          max-width: none !important;
          width: 100% !important;
        }
        
        @media (max-width: 1240px) {
          body {
            max-width: calc(100% - 2rem) !important;
          }
        }

        .file-header { 
          background: var(--accent-bg); 
          padding: 1rem; 
          border-radius: 4px; 
          margin-bottom: 1rem; 
        }
        .back-button { margin-bottom: 1rem; }
        .back-button a { 
          background: var(--accent); 
          color: var(--accent-text); 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          text-decoration: none; 
        }
        .back-button a:hover { background: var(--accent-hover); }
        .file-title { 
          margin: 0; 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
        }
        pre { 
          background: var(--accent-bg) !important; 
          border: 1px solid var(--border); 
          border-radius: 4px; 
          overflow-x: auto; 
        }
        /* Override highlight.js background in dark mode */
        [data-theme="dark"] .hljs { 
          background: var(--accent-bg) !important; 
        }
        
        /* Mermaid diagram styling */
        .mermaid-diagram {
          background: var(--accent-bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: center;
          overflow-x: auto;
        }
        
        /* Ensure mermaid diagrams work with dark mode */
        [data-theme="dark"] .mermaid-diagram {
          background: var(--accent-bg);
        }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      
      <main>
        <header class="file-header">
          <div class="back-button"><a href="${backPath}">&larr; Back</a></div>
          <h1 class="file-title">📄 ${fileName}</h1>
        </header>
        
        <article>
          ${processedContent}
        </article>
      </main>
      
      <script>
        function toggleTheme() {
          const html = document.documentElement;
          const button = document.querySelector('.theme-toggle');
          const currentTheme = html.getAttribute('data-theme');
          const lightTheme = document.getElementById('hljs-light');
          const darkTheme = document.getElementById('hljs-dark');
          
          if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            button.textContent = '🌙';
            localStorage.setItem('theme', 'light');
            if (lightTheme) lightTheme.disabled = false;
            if (darkTheme) darkTheme.disabled = true;
          } else {
            html.setAttribute('data-theme', 'dark');
            button.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
            if (lightTheme) lightTheme.disabled = true;
            if (darkTheme) darkTheme.disabled = false;
          }
        }
        
        // Load saved theme - Simple.css uses data-theme on html element
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        const lightTheme = document.getElementById('hljs-light');
        const darkTheme = document.getElementById('hljs-dark');
        if (savedTheme === 'dark') {
          if (lightTheme) lightTheme.disabled = true;
          if (darkTheme) darkTheme.disabled = false;
        }
        
        // Initialize Mermaid
        mermaid.initialize({ 
          startOnLoad: false,
          theme: savedTheme === 'dark' ? 'dark' : 'default'
        });
        
        // Function to render mermaid diagrams
        function renderMermaidDiagrams() {
          const diagrams = document.querySelectorAll('.mermaid-diagram');
          diagrams.forEach((diagram, index) => {
            const content = diagram.getAttribute('data-diagram');
            const id = 'mermaid-' + index;
            diagram.innerHTML = '';
            diagram.id = id;
            
            try {
              mermaid.render(id + '-svg', content).then(({svg}) => {
                diagram.innerHTML = svg;
              }).catch(err => {
                console.error('Mermaid rendering error:', err);
                diagram.innerHTML = '<pre><code>' + content + '</code></pre>';
              });
            } catch (err) {
              console.error('Mermaid rendering error:', err);
              diagram.innerHTML = '<pre><code>' + content + '</code></pre>';
            }
          });
        }
        
        // Render diagrams after page load
        renderMermaidDiagrams();
        
        // Update mermaid theme when switching themes
        const originalToggleTheme = window.toggleTheme;
        window.toggleTheme = function() {
          originalToggleTheme();
          const currentTheme = document.documentElement.getAttribute('data-theme');
          mermaid.initialize({ 
            startOnLoad: false,
            theme: currentTheme === 'dark' ? 'dark' : 'default'
          });
          setTimeout(renderMermaidDiagrams, 100);
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Generates HTML for displaying images with navigation and dark mode support
 * @param {string} fileName - Name of the image file being displayed
 * @param {string} filePath - Path to the image file (for back navigation and src)
 * @returns {string} Complete HTML document for image display
 */
function generateImageHTML(fileName, filePath) {
  const backPath = path.dirname(filePath) || '/';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileName}</title>
      <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css">
      <style>
        /* Dark mode override - takes precedence over Simple.css auto detection */
        [data-theme="dark"] {
          color-scheme: dark;
          --bg: #212121;
          --accent-bg: #2b2b2b;
          --text: #dcdcdc;
          --text-light: #ababab;
          --border: #666;
          --accent: #ffb300;
          --accent-hover: #ffcc02;
          --accent-text: var(--bg);
          --code: #f06292;
          --preformatted: #ccc;
          --marked: #ffdd33;
          --disabled: #111;
        }
        
        /* Light mode override */
        [data-theme="light"] {
          color-scheme: light;
          --bg: #fff;
          --accent-bg: #f5f7ff;
          --text: #212121;
          --text-light: #585858;
          --border: #898EA4;
          --accent: #0d47a1;
          --accent-hover: #1976d2;
          --accent-text: var(--bg);
          --code: #d81b60;
          --preformatted: #444;
          --marked: #ffdd33;
          --disabled: #efefef;
        }

        .theme-toggle { 
          position: fixed; 
          top: 1rem; 
          right: 1rem; 
          background: var(--accent); 
          color: var(--accent-text); 
          border: none; 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 1.2rem; 
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .theme-toggle:hover { 
          background: var(--accent-hover); 
          transform: scale(1.05);
        }
        /* Override Simple.css grid layout for wider content */
        body {
          display: block !important;
          grid-template-columns: none !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 1rem !important;
        }
        
        main {
          display: block !important;
          grid-column: none !important;
          max-width: none !important;
          width: 100% !important;
        }
        
        @media (max-width: 1240px) {
          body {
            max-width: calc(100% - 2rem) !important;
          }
        }

        .image-header { 
          background: var(--accent-bg); 
          padding: 1rem; 
          border-radius: 4px; 
          margin-bottom: 1rem; 
        }
        .back-button { margin-bottom: 1rem; }
        .back-button a { 
          background: var(--accent); 
          color: var(--accent-text); 
          padding: 0.5rem 1rem; 
          border-radius: 4px; 
          text-decoration: none; 
        }
        .back-button a:hover { background: var(--accent-hover); }
        .image-title { 
          margin: 0; 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
        }
        .image-container {
          text-align: center;
          background: var(--accent-bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1rem;
          margin: 1rem 0;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        [data-theme="dark"] .image-container img {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
      
      <main>
        <header class="image-header">
          <div class="back-button"><a href="${backPath}">&larr; Back</a></div>
          <h1 class="image-title">🖼️ ${fileName}</h1>
        </header>
        
        <div class="image-container">
          <img src="${filePath}" alt="${fileName}" />
        </div>
      </main>
      
      <script>
        function toggleTheme() {
          const html = document.documentElement;
          const button = document.querySelector('.theme-toggle');
          const currentTheme = html.getAttribute('data-theme');
          
          if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            button.textContent = '🌙';
            localStorage.setItem('theme', 'light');
          } else {
            html.setAttribute('data-theme', 'dark');
            button.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
          }
        }
        
        // Load saved theme - Simple.css uses data-theme on html element
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
      </script>
    </body>
    </html>
  `;
}

module.exports = {
  generateDirectoryHTML,
  generateFileHTML,
  generateImageHTML
};