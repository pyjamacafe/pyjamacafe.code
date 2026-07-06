+++
date = '2026-07-06T13:39:00+05:30'
draft = false
title = 'Object-like Macros'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 1
initial_code = '''#include <stdio.h>

#define PI 3.14159
#define MAX_BUFFER 256
#define ERROR_CODE -1

int main(void) {
    printf("PI = %f\\n", PI);
    printf("MAX_BUFFER = %d\\n", MAX_BUFFER);
    printf("ERROR_CODE = %d\\n", ERROR_CODE);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'PI = 3.141590, MAX_BUFFER = 256, ERROR_CODE = -1'
+++

## Problem Statement

Define several object-like macros using `#define` for a constant value, a buffer size, and an error code. Use them in `printf` and confirm they expand to the defined values. Explain that the preprocessor performs text substitution before compilation.

## Theory and Concepts

- `#define NAME value` defines an object-like macro — `NAME` is replaced with `value` wherever it appears in the source.
- No semicolon at the end (unlike a statement).
- Convention: use UPPER_CASE for macro names.
- Macros can be undefined with `#undef`.
- Macros do not respect scope — they are processed before the compiler sees the code.

## Real World Application

Object-like macros are used for configuration constants, pin definitions, register addresses, and any value that must be consistent across a project. They are often placed in header files and can be overridden with compiler flags (`-D`).
