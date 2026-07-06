+++
date = '2026-07-06T13:19:00+05:30'
draft = false
title = 'Float to Int Conversion'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 4
weight = 4
initial_code = '''#include <stdio.h>
#include <math.h>

int main(void) {
    float f1 = 3.7f;
    float f2 = -3.7f;

    int i1 = (int)f1;        // truncation toward zero
    int i2 = (int)f2;        // truncation toward zero
    int i3 = round(f1);      // round to nearest
    int i4 = ceil(f1);       // round up
    int i5 = floor(f1);      // round down

    // Print all results

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Truncation: 3, -3, Round: 4, Ceil: 4, Floor: 3'
+++

## Problem Statement

Convert a floating-point value to an integer using different rounding methods: truncation toward zero (direct cast), rounding to nearest (`round`), ceiling (`ceil`), and floor (`floor`). Test with both positive and negative values to see the differences.

## Theory and Concepts

- Direct cast `(int)f` truncates toward zero (discards the fractional part).
- `round()` rounds to the nearest integer (half away from zero).
- `ceil()` rounds up (toward +∞), `floor()` rounds down (toward −∞).
- All rounding functions require `<math.h>` and linking with `-lm`.
- Losing the fractional part without rounding can introduce significant errors in accumulated calculations.

## Real World Application

Float-to-int conversion is needed when displaying values (rounding to 2 decimal places), converting sensor readings to integer display units, implementing quantizers in audio/DSP, and writing money amounts that require exact cent values.
