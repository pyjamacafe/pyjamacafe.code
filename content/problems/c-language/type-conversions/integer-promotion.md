+++
date = '2026-07-06T13:20:00+05:30'
draft = false
title = 'Integer Promotion in Expressions'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 4
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    char c = 0x80;  // 128 in hex, but char may be -128 if signed
    unsigned char uc = 0x80;

    // Compare results
    int result1 = c << 1;
    int result2 = uc << 1;

    // char + char promoted to int
    char a = 100, b = 100;
    int sum = a + b;

    // Print results

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Promotion effects demonstrated'
+++

## Problem Statement

Demonstrate integer promotion by performing arithmetic on `char` and `unsigned char` values. Show that `char` operands are promoted to `int` before the operation, which affects shift results when the high bit is set. Compare the results of shifting a `char` vs `unsigned char`.

## Theory and Concepts

- Integer promotion: types smaller than `int` (`char`, `short`, `_Bool`) are promoted to `int` in expressions.
- If `int` cannot represent all values of the original type, the value is promoted to `unsigned int`.
- This promotion happens before any arithmetic or bitwise operation.
- `c << 1` is actually `(int)c << 1`, so sign-extension can affect the result.
- Promotion is why `a + b` for two `char`s yields an `int`, not a `char`.

## Real World Application

Integer promotion affects bit manipulation of I/O register values (where registers are often `unsigned char`), checksum and CRC calculations, and any code that shifts or operates on small integer types. It can cause unexpected sign extension when the high bit is set.
