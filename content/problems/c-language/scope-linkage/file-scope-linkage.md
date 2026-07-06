+++
date = '2026-07-06T13:38:00+05:30'
draft = false
title = 'File Scope and External Linkage'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 8
weight = 2
initial_code = '''// file1.c demonstration (simulated in single file)
#include <stdio.h>

int file_global = 42;  // File scope, external linkage

static int file_static = 99;  // File scope, internal linkage

void demo_file_scope(void) {
    // Can access both variables
    printf("Global: %d\\n", file_global);
    printf("Static: %d\\n", file_static);
}

int main(void) {
    demo_file_scope();
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Global: 42\\nStatic: 99'
+++

## Problem Statement

Declare a file-scope variable (external linkage) and a `static` file-scope variable (internal linkage). Access both from within a function in the same file. Explain that the `static` variable would not be accessible from another `.c` file.

## Theory and Concepts

- **File scope** (also called global scope): from declaration to end of the file.
- Variables declared outside functions have file scope.
- `static` at file scope gives **internal linkage** — the variable is local to the translation unit.
- Without `static`, file-scope variables have **external linkage** — they can be accessed from other files using `extern`.
- File-scope variables are initialized to zero by default if no explicit initializer is given.

## Real World Application

File-scope variables are used for module-level state in multi-file programs. The `static` qualifier is crucial for encapsulation — hiding implementation details within a .c file so that other modules can't accidentally access internal state.
