# PyjamaCode

A Hugo-based coding platform for embedded-systems software and firmware education. Lessons are authored as Markdown files, and each chapter renders as an interactive platform with a course sidebar, a content pane (Lecture / Reading / Quiz / Challenge tabs), and — for coding chapters — a live editor backed by a judge server.

Beyond the editor, the platform ships with learner features on top of Firebase:

- **Accounts** — email/password and Google sign-in (Firebase Auth).
- **Cloud sync** — submissions, notes, quiz results, and per-chapter tabs saved to Firestore (bookmarks stay local to the browser).
- **Dashboard** — per-course progress tracking with resume links.
- **Notes** — a per-chapter Markdown editor with live preview, floating/docking, and `.md`/PDF export.
- **Bookmarks**, **search**, and **resizable panes**.

## Table of contents

- [Project structure](#project-structure)
- [Prerequisites & setup](#prerequisites--setup)
- [Site configuration](#site-configuration)
- [Creating a course](#creating-a-course)
  - [Course landing page](#course-landing-page)
  - [Course groups](#course-groups)
- [Creating a chapter (lesson)](#creating-a-chapter-lesson)
  - [Chapter layouts: reading vs code](#chapter-layouts-reading-vs-code)
  - [Front matter](#front-matter)
  - [Section markers](#section-markers)
- [Starter code](#starter-code)
- [Runnable code snippets](#runnable-code-snippets)
- [Code listings & content rendering](#code-listings--content-rendering)
- [Auth-gated content](#auth-gated-content)
- [Videos](#videos)
- [Quizzes](#quizzes)
- [Notes](#notes)
- [Bookmarks & search](#bookmarks--search)
- [Dashboard & progress](#dashboard--progress)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Accounts & gating](#accounts--gating)
- [Cloud sync & sessions](#cloud-sync--sessions)
- [Theme](#theme)
- [Check command (`run_check`)](#check-command-run_check)
- [Ordering & weights](#ordering--weights)
- [The judge server](#the-judge-server)
- [Theme & customization](#theme--customization)
- [Deployment](#deployment)

## Project structure

```
coding-platform/
├── content/
│   ├── dashboard.md                # /dashboard/ (signed-in progress page)
│   └── courses/
│       └── <course>/               # a course; renders as a sidebar topic
│           ├── _index.md           # course landing page (/courses/<course>/)
│           ├── <subtopic>/         # collapsible subtopic in the sidebar
│           │   ├── <chapter>.md
│           │   └── <chapter>/
│           │       └── index.md    # leaf-bundle chapter (can bundle images, etc.)
│           └── ...
├── data/
│   └── course_groups.yaml          # sidebar groups (which course appears where)
├── layouts/
│   └── courses/list.html           # course landing page layout (section override)
├── static/                         # logo.png, og.png, pc.png, images/
├── server/                         # judge server (git submodule: cafe-checker, Go)
├── themes/pyjamacode/
│   ├── assets/
│   │   ├── css/main.css            # palette, layout, typography
│   │   └── js/
│   │       ├── auth.js             # Firebase auth helpers
│   │       └── main.js             # platform logic (sidebar, tabs, editor, judge)
│   └── layouts/
│       ├── _default/
│       │   ├── baseof.html
│       │   ├── single.html         # reading-layout chapter
│       │   ├── code.html           # code-layout chapter (editor + console)
│       │   ├── dashboard.html      # /dashboard/
│       │   ├── list.html
│       │   └── _markup/render-codeblock.html
│       ├── _partials/
│       │   ├── head.html, header.html, footer.html
│       │   ├── platform.html       # platform pane markup
│       │   ├── parse-sections.html # section-marker parser
│       │   ├── landing.html        # home page
│       │   ├── dashboard-content.html
│       │   └── head/…              # css/js/firebase/app-config/opengraph
│       ├── index.html              # home (landing)
│       └── shortcodes/
│           ├── starter.html
│           ├── run_check.html
│           ├── youtube.html
│           └── vimeo.html
├── hugo.toml                       # site configuration
├── backend.md                      # design notes for the judge backend
└── README.md
```

## Prerequisites & setup

- [Hugo](https://gohugo.io/installation/) (extended, v0.158.0+)
- A modern browser; the site loads Bootstrap, CodeMirror, highlight.js, marked, Typed.js, html2canvas, jsPDF, and the Firebase SDK from CDNs
- The judge server (see [The judge server](#the-judge-server)) for running/checking code
- A Firebase project (optional) for accounts and cloud sync

Clone with the judge submodule:

```bash
git clone --recurse-submodules <repo>
# or, if already cloned:
git submodule update --init --recursive
```

Build the site:

```bash
hugo --minify
```

Run the dev server (drafts included):

```bash
hugo server --buildDrafts
```

Open `http://localhost:1313/`.

> **Note:** don't leave `hugo server` running while editing theme assets (`main.js`/`main.css`) — Hugo's dev server rebuilds and can overwrite in-flight source edits and serve stale bundles. Stop it, edit, then restart.

## Site configuration

`hugo.toml` holds the site-wide settings. The generic parameters are:

| Param | Default | Purpose |
|-------|---------|---------|
| `params.author` | – | Copyright holder shown in the footer. |
| `params.description` | – | Default meta/OG description. |
| `params.judgeUrl` | `null` | Base URL of the judge. If unset, the client falls back to `http://127.0.0.1:4000` on localhost and `https://judge.code.pyjamacafe.com` elsewhere. |
| `params.maxSessions` | `1` | Concurrent signed-in sessions allowed per account (`0` = unlimited). |
| `params.allowAuthModalClose` | `false` | Allow the sign-in modal to be dismissed (close button + backdrop click). When `false` it stays on screen until sign-in. |
| `params.mobileBreakpoint` | `800` | Viewport width (px) below which panes become mobile overlays. |
| `params.og_image` | `og.png` | Fallback Open Graph image. |
| `params.firebase.*` | – | Firebase web config (see below). |

Firebase auth + Firestore sync are enabled by adding a `[params.firebase]` block:

```toml
[params.firebase]
  apiKey = '…'
  authDomain = '…'
  projectId = '…'
  storageBucket = '…'
  messagingSenderId = '…'
  appId = '…'
```

Without it, `auth.js` never initializes; the site still renders, but sign-in and cloud sync are unavailable (gated content stays blurred and the editor prompts for sign-in).

Other notable settings in this repo:

```toml
[markup.goldmark.renderer]
  unsafe = true                 # allow raw HTML in Markdown (used by <!--gated--> gates)
[markup.goldmark.parser.attribute]
  block = true                  # enable ```lang {file=… caption=… run=… cmd=…} attributes
[markup.highlight]
  noClasses = true              # highlighting is done client-side by highlight.js
disableKinds = ['taxonomy', 'term']
```

## Creating a course

A course is a directory under `content/courses/`:

```
content/courses/my-course/
├── _index.md          # course landing page
├── getting-started/   # a subtopic (collapsible section in the sidebar)
│   ├── first-lesson.md
│   └── second-lesson.md
└── advanced/
    └── deeper-topic/
        └── third-lesson.md
```

The path drives the sidebar tree:

- the **course directory** (`my-course`) is a top-level **topic** (its display title comes from the course `_index.md`),
- the **first folder** (`getting-started`) is a **subtopic**,
- the **Markdown file** is a **chapter** (leaf). A chapter can also be a leaf bundle (`<folder>/index.md`) so it can carry its own resources.

### Course landing page

`_index.md` renders the course landing page (two-pane layout via `layouts/courses/list.html`):

```toml
+++
title = 'My Course'
og_image = 'my-course.png'            # shown on the dashboard card
description = 'One-line description of the course.'
date = '2026-01-01T00:00:00+05:30'
draft = false
+++

Welcome to **My Course** — an intro sentence.

...body markdown appears in the center pane...
```

- Everything before `<!--reading-->` is the **center** intro content.
- The `<!--reading-->` … `<!--/reading-->` section is rendered in the **right reading pane** (optional).
- `og_image` (a page resource or a path) and `description` are also used on the dashboard course card.

```markdown
<!--reading-->

# Course materials

- Book: *C Ninja, in Pyjama*
- Lab repo, slides…
<!--/reading-->
```

### Course groups

The sidebar groups courses under collapsible headers defined in `data/course_groups.yaml`. A course can appear in **several** groups:

```yaml
- title: Essentials
  weight: 1          # lower = higher up the sidebar
  courses:
    - es001
- title: Advanced
  weight: 2
  courses:
    - my-course
```

`courses` are the directory names under `content/courses/`. Topics not listed in any group render at the top without a header.

## Creating a chapter (lesson)

Each chapter is a Markdown file. Its URL path is derived from `content/courses/<course>/<subtopic>/<chapter>.md`.

### Chapter layouts: reading vs code

Every chapter uses the **reading layout** by default (`_default/single.html`): a sidebar, the content pane with tabs, and a right-side **reading pane** (from the `<!--reading-->` section). There is **no code editor**.

To give a chapter a code editor + console, set `layout = "code"` in its front matter. It then renders via `_default/code.html` (the editor pane on the right) and, if the chapter has a `<!--reading-->` section, a **Reading tab** is added between the Lecture and Quiz tabs.

| front matter                | layout           | right side            |
|-----------------------------|------------------|-----------------------|
| (none / `layout="reading"`) | reading          | reading pane          |
| `layout="code"`             | code             | editor + console      |

On the reading layout, the merged Reading tab is hidden on desktop (the right reading pane shows instead); on mobile it becomes a tab.

### Front matter

```toml
+++
date = '2026-01-01T00:00:00+05:30'
draft = false
title = 'A Lesson Title'
difficulty = 'easy'          # easy | medium | hard
language = 'c'               # editor syntax mode (c, cpp, python, assembly, shell, …)
topic_weight = 1             # orders topics (courses) within a group
subtopic_weight = 1          # orders subtopics within a topic
weight = 1                   # orders chapters within a subtopic
layout = "code"              # optional: code layout
freeRuns = true              # optional: allow signed-out visitors 3 free code runs
+++
```

- `difficulty` controls the badge and tint on the Challenge tab.
- `language` sets the editor's syntax mode for code chapters (the judge does not use it — see [Check command](#check-command-run_check)).
- `freeRuns` (optional): when `true`, signed-out visitors may run code **three times** on the chapter (editor Check and runnable snippets combined) before the sign-in modal appears on every further attempt. The count is per chapter and resets on sign-in.
- Lower `topic_weight` / `subtopic_weight` / `weight` sort earlier (see [Ordering & weights](#ordering--weights)).

> A default chapter archetype (`archetypes/problems.md`) still scaffolds `initial_code` and `[[test_cases]]` front matter from an older design. Those fields are currently **not used** by the platform — starter files come from `<!--code-->` / `{{< starter >}}`, and checks come from `run_check` (see below).

### Section markers

A chapter's body is split into sections. Wrap each section in an opening and closing HTML comment (**tag syntax**):

````markdown
<!--challenge-->
...problem statement...
<!--/challenge-->

<!--explanation-->
...lecture...
<!--/explanation-->

<!--reading-->
...reference material...
<!--/reading-->

<!--code-->
```c {file="main.c"}
...
```
<!--/code-->

<!--quiz-->
...questions...
<!--/quiz-->
````

| Tag | Where it appears |
|-----|------------------|
| `<!--challenge-->` … `<!--/challenge-->` | Challenge tab (optional; if omitted, the text before the first tag is the Challenge) |
| `<!--explanation-->` … `<!--/explanation-->` | Lecture tab |
| `<!--reading-->` … `<!--/reading-->` | Reading pane (reading layout) or Reading tab (code layout) |
| `<!--code-->` … `<!--/code-->` | Editor starter files (code layout) |
| `<!--quiz-->` … `<!--/quiz-->` | Quiz tab |

- **Both tags are required** — a lone/unpaired tag fails the build with an error.
- **Whitespace is allowed** inside a tag: `<!-- explanation -->`, `<!-- /explanation -->`.
- A tag is always treated as a delimiter. To use the literal text, escape it with a backslash: `\<!--challenge-->`.
- Don't mix tag syntax and legacy markers in one file.

The **legacy marker syntax** (`===CHALLENGE===`, `===EXPLANATION===`, `===READING===`, `===CODE===`, `===QUIZ===`) is still supported: each section runs from its marker to the next marker, and markers may appear in any order. It exists for courses not yet migrated.

On load, the chapter defaults to the **Lecture** tab when one exists, otherwise Challenge. A `?tab=` query parameter (`challenge`, `explanation`, `reading`, `quiz`) overrides this, and the last-viewed tab per chapter is remembered. Tabs are deep-linkable and shareable: clicking a tab updates the URL, and a `?tab=` link survives a reload.

Example:

````markdown
+++
title = 'Blinking an LED'
difficulty = 'easy'
language = 'c'
+++

<!--challenge-->

## Problem Statement
Write a program that blinks an LED on GPIO 13.

<!--/challenge-->

<!--explanation-->

Blinking an LED is the "Hello, world" of embedded systems.

<!--/explanation-->

<!--code-->

```c {file="main.c"}
#include <stdint.h>
void gpio_set(int pin, int value);
void delay_ms(int ms);

int main(void) {
    for (;;) {
        gpio_set(13, 1); delay_ms(500);
        gpio_set(13, 0); delay_ms(500);
    }
    return 0;
}
```
<!--/code-->

<!--quiz-->

Based on the lecture, answer the following.

<!--question-->
## What is the GPIO pin used in the lecture?

- [ ] 12
- [x] 13
- [ ] 14

Correct: B
<!--/question-->
<!--/quiz-->
````

## Starter code

The editor is populated with starter files. Two ways to declare them (code layout only):

1. **`<!--code-->` fenced blocks** — each fenced block becomes one file; use the braced `file=` attribute for the filename:

````markdown
<!--code-->

```c {file="main.c"}
#include <stdio.h>
int main(void) { return 0; }
```

```makefile {file="Makefile"}
all:
	gcc main.c -o app
```
<!--/code-->
````

2. **`{{< starter >}}` shortcode** — repeat for multiple files:

```markdown
{{< starter lang="c" file="main.c" >}}
#include <stdio.h>
int main(void) { return 0; }
{{< /starter >}}

{{< starter lang="asm" file="main.S" >}}
.init
add x2, x1, x8
{{< /starter >}}
```

Precedence in the editor: **`starter` shortcodes → `<!--code-->`**. The `starter` shortcodes are read from the **Challenge** and **Lecture** sections, so place them there (typically `<!--challenge-->`). Each file becomes a tab; **Check** sends all tabs to the judge together. Edited files get an unsaved dot until saved/synced.

## Runnable code snippets

A code block in the lecture/reading content can be made **runnable** (a ▶ Run button in its title bar) by giving it a `cmd`:

````markdown
```bash {file="uname" cmd="uname -a"}
uname
```
````

- `cmd` is the shell command executed on the judge, with the snippet written to a file named by `file` in the working directory. A block without `cmd` is not runnable (it gets a **Copy** button instead).
- The output appears in a collapsible drop-down below the block, with ANSI colors translated.
- The block stays read-only; Reset clears the output.
- Without `file`, the snippet is written as `main.<lang>`.

> Note the syntax: attributes must be inside braces `{ ... }` and values quoted, e.g. `{file="hello.c" cmd="gcc hello.c -o hello && ./hello"}`.

## Code listings & content rendering

Every fenced code block in the content panes is enhanced client-side:

- A **title bar** shows the block's `file` (or its language). Non-runnable blocks get a **Copy** button; runnable blocks get **Run/Reset**.
- Line numbers are rendered, and clicking a line highlights it.
- Each block gets a caption (`Listing N.` plus the `caption="…"` attribute when present, or the block's `file` name) with a `#listing-N-…` anchor suffixed by the caption/filename slug, so you can deep-link and share it.

Other content niceties:

- Heading anchors are auto-generated so sections are linkable.
- Standalone images get a `Figure N. <alt text>` caption below (the alt text is the description); like the code listings, the caption is a linkable `#figure-N-…` anchor.
- Images open in a zoom overlay when clicked.
- Bare YouTube watch URLs in prose are auto-embedded as responsive players.

## Auth-gated content

Wrap content in HTML comments to blur it for signed-out visitors, with a sign-in overlay:

```markdown
<!--gated-->
This paragraph is only readable after signing in.
<!--/gated-->
```

Requires `markup.goldmark.renderer.unsafe = true` (set in this repo). The gate is re-evaluated on every auth state change.

## Videos

```markdown
{{< youtube id="qundvme1Tik" title="Computer History Documentary" >}}
{{< vimeo id="1229095203" title="The web and local setup" >}}
```

- `id` is the video's ID (for YouTube, the part after `v=`).
- `title` is shown as the caption.
- Both render as responsive 16:9 players sized to the content column. Vimeo uses a custom player with quality/speed controls and a poster image.

## Quizzes

The `<!--quiz-->` section holds the quiz content. It is **rendered as Markdown** (so images, videos, code blocks, and prose all work), and each question lives inside a `<!--question-->` … `<!--/question-->` block:

```markdown
<!--quiz-->

Based on the lecture, answer the following.

![Terminal](/images/terminal.png)

<!--question-->
## Which register does `jal` save the return address into?

- [ ] t0
- [x] ra
- [ ] sp

Correct: B
Explanation: `jal` stores the return address in the link register `ra`.
<!--/question-->
<!--/quiz-->
```

Inside a question block:

- The first `## ` line is the question title; anything between it and the options is rendered question body (images, code, prose, …).
- Options are `- [ ]` (wrong) / `- [x]` (correct) lines; `Correct: <letter>` overrides the `[x]` marker.
- `Explanation:` starts the explanation — everything after it (multiple lines of Markdown) is shown when answered correctly.
- Prose outside the question blocks renders around the questions in order.

- Answering correctly locks the question and reveals the explanation; an incorrect answer shows a hint nudge so the learner can retry.
- A **Reset Quiz** button clears the chapter's answers.
- Results are stored per chapter and feed the dashboard progress meter.
- Chapters still using the **legacy format** (bare `## ` questions with `- [ ]`/`- [x]` options, no `<!--question-->` tags) continue to work via the client-side line parser.

## Notes

Each chapter has a per-chapter notes pane (docked at the bottom of the center pane, and minimized by default):

- A Markdown editor (CodeMirror) with a live **preview** toggle — double-click the preview to jump back into editing at that line.
- **Minimize / maximize / restore**, plus a draggable, resizable **floating** notes window when minimized.
- **Export** notes as Markdown (`.md`) or PDF.
- Notes are stored locally and synced to the cloud when signed in.
- Signed-out visitors who finish editing notes get a dismissable prompt to sign in so the notes are saved online; the local notes are always kept.

## Bookmarks & search

- The **bookmark** button in the center-pane title bar toggles a bookmark for the current chapter.
- The sidebar has two tabs: **Courses** (the tree) and **Bookmarks** (all bookmarked chapters).
- The sidebar search box filters chapters by title (and bookmarks when that tab is active).

## Dashboard & progress

Signed-in users land on `/dashboard/` instead of the home page. The dashboard lists every course as a card with a progress bar, completion count, and a **Start / Resume / Start Again** link.

A chapter counts as:

- **completed** when its code check is `Accepted` and all quiz questions are answered correctly (or there is no quiz),
- **in progress** when it has partial quiz answers, a started code submission, or an accepted submission with unanswered quiz questions.

Progress is computed from synced submissions and quiz results.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl`/`Cmd` + `S` | Save the current chapter's code and notes, then sync to the cloud. |
| `Esc` | Leave notes preview mode (returns to editing). |

## Accounts & gating

Auth is handled by Firebase (`assets/js/auth.js`): email/password and Google sign-in. The header shows **Sign in** when signed out and an avatar menu (Dashboard, sync status, Reset Profile, Sign out) when signed in.

Signed-out visitors can browse lessons freely — there is no free-view or free-use counting. Sign-in is required for:

- **Running code** — the **Check** button and runnable snippets (unless the chapter sets `freeRuns = true`, which allows three anonymous runs).
- **Answering quizzes** — selecting a quiz answer.
- **Gated content** — anything wrapped in `<!--gated-->` … `<!--/gated-->` (blurred with a "Sign in" overlay).

These open the sign-in modal via `openAuthModal`. It stays on screen until sign-in unless `allowAuthModalClose = true`, in which case it shows a close button and can be dismissed by clicking the backdrop.

**Reset Profile** deletes all local + cloud data for the account (guarded by a generated confirmation code) and signals other open sessions.

## Cloud sync & sessions

When signed in, the following are persisted to Firestore under the user's document, and pulled on first load:

- `codes` — per-chapter editor contents + status,
- `notes` — per-chapter notes,
- `quizzes` — per-chapter quiz results,
- `meta/profile` — active tab, tab map, and submission status map.

Sync is **user-driven** (the sync indicator in the avatar menu / footer, or `Ctrl`/`Cmd` + `S`); the indicator shows *Synced* / *Unsaved changes*. A confirmation modal lists the chapters with pending changes before pushing.

`maxSessions` limits concurrent signed-in sessions. When the limit is exceeded, the oldest session is evicted and redirected to `/?session=expired`. Set `maxSessions = 0` to disable enforcement.

## Theme

The platform is dark-only. There is no theme selector, no light mode, and no OS `prefers-color-scheme` detection — the app and its CodeMirror/highlight.js syntax themes are always dark.

## Check command (`run_check`)

The **Check** button runs the command a chapter defines with the `run_check` shortcode. The command runs on the judge with the student's files in the working directory, and its exit code decides pass/fail:

```markdown
{{< run_check >}}
gcc -Wall main.c -o main && \
echo "3 4" | ./main | grep -qx "7" && \
echo "10 20" | ./main | grep -qx "30"
{{< /run_check >}}
```

Or as a parameter: `{{< run_check cmd="make test" >}}`.

- Exit code `0` → **Accepted**; otherwise → **Wrong Answer**.
- **Required for Check**: the judge has no built-in compile/run, so a code chapter must define a `run_check` command. Without one, Check reports “No check command is defined for this lesson.”
- Place it in the **Challenge** or **Lecture** section (the client reads the command from those sections); the first `run_check` found is used.
- The command is not tied to `language`; `language` only sets the editor's syntax mode.

## Ordering & weights

- **Sidebar groups**: order by `weight` in `data/course_groups.yaml`.
- **Topics (courses) within a group**: by the smallest `topic_weight` among their chapters.
- **Subtopics within a topic**: by `subtopic_weight`.
- **Chapters within a subtopic**: by `weight`.

Smaller numbers sort first. Defaults are `99` when a weight is missing.

## The judge server

Run/Check commands are executed by a judge server. Point it to a local instance, or configure the URL in `hugo.toml`:

```toml
[params]
  judgeUrl = "http://127.0.0.1:4000"
```

The judge lives in the `server/` submodule (`cafe-checker`, Go). To run it locally:

```bash
docker compose up --build   # in server/
```

The judge exposes:

| Endpoint | Body | Behavior |
|----------|------|----------|
| `POST /api/submit` | `{ files, command }` | Writes the files to a temp dir, then runs `sh -c "<command>"` with them in the working directory. Returns an error if `command` is empty. |
| `GET /api/health` | – | Health check. |

The judge has **no built-in language support** — it only runs the command you give it (the chapter's `run_check` for Check, or a snippet's `cmd`). Multi-file builds (e.g. a `Makefile`) and any toolchain the command needs are entirely up to that command; the container ships `gcc`, `g++`, `python3`, `binutils`, and `make`.

The command is bounded by a 5-second timeout. The container (`server/Dockerfile` + `docker-compose.yml`) runs as a non-root user with dropped capabilities, a read-only root filesystem, and a size-limited `tmpfs` for `/tmp/judge`, and does not require network access.

The front-end editor supports these CodeMirror modes: `c`, `cpp`, `python`, `assembly`, `shell`/`bash`, `makefile`, and `text` (among others).

## Theme & customization

- `themes/pyjamacode/assets/css/main.css` — palette (dark theme, background, panes), layout, typography.
- `themes/pyjamacode/assets/js/main.js` — platform logic: sidebar tree, tabs, editor, notes, judge calls, sync.
- `themes/pyjamacode/assets/js/auth.js` — Firebase auth helpers.
- `themes/pyjamacode/layouts/_partials/platform.html` — the platform pane markup (sidebar, content tabs, editor/reading pane).
- `themes/pyjamacode/layouts/_partials/parse-sections.html` — the section-marker parser.
- `themes/pyjamacode/layouts/_default/single.html` / `code.html` — chapter layout wrappers.
- `themes/pyjamacode/layouts/_default/_markup/render-codeblock.html` — emits `{title, note, run, cmd}` attributes for client-side enhancement.
- `themes/pyjamacode/layouts/shortcodes/` — `starter`, `run_check`, `youtube`, `vimeo`.

## Deployment

Build the production site:

```bash
hugo --minify
```

Deploy the contents of `public/` to your host. A GitHub Actions workflow (`.github/workflows/deploy.yml`) is included for GitHub Pages — it checks out submodules, builds with Hugo extended `0.158.0`, and publishes `public/`. Set **Build and deployment** → **GitHub Actions** in the repo's Pages settings, and push to `main`.

## License

All rights reserved.
