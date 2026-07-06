+++
date = '2026-07-06T13:40:00+05:30'
draft = false
title = 'Function-like Macros'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 2
initial_code = '''#include <stdio.h>

#define SQUARE(x) ((x) * (x))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

int main(void) {
    int a = 5, b = 8;

    printf("SQUARE(%d) = %d\\n", a, SQUARE(a));
    printf("MAX(%d, %d) = %d\\n", a, b, MAX(a, b));
    printf("MIN(%d, %d) = %d\\n", a, b, MIN(a, b));

    // Demonstrate the risk: SQUARE(a + 1) without parentheses
    printf("SQUARE(%d + %d) = %d\\n", a, 1, SQUARE(a + 1));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'SQUARE(5) = 25, MAX(5, 8) = 8, SQUARE(5 + 1) = 36'
+++

## Problem Statement

Define function-like macros for `SQUARE`, `MAX`, and `MIN`. Use them with simple values and with expressions like `a + 1`. Explain why the extra parentheses around parameters and the entire body are necessary to avoid operator precedence bugs.

## Theory and Concepts

- Function-like macros take arguments: `#define NAME(params) replacement`.
- Each parameter is textually substituted — `SQUARE(a+1)` expands to `((a+1)*(a+1))`.
- Without parentheses, `SQUARE(a+1)` would expand to `(a+1*a+1)` = `a + a + 1`.
- Multiple evaluations: `MAX(x++, y++)` increments the winning argument twice.
- Unlike functions, macros don't have type checking and can cause side-effect issues.

## Real World Application

Function-like macros are used for performance-critical inline operations (avoiding function call overhead) and for generic-like patterns in C (e.g., type-generic max/min, container_of, offset_of). Modern C prefers inline functions for type safety.
