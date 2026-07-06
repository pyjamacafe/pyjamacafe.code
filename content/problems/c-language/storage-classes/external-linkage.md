+++
date = '2026-07-06T13:34:00+05:30'
draft = false
title = 'External Variables and Linkage'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 7
weight = 2
initial_code = '''#include <stdio.h>

int shared_counter = 0;  // External linkage by default (global scope)

void increment(void) {
    shared_counter++;
}

int main(void) {
    increment();
    increment();
    increment();
    printf("Counter: %d\\n", shared_counter);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Counter: 3'
+++

## Problem Statement

Define a global variable with external linkage and a function that modifies it. Call the function multiple times and print the variable's value. This demonstrates how global state can be shared across functions (and files).

## Theory and Concepts

- Global variables declared outside any function have **external linkage** by default (accessible from other translation units via `extern`).
- `extern` keyword declares a variable defined in another source file without allocating storage.
- Global variables have **static storage duration** (they live for the entire program).
- Global variables are zero-initialized if no explicit initializer is given.
- Overuse of globals makes programs harder to reason about and test.

## Real World Application

Globals are used for system-wide configuration, hardware register mappings (memory-mapped I/O), singleton manager objects, and shared state in interrupt service routines. They should be used sparingly, typically with a naming convention to avoid collisions.
