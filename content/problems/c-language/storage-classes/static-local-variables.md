+++
date = '2026-07-06T13:33:00+05:30'
draft = false
title = 'Static Local Variables'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 7
weight = 1
initial_code = '''#include <stdio.h>

int counter(void) {
    static int count = 0;  // Initialized once
    count++;
    return count;
}

int main(void) {
    for (int i = 0; i < 5; i++) {
        printf("Call %d: %d\\n", i + 1, counter());
    }
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Call 1: 1 ... Call 5: 5'
+++

## Problem Statement

Write a function `counter` with a `static` local variable that increments each time the function is called. Call it in a loop from `main` and print the returned values to confirm the variable persists across calls.

## Theory and Concepts

- `static` on a local variable gives it **static storage duration** (lives for the program's lifetime) while keeping **block scope** (only accessible within the function).
- The initialization `static int count = 0;` happens only once, when the program starts.
- Without `static`, an automatic variable would be created and destroyed each call.
- Static locals are useful for preserving state across function calls without using globals.

## Real World Application

Static locals are used for function-local caches, generating unique IDs, random number generator seeds (initialized once with `time(NULL)`), and call-count limited operations (e.g., "first run" initialization).
