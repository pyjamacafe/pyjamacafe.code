+++
date = '2026-07-06T14:17:00+05:30'
draft = false
title = 'Declaration vs Definition'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 18
weight = 2
initial_code = '''#include <stdio.h>

// Declaration (extern by default for functions)
int global_counter;        // Definition (tentative)
extern int extern_var;     // Declaration only (defined elsewhere)

// Function declaration (prototype)
void update_counter(void);

// Function definition
void update_counter(void) {
    global_counter++;
}

int main(void) {
    update_counter();
    update_counter();
    printf("Counter: %d\\n", global_counter);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Counter: 2'
+++

## Problem Statement

Explain the difference between a declaration and a definition in C. Use a global variable (which is both declared and defined), and a function (declared with a prototype, then defined). Demonstrate the tentative definition rule for file-scope variables.

## Theory and Concepts

- A **declaration** introduces a name and its type to the compiler (no storage allocated).
- A **definition** allocates storage and optionally provides an initial value.
- For variables: `extern int x;` is a declaration; `int x;` or `int x = 5;` is a definition.
- For functions: a prototype (without body) is a declaration; the body is the definition.
- A variable can have multiple declarations but only one definition (across all files — the one-definition rule).
- Tentative definitions: `int x;` at file scope is a definition that can be overridden by another definition (common extension).

## Real World Application

Understanding declaration vs definition is critical for building multi-file C projects — headers contain declarations, exactly one `.c` file contains the definition. Violating this (defining in a header included by multiple files) causes linker errors.
