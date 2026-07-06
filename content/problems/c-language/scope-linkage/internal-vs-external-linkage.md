+++
date = '2026-07-06T14:25:00+05:30'
draft = false
title = 'Internal vs External Linkage'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 8
weight = 4
initial_code = '''#include <stdio.h>

// Internal linkage — only this file
static int internal_var = 10;

// External linkage — accessible from other files
int external_var = 20;

static void internal_func(void) {
    printf("Internal function called\\n");
}

void external_func(void) {
    printf("External function called\\n");
    internal_func();  // Can call internal functions within the same file
}

int main(void) {
    printf("Internal: %d\\n", internal_var);
    printf("External: %d\\n", external_var);
    external_func();
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Linkage types demonstrated'
+++

## Problem Statement

Declare both `static` (internal linkage) and non-static (external linkage) variables and functions. Access all from within the same file. Explain that the internal-linkage items would not be accessible if another `.c` file tried to use them with `extern`.

## Theory and Concepts

- **External linkage**: the symbol is visible across the entire program (all translation units). Default for file-scope variables and functions.
- **Internal linkage**: the symbol is only visible within its translation unit. Achieved with `static` keyword.
- **No linkage**: block-scope variables (automatic and static locals) have no linkage.
- `extern` keyword declares a symbol with external linkage that is defined elsewhere.
- A function declared `static` cannot be called from other files, even if declared with `extern` there.

## Real World Application

Managing linkage is crucial for large projects — use `static` for module-internal helpers and variables to prevent name collisions. The distinction between internal and external linkage is the foundation of C's module system.
