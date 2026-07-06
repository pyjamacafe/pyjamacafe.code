+++
date = '2026-07-06T13:48:00+05:30'
draft = false
title = 'Function Pointers'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 10
weight = 4
initial_code = '''#include <stdio.h>

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }

int compute(int (*op)(int, int), int x, int y) {
    return op(x, y);
}

int main(void) {
    int (*operations[])(int, int) = {add, subtract, multiply};

    for (int i = 0; i < 3; i++) {
        printf("Result %d: %d\\n", i + 1, compute(operations[i], 20, 5));
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Result 1: 25\\nResult 2: 15\\nResult 3: 100'
+++

## Problem Statement

Define several arithmetic functions with the same signature, then store their addresses in an array of function pointers. Write a `compute` function that accepts a function pointer and calls it. Call each operation through the array.

## Theory and Concepts

- A function pointer is declared as `return_type (*name)(param_types)`.
- `&function_name` or just `function_name` gives the function's address.
- Function pointers can be stored in arrays, passed as arguments, or returned from functions.
- The `typedef` can make function pointer syntax more readable.
- Calling through a function pointer: `op(x, y)` or `(*op)(x, y)` — both work.

## Real World Application

Function pointers are used for callback mechanisms (`qsort` comparator, signal handlers), plugin systems, state machines (function pointer tables), dispatch tables for command processors, and implementing polymorphism in C (virtual method tables).
