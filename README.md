# docs-server

A simple HTTP server for browsing and viewing documentation files with markdown support, syntax highlighting, and dark mode.

## Features

- 📁 **Directory browsing** with file icons and metadata
- 📝 **Markdown rendering** with syntax highlighting
- 🌙 **Dark mode support** with toggle button
- 🎨 **Syntax highlighting** for code files (JavaScript, Python, HTML, CSS, etc.)
- 🔒 **Security** with path traversal protection
- 📋 **Gitignore support** - respects .gitignore files
- 🚀 **Fast and lightweight** - no build process required

## Installation

### Global Installation

```bash
npm install -g docs-server
```

### Local Installation

```bash
npm install --save-dev docs-server
```

## Usage

### Command Line

```bash
# Serve current directory on port 4040
docs-server

# Serve specific directory
docs-server ./docs

# Serve on custom port
docs-server ./docs 8080
```

### npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "docs": "docs-server docs",
    "docs:dev": "docs-server docs 3000"
  }
}
```

Then run:

```bash
npm run docs
```

### Programmatic Usage

```javascript
const { spawn } = require('child_process');

// Start docs server
const server = spawn('docs-server', ['./docs', '4040']);
```

## Configuration

### Gitignore Support

The server automatically respects `.gitignore` files in your project. Files and directories matching gitignore patterns will be hidden from the file browser and return 404 when accessed directly.

### Supported File Types

- **Markdown** (.md) - Rendered with syntax highlighting
- **HTML** (.html, .htm) - Displayed with navigation header
- **JavaScript** (.js) - Syntax highlighted
- **TypeScript** (.ts) - Syntax highlighted
- **Python** (.py) - Syntax highlighted
- **CSS** (.css) - Syntax highlighted
- **JSON** (.json) - Syntax highlighted
- **YAML** (.yml, .yaml) - Syntax highlighted
- **Text files** (.txt) - Plain text display
- **Images** - Served as static files
- **Other files** - Served as downloads

### Language Detection

The server can detect programming languages even for files without extensions by analyzing:
- Shebang lines (`#!/usr/bin/env node`)
- File content patterns
- Common keywords and syntax

## Examples

### Basic Documentation Server

```bash
# Create a docs directory
mkdir docs
echo "# Welcome to My Docs" > docs/index.md

# Start server
docs-server docs

# Visit http://localhost:4040
```

### Project Documentation

```bash
# In your project root
npm install --save-dev docs-server

# Add to package.json
{
  "scripts": {
    "docs": "docs-server docs",
    "docs:api": "docs-server api-docs 3001"
  }
}

# Run
npm run docs
```

## API

The server exposes a single HTTP endpoint:

- `GET /*` - Serves files and directories based on the request path

## Security

- **Path traversal protection** - Prevents access to files outside the served directory
- **Gitignore filtering** - Automatically hides sensitive files
- **Safe file serving** - Only serves files within the specified root directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### 1.0.0
- Initial release
- Directory browsing with file metadata
- Markdown rendering with syntax highlighting
- Dark mode support
- Gitignore integration
- Security improvements
- Modular architecture