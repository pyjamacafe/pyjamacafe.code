+++
date = '2026-07-06T13:49:00+05:30'
draft = false
title = 'NULL Pointer Safety'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 10
weight = 5
initial_code = '''#include <stdio.h>

int safe_dereference(int *p) {
    if (p == NULL) {
        return -1;  // Error indicator
    }
    return *p;
}

int main(void) {
    int x = 42;
    int *valid = &x;
    int *invalid = NULL;

    printf("Valid: %d\\n", safe_dereference(valid));
    printf("Invalid: %d\\n", safe_dereference(invalid));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Valid: 42\\nInvalid: -1'
+++

## Problem Statement

Write a function that safely dereferences a pointer by first checking for `NULL`. Return a sentinel value (like -1) if the pointer is null. Call it with both a valid pointer and `NULL` to demonstrate safe handling.

## Theory and Concepts

- A `NULL` pointer points to nothing (address 0, which is never valid for user data).
- Dereferencing a `NULL` pointer causes undefined behavior (typically a crash / segmentation fault).
- Always check pointers for `NULL` before dereferencing them, especially when the pointer comes from `malloc`, function arguments, or external sources.
- `NULL` is defined in `<stddef.h>`, `<stdio.h>`, `<stdlib.h>`, and others.
- `if (!p)` is equivalent to `if (p == NULL)`.

## Real World Application

NULL pointer checks are critical in production code — any pointer from `malloc`, fopen, or function parameters that can be null must be validated. NULL safety is a common theme in code reviews and security audits.
