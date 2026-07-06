+++
date = '2026-07-06T13:16:00+05:30'
draft = false
title = 'Implicit Type Conversion'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 4
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int i = 5;
    float f = 2.5f;
    double d = 3.7;

    // Mixed-type expressions
    float result1 = i + f;   // int + float
    double result2 = i + d;  // int + double
    int result3 = i + f;     // float stored in int (truncation)

    // Print results

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Implicit conversion results demonstrated'
+++

## Problem Statement

Write mixed-type arithmetic expressions and observe how the compiler implicitly converts operands to a common type. Compare the results when the same operation is stored in a `float` vs an `int` to see precision loss and truncation.

## Theory and Concepts

- Implicit conversion (type promotion) happens automatically in expressions with mixed types.
- Usual arithmetic conversions: smaller types are promoted to larger ones (`int → long → float → double`).
- Integer promotion: `char` and `short` are promoted to `int` in expressions.
- Assigning a larger type to a smaller type truncates or may lose precision (compiler may warn).
- Conversion direction: `int → unsigned → long → long long → float → double → long double`.

## Real World Application

Implicit conversions happen constantly in real code — mixing indices with sizes, sensor readings with calibration factors, and loop counters with floating-point accumulators. Understanding them prevents precision loss and sign-related bugs.
