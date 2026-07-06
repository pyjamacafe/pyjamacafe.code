+++
date = '2026-07-06T13:30:00+05:30'
draft = false
title = 'Pass by Value vs Pass by Reference'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 4
initial_code = '''#include <stdio.h>

void increment_bad(int x) {
    x++;  // Only modifies local copy
}

void increment_good(int *x) {
    (*x)++;  // Modifies original via pointer
}

int main(void) {
    int a = 5;
    increment_bad(a);
    printf("After bad: %d\\n", a);

    increment_good(&a);
    printf("After good: %d\\n", a);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'After bad: 5\\nAfter good: 6'
+++

## Problem Statement

Write two functions that attempt to increment an integer: one receives the value (pass by value — does not work), the other receives a pointer (pass by reference — works). Call both from `main` and print the results to demonstrate the difference.

## Theory and Concepts

- C passes all arguments by value — the function receives a copy of the argument.
- Modifying a parameter inside a function does not affect the caller's variable.
- To modify a variable in the caller, pass its address (pointer) and dereference it.
- Arrays are not passed by value; they decay to pointers (the array name is a pointer to the first element).
- `const` can be used to prevent modification via pointer when read-only access is intended.

## Real World Application

Understanding pass-by-value is essential for writing correct C code — every input parameter is a copy, which affects performance for large structs (pass by pointer for efficiency). The pattern is used throughout all C libraries (e.g., `fscanf`, `strcpy`).
