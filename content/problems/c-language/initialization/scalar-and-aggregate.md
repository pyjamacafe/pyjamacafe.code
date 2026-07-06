+++
date = '2026-07-06T14:09:00+05:30'
draft = false
title = 'Scalar and Aggregate Initialization'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 16
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    // Scalar initialization
    int a = 5;
    float f = 3.14f;
    char ch = 'Z';

    // Aggregate initialization
    int arr[5] = {1, 2, 3, 4, 5};
    int partial[10] = {1, 2, 3};  // Rest are zero

    struct point {
        int x;
        int y;
    };

    struct point p = {10, 20};

    // Print everything
    printf("a=%d, f=%.2f, ch=%c\\n", a, f, ch);
    printf("array[4]=%d, partial[9]=%d\\n", arr[4], partial[9]);
    printf("point: (%d, %d)\\n", p.x, p.y);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Initialization demonstrated'
+++

## Problem Statement

Demonstrate scalar initialization (simple variables) and aggregate initialization (arrays and structs). Show that partially initialized arrays have the remaining elements set to zero. Print all values to verify.

## Theory and Concepts

- **Scalar initialization**: `int x = 5;` — a single value assigned to a variable.
- **Aggregate initialization**: `int arr[5] = {1,2,3,4,5};` — brace-enclosed list for arrays/structs.
- Partial initialization: `int arr[10] = {1,2,3}` sets first 3 elements, the rest are zero-initialized.
- Nested aggregates: `struct point p = {10, 20};` — fields initialized in declaration order.
- Uninitialized automatic variables contain indeterminate (garbage) values.

## Real World Application

Understanding initialization prevents bugs from uninitialized variables. Aggregate initialization is used for lookup tables, preset configuration structures, and zero-initializing buffers. The zero-initialization guarantee for partial initializers is relied upon in many codebases.
