+++
date = '2026-07-06T14:16:00+05:30'
draft = false
title = 'Separate Compilation and Header Files'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 18
weight = 1
initial_code = '''// Simulated multi-file project in a single file
// In practice: math_utils.h, math_utils.c, main.c
#include <stdio.h>

// --- math_utils.h ---
#ifndef MATH_UTILS_H
#define MATH_UTILS_H

int add(int a, int b);
int multiply(int a, int b);

#endif

// --- math_utils.c ---
int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

// --- main.c ---
int main(void) {
    int sum = add(5, 3);
    int product = multiply(5, 3);

    printf("Sum: %d\\n", sum);
    printf("Product: %d\\n", product);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Sum: 8, Product: 15'
+++

## Problem Statement

Simulate a multi-file C project by placing header guard, declarations, and definitions in a single file. The header declares function prototypes, the implementation defines them, and `main` uses them. In a real project, these would be separate `.h` and `.c` files.

## Theory and Concepts

- **Separate compilation**: each `.c` file is compiled independently into an object file (`.o`).
- **Header files** (`.h`) contain declarations (function prototypes, type definitions, macros) shared across `.c` files.
- **Implementation files** (`.c`) contain definitions and are compiled separately.
- The **linker** combines object files into an executable.
- Include guards prevent the same header from being processed twice.
- Only declare what's necessary in headers; keep implementation details private with `static` functions.

## Real World Application

Every non-trivial C project uses multiple files organized by module — drivers, utilities, application logic. Header files form the API contract between modules. Understanding separate compilation is essential for build systems (Makefile, CMake) and large codebases.
