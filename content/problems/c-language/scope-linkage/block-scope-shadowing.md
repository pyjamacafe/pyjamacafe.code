+++
date = '2026-07-06T13:37:00+05:30'
draft = false
title = 'Block Scope and Shadowing'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 8
weight = 1
initial_code = '''#include <stdio.h>

int x = 100;  // File scope

int main(void) {
    int x = 10;  // Block scope, shadows global

    {
        int x = 20;  // Inner block scope, shadows outer
        printf("Inner block: %d\\n", x);
    }

    printf("Outer block: %d\\n", x);
    // Access the global x using extern (not possible inside function)
    // Here, the global x is shadowed

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Inner block: 20\\nOuter block: 10'
+++

## Problem Statement

Declare a global variable `x`, then a local `x` in `main`, then another `x` inside a nested block. Print `x` in each scope to demonstrate shadowing. Explain how the compiler resolves which `x` is referenced.

## Theory and Concepts

- **Block scope**: variables declared inside a block `{ }` are visible only within that block.
- **File scope**: variables declared outside any function are visible from the point of declaration to the end of the file.
- Inner scopes can **shadow** outer scopes — the innermost declaration takes precedence.
- To access a shadowed global from inside a function, use `extern` (though the global must not be shadowed by a parameter or local with the same name).
- Best practice: avoid shadowing; it leads to confusion and bugs.

## Real World Application

Scope and shadowing are everyday concepts in C programming — understanding them prevents bugs like accidentally using a local variable when a global was intended. Many coding standards forbid variable shadowing in code reviews.
