+++
date = '2026-07-06T13:46:00+05:30'
draft = false
title = 'Pointer Arithmetic'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 10
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int arr[] = {10, 20, 30, 40, 50};
    int *p = arr;
    int n = sizeof(arr) / sizeof(arr[0]);

    for (int i = 0; i < n; i++) {
        printf("*(p + %d) = %d, p[%d] = %d\\n", i, *(p + i), i, p[i]);
    }

    // Pointer difference
    int *start = &arr[0];
    int *end = &arr[4];
    printf("Elements between: %td\\n", end - start);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Pointer arithmetic demonstrated'
+++

## Problem Statement

Use pointer arithmetic to traverse an integer array. Print each element using both `*(p + i)` and `p[i]` to show they are equivalent. Also compute the difference between two pointers (number of elements between them) using pointer subtraction.

## Theory and Concepts

- `p + i` advances the pointer by `i × sizeof(*p)` bytes.
- `*(p + i)` is equivalent to `p[i]` — array subscripting is defined in terms of pointer arithmetic.
- Pointer subtraction gives the number of elements between two pointers (signed `ptrdiff_t`, `%td`).
- Pointer arithmetic is only valid within the bounds of the same array object (undefined behavior otherwise).
- Void pointers cannot participate in arithmetic (size unknown).

## Real World Application

Pointer arithmetic is used in buffer processing, string manipulation, image data traversal, and any code that iterates over memory sequentially. It is more flexible than array indexing and is essential for implementing dynamic data structures.
