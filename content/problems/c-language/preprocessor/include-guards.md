+++
date = '2026-07-06T13:43:00+05:30'
draft = false
title = 'Include Guard and Header Files'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 5
initial_code = '''// This example simulates how include guards work.
// In practice this would be in a header file.
#include <stdio.h>

#ifndef MY_HEADER_H
#define MY_HEADER_H

#define VERSION 100

int multiply(int a, int b) {
    return a * b;
}

#endif  // MY_HEADER_H

int main(void) {
    printf("Version: %d\\n", VERSION);
    printf("5 * 7 = %d\\n", multiply(5, 7));

    // If this header were included a second time,
    // the #ifndef guard would prevent redefinition.

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Version: 100, 5 * 7 = 35'
+++

## Problem Statement

Simulate a header file with an include guard. The guard prevents the code from being processed twice if the header is included multiple times. Define a macro and a function inside the guarded block and use them from `main`.

## Theory and Concepts

- Include guard pattern: `#ifndef FILENAME_H` / `#define FILENAME_H` / `...` / `#endif`.
- The first inclusion defines the guard macro; subsequent inclusions see it defined and skip the content.
- This prevents duplicate definitions of types, variables, and functions.
- `#pragma once` is an alternative (non-standard but widely supported) that achieves the same effect.
- Always guard your header files to avoid compilation errors in multi-file projects.

## Real World Application

Include guards are essential in every C header file. Without them, including the same header twice (directly or indirectly) would cause redefinition errors for types, structs, and function declarations. The standard library headers and all third-party libraries use this pattern.
