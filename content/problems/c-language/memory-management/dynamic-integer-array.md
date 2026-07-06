+++
date = '2026-07-06T12:02:00+05:30'
draft = false
title = 'Dynamic Integer Array'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 1
initial_code = '''#include <stdlib.h>

int *create_array(int n, int initial_value) {
    // Allocate memory for an array of n integers
    // Initialise each element to initial_value
    // Return pointer to the allocated array
}

int main(void) {
    int *arr = create_array(5, 42);

    // arr[0] through arr[4] should all be 42

    free(arr);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Array allocated and initialised correctly'
+++

## Problem Statement

Write `create_array` that allocates an array of `n` integers using `malloc`, initialises every element to `initial_value`, and returns a pointer to the allocated memory. If `malloc` fails, return `NULL`. The caller is responsible for freeing the memory.

## Theory and Concepts

- **Dynamic memory allocation**: `malloc` allocates a block of memory on the heap at runtime. The size argument is typically `n * sizeof(type)`.
- **Null-checking**: `malloc` returns `NULL` when it cannot satisfy the request. Always check the return value before using the pointer.
- **Initialisation**: A freshly allocated block contains indeterminate values. Explicitly set each element before use.
- **Freeing memory**: Every `malloc` must eventually be matched with a `free` to avoid memory leaks.

## Real World Application

Dynamic arrays are the foundation of resizable data structures (vectors, array lists, buffers) used in virtually every non-trivial C program — file readers, network servers, interpreters, and game engines. Knowing how to safely allocate, initialise, and free heap memory is critical for writing robust, leak-free systems code.
