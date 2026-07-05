# PyjamaCode

A Hugo-based coding platform for embedded systems software and firmware development. It presents a three-pane interface: a question sidebar, a live code editor with syntax highlighting, and a question-details pane.

## Features

- **Hugo static site** with a custom theme named `pyjamacode`
- **Problems as Markdown posts** under `content/problems/`
- **Initial starter code** and **test cases** defined in each problem's front matter
- **Syntax-highlighted code editor** powered by CodeMirror 5
- **GitHub-inspired light/dark themes** with a toggle
- **Resizable panes** for the sidebar, editor, question pane, and console
- **Monospace typography** using JetBrains Mono

## Prerequisites

- [Hugo](https://gohugo.io/installation/) (extended version recommended, v0.146.0+)
- A modern web browser
- Internet connection (CodeMirror and fonts are loaded from CDNs)

## Project structure

```
coding-platform/
├── archetypes/
│   └── problems.md          # Template for new problem posts
├── content/
│   └── problems/            # Problem Markdown posts
├── themes/
│   └── pyjamacode/          # Custom Hugo theme
│       ├── archetypes/
│       ├── assets/
│       │   ├── css/
│       │   └── js/
│       ├── layouts/
│       └── theme.toml
├── hugo.toml                # Site configuration
└── README.md
```

## Setup

1. Clone or navigate to the project directory:

   ```bash
   cd /Users/piyush/workspace/coding-platform
   ```

2. Verify Hugo is installed:

   ```bash
   hugo version
   ```

3. Build the site:

   ```bash
   hugo --minify
   ```

   The generated site is written to `public/`.

## Launch the development environment

Start Hugo's built-in development server with drafts enabled:

```bash
hugo server --buildDrafts --disableFastRender
```

Open `http://localhost:1313/` in your browser.

To stop the server, press `Ctrl+C`.

## Add a new problem

Use the `problems` archetype:

```bash
hugo new content problems/my-problem.md
```

This creates a Markdown file with the required front-matter fields:

```toml
+++
date = '2026-01-01T00:00:00+00:00'
draft = false
title = 'My Problem'
difficulty = 'easy'
initial_code = '''
// Starter code shown in the editor
'''

[[test_cases]]
input = ''
expected = 'Expected output'
+++

Describe the problem here. Markdown is supported.
```

- `difficulty`: `easy`, `medium`, or `hard`
- `initial_code`: starter code loaded into the editor
- `test_cases`: list of test cases with `input` and `expected` fields
- Body: the rendered problem description shown in the right pane

## Theme customization

The theme lives in `themes/pyjamacode/`:

- `assets/css/main.css` — theme styles, GitHub palette, layout
- `assets/js/main.js` — platform logic, CodeMirror setup, resizers
- `layouts/_partials/platform.html` — three-pane layout

## Deployment

Build the production site:

```bash
hugo --minify
```

Then deploy the contents of the `public/` directory to your hosting provider.

## License

MIT
