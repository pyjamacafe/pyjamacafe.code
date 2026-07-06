+++
date = '2026-07-06T13:54:00+05:30'
draft = false
title = 'Pointer vs Array Subscripting'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 11
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    int arr[5] = {1, 2, 3, 4, 5};

    // Both are equivalent
    printf("arr[2] = %d\\n", arr[2]);
    printf("2[arr] = %d\\n", 2[arr]);  // Equivalent!
    printf("*(arr + 2) = %d\\n", *(arr + 2));

    // Pointer version (mutable)
    int *p = arr;
    printf("p[2] = %d\\n", p[2]);

    // But p can be reassigned
    p = &arr[2];
    printf("Now p[0] = %d (arr[2])\\n", p[0]);

    // arr cannot be reassigned
    // arr = &arr[2];  // ERROR: array type not assignable

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Pointer vs array subscripting demonstrated'
+++

## Problem Statement

Demonstrate that `a[i]`, `i[a]`, and `*(a + i)` are all equivalent in C. Show that a pointer can be reassigned to point to a different element, while an array name cannot be reassigned. This highlights the difference between array objects and pointer variables.

## Theory and Concepts

- By definition, `E1[E2]` is identical to `(*((E1)+(E2)))` — so `2[arr]` == `*(2 + arr)` == `arr[2]`.
- Arrays are not pointers — the array name is an lvalue representing the array object itself.
- In expressions, the array name decays to a pointer (to the first element).
- An array cannot be assigned or reassigned (it's not a modifiable lvalue).
- A pointer is a variable that holds an address and can be assigned.

## Real World Application

Understanding the subtle differences between arrays and pointers prevents common bugs — like thinking `sizeof(arr)` gives the array size in a function parameter, or trying to assign to an array after declaration. The equivalence `a[i] == i[a]` is mostly a curiosity but illustrates C's symmetry.
