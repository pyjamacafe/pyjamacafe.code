+++
date = '2026-07-06T13:08:00+05:30'
draft = false
title = 'Symbolic Constants with #define'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 4
initial_code = '''#include <stdio.h>

#define PI 3.14159
#define MAX_BUFFER_SIZE 1024
#define GREETING "Welcome!"

int main(void) {
    // Use the defined constants
    double area = PI * 5 * 5;
    char buffer[MAX_BUFFER_SIZE];

    // Print values

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Area = 78.539750, Buffer size = 1024'
+++

## Problem Statement

Define symbolic constants using `#define` for a mathematical constant (PI), a buffer size, and a greeting string. Use these constants in calculations and print the results. Note that `#define` performs text substitution before compilation.

## Theory and Concepts

- `#define` is a preprocessor directive that replaces an identifier with a token sequence before compilation.
- Convention: use UPPER_CASE for macro names.
- No semicolon after `#define` — it is not a statement.
- `#define` does not create a variable; it is purely textual substitution.
- Using parentheses around macro bodies prevents operator precedence issues.

## Real World Application

`#define` is used for configuration constants (buffer sizes, timeouts, pin numbers), mathematical constants, and conditional compilation guards. It is widely used in embedded firmware for hardware-specific values (register addresses, clock speeds).
