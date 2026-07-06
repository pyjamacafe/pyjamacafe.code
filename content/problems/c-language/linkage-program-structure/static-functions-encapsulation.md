+++
date = '2026-07-06T14:19:00+05:30'
draft = false
title = 'Static Functions in Multi-file Projects'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 18
weight = 4
initial_code = '''// Simulating static functions for encapsulation
#include <stdio.h>

// Internal helper — not accessible outside this "module"
static int square(int x) {
    return x * x;
}

// Public API — accessible to other files
int compute_squares(int a, int b) {
    return square(a) + square(b);
}

int main(void) {
    int result = compute_squares(3, 4);
    printf("3^2 + 4^2 = %d\\n", result);

    // square() cannot be called here if it were in another file
    // (because it's static)

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '3^2 + 4^2 = 25'
+++

## Problem Statement

Write a `static` helper function that is only visible within its own file and a public function that calls it. Demonstrate how `static` functions enable encapsulation in multi-file projects — the helper cannot be accessed from other source files.

## Theory and Concepts

- `static` functions have internal linkage — they are only visible within their translation unit.
- This enables information hiding: internal implementation details are not exposed to other files.
- Public functions (non-static) form the module's API; static functions are private helpers.
- This pattern is used throughout the C standard library and most C projects.
- Static functions can also be inlined by the compiler more aggressively since they cannot be called from outside.

## Real World Application

Every well-structured C project uses static functions for encapsulation — a hardware driver exposes `init()`, `read()`, `write()` but keeps internal helper functions (`wait_for_ready()`, `parse_status()`) static. This prevents accidental misuse and reduces namespace pollution.
