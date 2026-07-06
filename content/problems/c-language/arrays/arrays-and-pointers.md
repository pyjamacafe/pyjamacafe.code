+++
date = '2026-07-06T13:52:00+05:30'
draft = false
title = 'Arrays and Pointers Relationship'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 11
weight = 3
initial_code = '''#include <stdio.h>

int main(void) {
    int arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;  // arr decays to &arr[0]

    // Array indexing vs pointer arithmetic
    for (int i = 0; i < 5; i++) {
        printf("arr[%d] = %d, *(arr + %d) = %d, p[%d] = %d\\n",
               i, arr[i], i, *(arr + i), i, p[i]);
    }

    // sizeof array vs sizeof pointer
    printf("sizeof(arr) = %zu\\n", sizeof(arr));
    printf("sizeof(p) = %zu\\n", sizeof(p));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Arrays and pointers relationship demonstrated'
+++

## Problem Statement

Demonstrate that array indexing `arr[i]` is equivalent to pointer arithmetic `*(arr + i)`. Also show that a pointer can be indexed like an array (`p[i]`). Print `sizeof(arr)` vs `sizeof(p)` to highlight the difference between an array and a pointer.

## Theory and Concepts

- In most contexts, an array name decays to a pointer to its first element (`arr` → `&arr[0]`).
- `arr[i]` is defined as `*(arr + i)` by the C standard.
- Exception: `sizeof(arr)` returns the size of the entire array (not a pointer).
- Exception: `&arr` returns a pointer to the whole array (not just the first element).
- When an array is passed to a function, it decays to a pointer — the function receives only the address, not the size.

## Real World Application

Understanding the array-pointer equivalence is essential for correctly passing arrays to functions, using pointer arithmetic for efficient iteration, and avoiding common pitfalls (like thinking `sizeof(arr)` in a function parameter gives the array size).
