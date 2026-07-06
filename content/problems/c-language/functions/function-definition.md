+++
date = '2026-07-06T13:27:00+05:30'
draft = false
title = 'Function Definition and Call'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 1
initial_code = '''#include <stdio.h>

int add(int x, int y) {
    return x + y;
}

void greet(const char *name) {
    printf("Hello, %s!\\n", name);
}

int main(void) {
    int sum = add(3, 7);
    printf("Sum: %d\\n", sum);
    greet("Alice");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Sum: 10\\nHello, Alice!'
+++

## Problem Statement

Define two functions: `add` that takes two integers and returns their sum, and `greet` that takes a string and prints a greeting (returns nothing). Call both from `main` and print the results.

## Theory and Concepts

- A function is defined with: `return_type function_name(parameters) { body }`.
- `return value;` sends a value back to the caller and exits the function.
- `void` return type means the function does not return a value.
- Parameters are local variables initialized with the caller's arguments.
- Functions must be declared (prototyped) before use, or defined before their first call.

## Real World Application

Functions are the basic unit of code organization in C — they encapsulate logic, enable reuse, and break complex programs into manageable pieces. Every C program from embedded firmware to desktop applications is structured around functions.
