+++
date = '2026-07-06T13:45:00+05:30'
draft = false
title = 'Basic Pointer Operations'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 10
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int x = 42;
    int *p = &x;

    printf("Value of x: %d\\n", x);
    printf("Address of x: %p\\n", (void *)&x);
    printf("Pointer p holds: %p\\n", (void *)p);
    printf("Value via dereference: %d\\n", *p);

    // Modify through pointer
    *p = 100;
    printf("After *p = 100, x = %d\\n", x);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Basic pointer operations demonstrated'
+++

## Problem Statement

Declare an integer variable and a pointer to it. Print the variable's value, its address, the pointer's value (which is the address), and the value obtained by dereferencing the pointer. Then modify the variable through the pointer.

## Theory and Concepts

- A pointer stores the memory address of another variable.
- `&x` gives the address of variable `x`.
- `*p` dereferences pointer `p` to access the value at the address.
- Pointers must be initialized before use (either to a valid address or to `NULL`).
- The type of the pointer (`int *`) determines how many bytes are read/written on dereference.
- `%p` format specifier prints addresses; cast to `(void *)` for portability.

## Real World Application

Pointers are fundamental to C — they enable dynamic memory allocation, efficient array traversal, function parameter modification (pass by reference), data structures (linked lists, trees), and interfacing with hardware (memory-mapped registers).
