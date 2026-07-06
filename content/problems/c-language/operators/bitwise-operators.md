+++
date = '2026-07-06T13:12:00+05:30'
draft = false
title = 'Bitwise Operators'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 3
initial_code = '''#include <stdio.h>

int main(void) {
    unsigned int a = 0b1100;  // 12
    unsigned int b = 0b1010;  // 10

    // Compute: & | ^ ~ << >>
    unsigned int and = a & b;
    unsigned int or  = a | b;
    unsigned int xor = a ^ b;
    unsigned int not = ~a;
    unsigned int shl = a << 2;
    unsigned int shr = a >> 2;

    // Print in binary format

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Bitwise operation results demonstrated'
+++

## Problem Statement

Apply each bitwise operator (`&`, `|`, `^`, `~`, `<<`, `>>`) on two unsigned integers and print the results in binary or hexadecimal. Verify that shift left multiplies by powers of two and shift right divides (for unsigned).

## Theory and Concepts

- `&` (AND): bit is 1 only if both corresponding bits are 1.
- `|` (OR): bit is 1 if either corresponding bit is 1.
- `^` (XOR): bit is 1 if corresponding bits differ.
- `~` (NOT): inverts all bits.
- `<<` (left shift): shifts bits left, fills with 0 — equivalent to multiplying by 2ⁿ.
- `>>` (right shift): shifts bits right — for unsigned, fills with 0 (logical shift).
- Bitwise operators work on integer types only.

## Real World Application

Bitwise operations are essential in embedded programming — setting/clearing hardware register bits, implementing flags and permissions, CRC computation, cryptography, compression, and graphics (color channel masking).
