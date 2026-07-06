+++
date = '2026-07-06T13:01:00+05:30'
draft = false
title = 'Floating-point Types in C'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    float f = 3.14f;
    double d = 3.141592653589793;
    long double ld = 3.141592653589793238L;

    // Print each with sufficient precision

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Precision differences demonstrated'
+++

## Problem Statement

Declare variables of type `float`, `double`, and `long double`. Assign the same mathematical constant (like π) to each and print them with enough decimal places to see the precision differences.

## Theory and Concepts

- `float` is typically 32-bit (≈7 decimal digits of precision).
- `double` is typically 64-bit (≈15 decimal digits).
- `long double` is platform-dependent (80-bit on x86, 128-bit on some).
- Use `%f`, `%lf`, and `%Lf` format specifiers respectively.
- Floating-point arithmetic is approximate — never compare floats with `==` directly.

## Real World Application

Choosing the right floating-point type matters in scientific computing, graphics (GPUs use float), financial calculations (use double), and simulation. Using `float` when you need `double` precision leads to accumulating rounding errors.
