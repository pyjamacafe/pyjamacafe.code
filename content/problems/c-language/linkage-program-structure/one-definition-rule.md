+++
date = '2026-07-06T14:20:00+05:30'
draft = false
title = 'The One-definition Rule'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 18
weight = 5
initial_code = '''#include <stdio.h>

// Declarations (okay — can have many)
extern int shared_value;
extern int shared_value;  // Second declaration — fine

// Definition (exactly one per program)
int shared_value = 100;

void increment(void) {
    shared_value++;
}

int main(void) {
    printf("Before: %d\\n", shared_value);
    increment();
    increment();
    printf("After: %d\\n", shared_value);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Before: 100, After: 102'
+++

## Problem Statement

Demonstrate the one-definition rule (ODR) by having a global variable defined in one place and declared (via `extern`) in multiple places. The program links correctly because there is exactly one definition. Show that multiple `extern` declarations are allowed but only one definition.

## Theory and Concepts

- The one-definition rule (ODR): every function and global variable must have exactly one definition across the entire program.
- Multiple declarations (e.g., via `extern` in different files) are allowed.
- Violating ODR (defining the same function or variable in two files) causes a linker error.
- "Tentative definitions" (file-scope `int x;` without `extern`) are a special case — they may be treated as declarations that can be overridden by actual definitions.
- The ODR is enforced by the linker, not the compiler.

## Real World Application

The ODR is the reason header files must only contain declarations (prototypes, `extern` variables, `static inline` functions). Definitions go in exactly one `.c` file. In large projects, violating ODR causes confusing linker errors that can be hard to debug.
