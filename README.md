# PyjamaCode

A Hugo-based coding platform for embedded-systems software and firmware education. Lessons are authored as Markdown files, and each chapter renders as an interactive platform with a course sidebar, a content pane (Challenge / Lecture / Reading / Quiz tabs), and — for coding chapters — a live editor with a terminal backed by a judge server.

## Table of contents

- [Project structure](#project-structure)
- [Prerequisites & setup](#prerequisites--setup)
- [Creating a course](#creating-a-course)
  - [Course landing page](#course-landing-page)
  - [Course groups](#course-groups)
- [Creating a chapter (lesson)](#creating-a-chapter-lesson)
  - [Chapter layouts: reading vs code](#chapter-layouts-reading-vs-code)
  - [Front matter](#front-matter)
  - [Section markers](#section-markers)
- [Starter code](#starter-code)
- [Runnable code snippets](#runnable-code-snippets)
- [Check command (`run_check`)](#check-command-run_check)
- [Videos](#videos)
- [Quizzes](#quizzes)
- [Ordering & weights](#ordering--weights)
- [The judge server](#the-judge-server)
- [Theme & customization](#theme--customization)
- [Deployment](#deployment)

## Project structure

```
coding-platform/
├── content/
│   └── courses/
│       └── <course>/            # one directory per course
│           ├── _index.md        # course landing page
│           ├── <topic>/         # a topic (collapsible section in the sidebar)
│           │   ├── <subtopic>/
│           │   │   └── <chapter>.md
│           │   └── ...
│           └── ...
├── data/
│   └── course_groups.yaml       # sidebar groups (which course appears where)
├── layouts/
│   └── courses/list.html        # course landing page layout
├── themes/
│   └── pyjamacode/
│       ├── assets/
│       │   ├── css/main.css
│       │   └── js/main.js
│       └── layouts/
│           ├── _default/
│           │   ├── single.html  # reading-layout chapter
│           │   └── code.html    # code-layout chapter (editor + terminal)
│           ├── _partials/
│           │   ├── platform.html
│           │   └── parse-sections.html
│           └── shortcodes/
│               ├── starter.html
│               ├── run_check.html
│               ├── youtube.html
│               └── vimeo.html
├── hugo.toml                    # site configuration
└── README.md
```

## Prerequisites & setup

- [Hugo](https://gohugo.io/installation/) (extended, v0.158.0+)
- A modern browser; the site loads CodeMirror, fonts, and highlight.js from CDNs
- The judge server (see [The judge server](#the-judge-server)) for running/checking code

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

## Creating a course

A course is a directory under `content/courses/`:

```
content/courses/my-course/
├── _index.md          # course landing page
├── topic-one/
│   └── sub-topic/
│       └── first-lesson.md
└── topic-two/
    └── sub-topic/
        └── second-lesson.md
```

The path nesting (`topic/sub-topic/chapter`) drives the sidebar tree: each course is a top-level entry, the first path segment is a topic, the second is a subtopic, and the chapter is a leaf.

### Course landing page

`_index.md` renders the course landing page (two-pane sidebar layout via `layouts/courses/list.html`):

```toml
+++
title = 'My Course'
og_image = 'my-course.png'            # shown on the dashboard card
description = 'One-line description of the course.'
date = '2026-01-01T00:00:00+05:30'
draft = false
layout = "reading"
+++

Welcome to **My Course** — an intro sentence.

...body markdown appears in the center pane...
```

- Everything before `===READING===` is the **center** intro content.
- The `===READING===` section is rendered in the **right reading pane** (optional).

```markdown
===READING===

# Course materials

- Book: *C Ninja, in Pyjama*
- Lab repo, slides…
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

Each chapter is a Markdown file. Its URL path is derived from `content/courses/<course>/<topic>/<subtopic>/<chapter>.md`.

### Chapter layouts: reading vs code

Every chapter uses the **reading layout** by default (`_default/single.html`): a sidebar, the content pane with tabs, and a right-side **reading pane** (from `===READING===`). There is **no code editor**.

To give a chapter a code editor + terminal, set `layout = "code"` in its front matter. It then renders via `_default/code.html` (the editor pane on the right) and, if the chapter has a `===READING===` section, a **Reading tab** is added between the Lecture and Quiz tabs.

| front matter                | layout           | right side            |
|-----------------------------|------------------|-----------------------|
| (none / `layout="reading"`) | reading          | reading pane          |
| `layout="code"`             | code             | editor + terminal     |

### Front matter

```toml
+++
date = '2026-01-01T00:00:00+05:30'
draft = false
title = 'A Lesson Title'
difficulty = 'easy'          # easy | medium | hard
language = 'c'               # c | cpp | python | assembly
topic_weight = 1             # orders topics within a course
subtopic_weight = 1          # orders subtopics within a topic
weight = 1                   # orders chapters within a subtopic
layout = "code"              # optional: code layout
+++
```

- `difficulty` controls the badge and tint on the Challenge tab.
- `language` sets the editor mode / judge language for code chapters.
- Lower `topic_weight` / `subtopic_weight` / `weight` sort earlier (see [Ordering & weights](#ordering--weights)).

### Section markers

A chapter's body is split into sections by text markers. The markers can appear in **any order**; each section runs from its marker to the next marker. If `===CHALLENGE===` is absent, the text before the first marker is treated as the Challenge.

| Marker            | Where it appears                                  |
|-------------------|---------------------------------------------------|
| `===CHALLENGE===` | Challenge tab (optional; defaults to text before the first marker) |
| `===EXPLANATION===` | Lecture tab                                       |
| `===READING===`   | Reading pane (reading layout) or Reading tab (code layout) |
| `===CODE===`      | Editor starter files (code layout)                |
| `===QUIZ===`      | Quiz tab                                          |

Example:

```markdown
+++
title = 'Blinking an LED'
difficulty = 'easy'
language = 'c'
+++

## Problem Statement
Write a program that blinks an LED on GPIO 13.

===EXPLANATION===

Blinking an LED is the "Hello, world" of embedded systems.

===CODE===

```c {title="main.c"}
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

===QUIZ===

Based on the lecture, answer the following.

## What is the GPIO pin used in the lecture?

- [ ] 12
- [x] 13
- [ ] 14

Correct: B
```

## Starter code

The editor is populated with starter files. Two ways to declare them (code layout only):

1. **`===CODE===` fenced blocks** — each fenced block becomes one file; use the braced `title=` attribute for the filename:

````markdown
===CODE===

```c {title="main.c"}
#include <stdio.h>
int main(void) { return 0; }
```

```makefile {title="Makefile"}
all:
	gcc main.c -o app
```
````

2. **`{{< starter >}}` shortcode** — usable anywhere (typically `===CHALLENGE===`), repeat for multiple files:

```markdown
{{< starter lang="c" title="main.c" >}}
#include <stdio.h>
int main(void) { return 0; }
{{< /starter >}}

{{< starter lang="asm" title="main.S" >}}
.init
add x2, x1, x8
{{< /starter >}}
```

Precedence in the editor: **`starter` shortcodes → `===CODE===`**. Each file becomes a tab; **Check** sends all tabs to the judge together.

## Runnable code snippets

A code block in the lecture/reading content can be made **runnable** (a ▶ Run button in its title bar). Use braced attributes with a quoted `cmd`:

````markdown
```bash {title="uname" run="1" cmd="uname -a"}
uname
```
````

- `run="1"` adds the Run (and Reset) button.
- `cmd` is the shell command executed on the judge, with the snippet written to a file named by `title` in the working directory.
- The output appears in a collapsible drop-down below the block.
- The block stays read-only; Reset clears the output.

> Note the syntax: attributes must be inside braces `{ ... }` and values quoted, e.g. `{title="hello.c" run="1" cmd="gcc hello.c -o hello && ./hello"}`.

## Check command (`run_check`)

For code chapters, the **Check** button normally uses the judge's built-in compile/run for the chapter's `language`. To fully control the check (test harness, diffs, etc.), add a `run_check` shortcode — the command runs on the judge with the student's files in the working directory, and its exit code decides pass/fail:

```markdown
{{< run_check >}}
gcc -Wall main.c -o main && \
echo "3 4" | ./main | grep -qx "7" && \
echo "10 20" | ./main | grep -qx "30"
{{< /run_check >}}
```

Or as a parameter: `{{< run_check cmd="make test" >}}`.

- Exit code `0` → **Accepted**; otherwise → **Wrong Answer**.
- The command is not tied to a language config, so `language` can be anything when a `run_check` is present.

## Videos

```markdown
{{< youtube id="qundvme1Tik" title="Computer History Documentary" >}}
{{< vimeo id="1229095203" title="The web and local setup" >}}
```

- `id` is the video's ID (for YouTube, the part after `v=`).
- `title` is shown as the caption.
- Both render as responsive 16:9 players sized to the content column.

## Quizzes

The `===QUIZ===` section holds questions. Each question starts with `## ` and lists options with `- [ ]` (wrong) / `- [x]` (correct), followed by `Correct:` and an `Explanation:`:

```markdown
===QUIZ===

## Which register does `jal` save the return address into?

- [ ] t0
- [x] ra
- [ ] sp

Correct: B
Explanation: `jal` stores the return address in the link register `ra`.
```

The Quiz tab renders these interactively and tracks correctness.

## Ordering & weights

- **Sidebar groups**: order by `weight` in `data/course_groups.yaml`.
- **Courses within a group**: by the smallest `topic_weight` among their chapters.
- **Topics**: by `topic_weight`.
- **Subtopics**: by `subtopic_weight`.
- **Chapters within a subtopic**: by `weight`.

Smaller numbers sort first. Defaults are `99` when a weight is missing.

## The judge server

Run/Check and terminal commands are executed by a judge server. Point it to a local instance, or configure the URL in `hugo.toml`:

```toml
[params]
  judgeUrl = "http://127.0.0.1:4000"
```

The judge lives in the `server/` submodule (`cafe-checker`, Go). To run it locally:

```bash
docker compose up --build   # in server/
```

The front end POSTs `{ files, language, command? }` to `/api/submit`. When `command` is provided it runs `sh -c "<command>"` with the files present; otherwise it uses the built-in compile/run for the language.

## Theme & customization

- `themes/pyjamacode/assets/css/main.css` — palette (dark theme, background, panes), layout, typography.
- `themes/pyjamacode/assets/js/main.js` — platform logic: sidebar tree, tabs, editor, terminal, judge calls.
- `themes/pyjamacode/layouts/_partials/platform.html` — the platform pane markup (sidebar, content tabs, editor/reading pane).
- `themes/pyjamacode/layouts/_partials/parse-sections.html` — the section-marker parser.
- `themes/pyjamacode/layouts/_default/single.html` / `code.html` — chapter layout wrappers.

## Deployment

Build the production site:

```bash
hugo --minify
```

Deploy the contents of `public/` to your host. A GitHub Actions workflow (`.github/workflows/deploy.yml`) is included for GitHub Pages — set **Build and deployment** → **GitHub Actions** in the repo's Pages settings, and push to `main`.

## License

All rights reserved.