+++
date = '2026-07-06T14:13:00+05:30'
draft = false
title = 'const Pointers and Pointer to const'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 17
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int x = 10, y = 20;

    // Pointer to const data (data cannot be modified)
    const int *p1 = &x;
    // *p1 = 30;  // ERROR

    // const pointer (pointer cannot be reassigned)
    int * const p2 = &x;
    *p2 = 30;  // OK: data can be modified
    // p2 = &y;  // ERROR

    // const pointer to const data
    const int * const p3 = &x;
    // *p3 = 30;  // ERROR
    // p3 = &y;   // ERROR

    printf("x = %d (via p2)\\n", *p2);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'const pointer combinations demonstrated'
+++

## Problem Statement

Demonstrate the four combinations of `const` with pointers:
1. Pointer to const data (`const int *`)
2. const pointer (`int * const`)
3. const pointer to const data (`const int * const`)
4. Regular pointer to non-const data (`int *`)

Explain which can modify the data and which can be reassigned.

## Theory and Concepts

- Read `const` declarations right-to-left: `const int *` → "pointer to const int" (data is const).
- `int * const` → "const pointer to int" (pointer is const, data is not).
- `const int * const` → "const pointer to const int" (both are const).
- Rule of thumb: `const` applies to whatever is to its left (except when it starts the declaration, then it applies to the type to its right).
- Function parameters are often declared `const T *` to indicate the function does not modify the pointed-to data.

## Real World Application

Choosing the right `const` combination is essential for API design — `const char *` says "I won't modify your string", `char * const` says "I won't change which buffer I'm using", and `const char * const` says both.
