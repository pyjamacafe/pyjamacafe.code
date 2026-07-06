+++
date = '2026-07-06T13:04:00+05:30'
draft = false
title = 'The Void Type'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 5
initial_code = '''#include <stdio.h>

void say_hello(void) {
    printf("Hello, world!\\n");
}

int main(void) {
    say_hello();
    // Void pointer example
    int x = 42;
    void *ptr = &x;
    int *ip = (int *)ptr;
    printf("Value via void pointer: %d\\n", *ip);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Function called and void pointer used'
+++

## Problem Statement

Demonstrate two uses of `void`: a function that takes no arguments and returns nothing, and a `void *` pointer that stores the address of an `int` variable, which is then cast back to `int *` and dereferenced.

## Theory and Concepts

- `void` as return type means the function returns nothing.
- `void` in parameter list means the function takes no arguments (in C, `f()` vs `f(void)` differ — the former allows unspecified parameters).
- `void *` is a generic pointer that can point to any data type. It must be cast to a specific type before dereferencing.
- Pointer arithmetic is not allowed on `void *` (the size is unknown).

## Real World Application

`void *` is used in generic data structures (qsort, malloc, memcpy), callback mechanisms, and polymorphic APIs. Understanding it is essential for working with C standard library functions and writing type-agnostic code.
