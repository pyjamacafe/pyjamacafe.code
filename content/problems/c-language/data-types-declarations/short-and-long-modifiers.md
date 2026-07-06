+++
date = '2026-07-06T13:03:00+05:30'
draft = false
title = 'Short and Long Integer Modifiers'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 4
initial_code = '''#include <stdio.h>
#include <limits.h>

int main(void) {
    short s = 32767;
    long l = 2147483647L;
    long long ll = 9223372036854775807LL;

    // Print sizes using sizeof
    // Print min/max values using limits.h

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Short, long, long long sizes printed'
+++

## Problem Statement

Declare variables of type `short`, `long`, and `long long`. Use `sizeof` to print their sizes in bytes. Use `<limits.h>` macros (`SHRT_MIN`, `SHRT_MAX`, `LONG_MIN`, `LONG_MAX`, `LLONG_MIN`, `LLONG_MAX`) to print their ranges.

## Theory and Concepts

- `short` is at least 16 bits, `long` is at least 32 bits, `long long` is at least 64 bits.
- Exact sizes depend on the platform (ILP32, LP64, LLP64 data models).
- `sizeof` returns bytes (`size_t`), use `%zu` to print it.
- `<limits.h>` defines implementation-specific limits for each type.

## Real World Application

Choosing the right integer size is crucial for memory-constrained systems (embedded devices use `short` or `int8_t`), large data processing (use `long long` for file sizes), and cross-platform portability (use fixed-width types from `<stdint.h>` for exact sizes).
