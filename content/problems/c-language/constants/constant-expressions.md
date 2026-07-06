+++
date = '2026-07-06T13:09:00+05:30'
draft = false
title = 'Constant Expressions'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 5
initial_code = '''#include <stdio.h>

#define HOURS_PER_DAY 24
#define MINUTES_PER_HOUR 60

int main(void) {
    int minutes_per_day = HOURS_PER_DAY * MINUTES_PER_HOUR;
    int seconds_per_day = minutes_per_day * 60;

    // Print computed constants
    // Try a constant expression in a case label

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Minutes per day: 1440, Seconds per day: 86400'
+++

## Problem Statement

Create constant expressions using `#define` and compile-time evaluable arithmetic. Compute minutes per day and seconds per day from basic constants. Show that constant expressions can be used in contexts like array sizes and `case` labels.

## Theory and Concepts

- A constant expression is evaluated at compile time.
- Integer constant expressions can involve literals, `enum` constants, and `sizeof`.
- Constant expressions are required for array sizes (in C89), `case` labels, and bit-field widths.
- `#define` values can be combined arithmetically in constant expressions.

## Real World Application

Constant expressions are used for compile-time configuration (computing timer reload values, baud rate divisors, CRC polynomials), array dimensions, and lookup tables that are computed at compile time rather than runtime.
