+++
date = '2026-07-06T13:53:00+05:30'
draft = false
title = 'Arrays of Pointers'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 11
weight = 4
initial_code = '''#include <stdio.h>

int main(void) {
    const char *fruits[] = {"Apple", "Banana", "Cherry", "Date"};
    int n = sizeof(fruits) / sizeof(fruits[0]);

    for (int i = 0; i < n; i++) {
        printf("fruits[%d] = %s (address: %p)\\n", i, fruits[i], (void *)fruits[i]);
    }

    // 2D array vs array of pointers to strings
    char grid[][6] = {"Apple", "Banana"};  // Fixed column width

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Array of string pointers demonstrated'
+++

## Problem Statement

Create an array of pointers to strings (an array of `const char *`). Loop through it and print each string and its address. Explain why this uses less memory than a 2D char array when strings have different lengths.

## Theory and Concepts

- `const char *fruits[]` is an array where each element is a pointer to a `char`.
- Each string literal occupies only the space it needs (plus null terminator).
- A 2D char array `char grid[][6]` wastes space for fixed-width rows.
- Arrays of pointers to strings are the basis for `argv` (command line arguments).
- The strings can be in read-only memory (string literals) or dynamically allocated.

## Real World Application

Arrays of pointers are used for command-line argument handling (`char *argv[]`), menu systems, lookup tables (days of the week, error messages), configuration keyword lists, and any collection of variable-length strings where memory efficiency matters.
