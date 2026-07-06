+++
date = '2026-07-06T13:05:00+05:30'
draft = false
title = 'Integer and Floating Constants'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int decimal = 42;
    int octal = 052;
    int hex = 0x2A;
    float f = 3.14f;
    double d = 2.71828;
    double sci = 1.5e-4;

    // Print all constants with their types

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Various constant formats printed'
+++

## Problem Statement

Write a program that declares and prints integer constants in decimal, octal, and hexadecimal, and floating-point constants in decimal and scientific notation. Print their values and observe the output format differences.

## Theory and Concepts

- Integer constants: decimal (`42`), octal (`052` — leading zero), hexadecimal (`0x2A`).
- A `U` or `L` suffix changes the type (e.g., `42U`, `100000L`, `123ULL`).
- Floating constants: `3.14` (double), `3.14f` (float), `3.14L` (long double).
- Scientific notation: `1.5e-4` means 1.5 × 10⁻⁴ = 0.00015.
- `%d` for decimal, `%o` for octal, `%x` for hex, `%f` for float, `%e` for scientific.

## Real World Application

Understanding constant syntax is needed when reading/writing hardware registers (hex addresses), setting configuration values with specific types (suffixes prevent compiler warnings), and working with scientific constants (Avogadro's number, Planck constant).
