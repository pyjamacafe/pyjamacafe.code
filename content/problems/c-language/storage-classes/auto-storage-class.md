+++
date = '2026-07-06T14:32:00+05:30'
draft = false
title = 'auto Storage Class'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 7
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    // 'auto' is the default for local variables — rarely written explicitly
    auto int x = 10;  // Same as: int x = 10;
    int y = 20;       // 'auto' is implicit

    // In C, 'auto' simply means automatic storage duration
    // It is almost never used in practice

    printf("x = %d, y = %d\\n", x, y);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'x = 10, y = 20'
+++

## Problem Statement

Declare a local variable with the `auto` keyword (which is the default for local variables). Explain that `auto` is redundant in modern C and is almost never used. Its meaning in C is different from C++ `auto`.

## Theory and Concepts

- `auto` specifies automatic storage duration — the variable is created when the block is entered and destroyed when it exits.
- In C, `auto` is the default for local variables — writing it is optional and rare.
- The `auto` keyword in C has a different meaning from C++11's `auto` (type deduction).
- Other storage class specifiers: `static`, `extern`, `register`, `typedef`.
- `auto` cannot be used at file scope (file-scope variables have static storage duration).
- Understanding `auto` is primarily of historical interest — it comes from BCPL/B where variables had to be explicitly declared as `auto` or `static`.

## Real World Application

The `auto` keyword is rarely seen in modern C code. Its main relevance is historical and for understanding C's storage class system. Some coding standards explicitly forbid using it since it adds no value.
