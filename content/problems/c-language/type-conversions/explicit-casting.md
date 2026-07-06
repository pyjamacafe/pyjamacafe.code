+++
date = '2026-07-06T13:17:00+05:30'
draft = false
title = 'Explicit Type Casting'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 4
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int a = 10, b = 3;

    // Integer division truncates
    float q1 = a / b;

    // Cast to float first
    float q2 = (float)a / b;
    float q3 = a / (float)b;
    float q4 = (float)(a / b);

    // Print all four results and explain

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'With cast: 3.333333, Without: 3.000000'
+++

## Problem Statement

Demonstrate explicit type casting by computing the quotient of two integers. Show four different approaches: integer division (truncated), casting the first operand, casting the second operand, and casting the result of integer division. Explain why each gives a different result.

## Theory and Concepts

- A cast is written as `(type)expression` and explicitly converts the value to the specified type.
- Casting has higher precedence than arithmetic operators.
- `(float)a / b` converts `a` to float, so `b` is promoted to float for the division.
- `(float)(a / b)` performs integer division first, then converts the truncated result to float.
- Explicit casts suppress compiler warnings but also override type safety.

## Real World Application

Explicit casts are used when reading raw bytes from sensors (casting to the correct type), implementing serialization/deserialization, converting between pointer types (`(int *)ptr`), and ensuring correct arithmetic in mixed-type expressions.
