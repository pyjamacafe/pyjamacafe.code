+++
date = '2026-07-06T13:35:00+05:30'
draft = false
title = 'Static Functions (Internal Linkage)'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 7
weight = 3
initial_code = '''#include <stdio.h>

// Internal linkage — only visible in this file
static int helper(int x) {
    return x * x;
}

// External linkage — visible to other files
int compute(int a, int b) {
    return helper(a) + helper(b);
}

int main(void) {
    printf("Result: %d\\n", compute(3, 4));
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Result: 25'
+++

## Problem Statement

Write a `static` helper function that is only visible within its translation unit and a non-static function that calls it. Demonstrate that the internal function cannot be called from another file (by trying to use `extern` in a comment).

## Theory and Concepts

- `static` on a function gives it **internal linkage** — it is only visible within the same translation unit (.c file).
- Non-static (regular) functions have **external linkage** — visible across all files of the program.
- Using `static` for file-internal functions is a good practice; it reduces namespace pollution and enables compiler optimizations.
- Internal linkage also prevents accidental name clashes with other files.

## Real World Application

Most non-trivial C projects use `static` for internal helper functions — utility functions in a module that are not part of the public API, hardware abstraction layer (HAL) internals, and callback wrappers that should not be exposed.
