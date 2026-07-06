+++
date = '2026-07-06T14:30:00+05:30'
draft = false
title = 'Zero and Default Initialization'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 16
weight = 4
initial_code = '''#include <stdio.h>
#include <string.h>

struct sensor {
    int id;
    float value;
    char name[20];
};

int main(void) {
    // Zero initialization
    struct sensor s1 = {0};     // All fields zero
    int arr1[10] = {0};         // All elements zero
    int arr2[10];               // NOT initialized — contains garbage!

    // Set via memset
    struct sensor s2;
    memset(&s2, 0, sizeof(s2));

    printf("s1.id = %d, s1.value = %.1f\\n", s1.id, s1.value);
    printf("arr1[5] = %d\\n", arr1[5]);
    printf("s2.id = %d\\n", s2.id);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Zero initialization results'
+++

## Problem Statement

Demonstrate zero initialization of structs and arrays using `{0}` initializer and `memset`. Show that `int arr[10]` without an initializer contains garbage (automatic storage) while `int arr[10] = {0}` is zero-initialized.

## Theory and Concepts

- `= {0}` initializes the first element to 0 and all remaining elements to zero (recursively for aggregates).
- This is the standard idiom for zero-initializing any aggregate type.
- `memset(&s, 0, sizeof(s))` sets all bytes to zero — functionally same as `= {0}` for most cases.
- Automatic variables NOT explicitly initialized contain indeterminate values — always initialize before use.
- Static and global variables are zero-initialized automatically even without `= {0}`.
- For pointers, `{0}` sets them to `NULL`; for floats, to `0.0`.

## Real World Application

Zero initialization is the most common initialization pattern — resetting state structures, clearing buffers, initializing configuration defaults, and preparing memory for use. The `{0}` idiom is shorter and less error-prone than `memset`.
