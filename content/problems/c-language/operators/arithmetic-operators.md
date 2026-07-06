+++
date = '2026-07-06T13:10:00+05:30'
draft = false
title = 'Arithmetic Operators'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int a = 15, b = 4;
    int sum = a + b;
    int diff = a - b;
    int prod = a * b;
    int quot = a / b;
    int rem = a % b;

    // Print all results
    // Try with negative values too

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '15 + 4 = 19, 15 - 4 = 11, 15 * 4 = 60, 15 / 4 = 3, 15 %% 4 = 3'
+++

## Problem Statement

Write a program that uses the five basic arithmetic operators (`+`, `-`, `*`, `/`, `%`) on integer operands. Print each result and observe how integer division truncates toward zero. Also test with negative operands to see the behavior of `%`.

## Theory and Concepts

- `+`, `-`, `*`, `/`, `%` are binary arithmetic operators.
- Integer division truncates toward zero (C99 and later).
- `%` (modulo) requires integer operands; the result has the sign of the dividend.
- Operator precedence: `*`, `/`, `%` bind tighter than `+`, `-`.
- `float` and `double` support `+`, `-`, `*`, `/` but not `%`.

## Real World Application

Arithmetic operators are fundamental to all computation — calculating distances, scaling sensor values, computing averages, implementing digital signal processing filters, and financial calculations. Understanding integer division and modulo is critical for correct rounding behavior.
