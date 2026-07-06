+++
date = '2026-07-06T14:12:00+05:30'
draft = false
title = 'const Type Qualifier'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 17
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    const int MAX_USERS = 100;
    // MAX_USERS = 200;  // ERROR: read-only

    const float PI = 3.14159f;
    float radius = 5.0f;
    float area = PI * radius * radius;

    printf("Area: %.2f\\n", area);

    // Pointer to const data
    const int data[] = {1, 2, 3};
    const int *p = data;
    // *p = 10;  // ERROR: data is const
    p++;  // OK: pointer itself is not const

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'const qualifier demonstrated'
+++

## Problem Statement

Declare `const` variables and try to modify them (demonstrate the compilation error). Use a pointer to `const` data and show that the data cannot be modified through the pointer, but the pointer itself can be reassigned.

## Theory and Concepts

- `const` declares a variable whose value cannot be modified after initialization.
- `const` applies to the variable name, not the storage — the variable might still be changed through another pointer (if it wasn't originally const).
- `const int *p` means the pointed-to data is read-only; `int * const p` means the pointer itself cannot be reassigned.
- `const` is a type qualifier (along with `volatile` and `restrict`).
- `const`-correctness means using `const` wherever data should not be modified — it enables compiler optimizations and catches bugs.

## Real World Application

`const` is used for configuration constants, lookup tables, string literals, function parameters that are read-only (e.g., `const char *str`), and hardware register definitions that should not be modified accidentally.
