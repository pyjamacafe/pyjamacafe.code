+++
date = '2026-07-06T13:00:00+05:30'
draft = false
title = 'Signed and Unsigned Integers'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    signed int a = -10;
    unsigned int b = 10;

    // Print both values
    // Try assigning a negative value to b

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Signed and unsigned values demonstrated'
+++

## Problem Statement

Write a program that declares and prints signed and unsigned integer variables. Show what happens when you assign a negative value to an unsigned variable and explain the output.

## Theory and Concepts

- `signed int` can hold both positive and negative values (range depends on size, typically −2³¹ to 2³¹−1 for 32-bit).
- `unsigned int` can only hold non-negative values (range 0 to 2³²−1).
- Assigning a negative number to an unsigned variable wraps around (two's complement representation).
- The `%u` format specifier prints unsigned values; `%d` prints signed values.

## Real World Application

Choosing between signed and unsigned integers is critical in systems programming — array indices, sizes, and counts are usually unsigned; temperatures, deltas, and error codes are often signed. Mismatches can cause subtle bugs (e.g., infinite loops when comparing signed with unsigned).

===EXPLANATION===

When you assign a negative value to an unsigned variable, the value is converted using modulo arithmetic. For a 32-bit `unsigned int`, the range is 0 to 2³²−1. Assigning −1 wraps around to 2³²−1 (4,294,967,295).

In two's complement representation, −1 is stored as `0xFFFFFFFF` — all bits set. When interpreted as unsigned, this is the maximum unsigned value.

### Example

```c
unsigned int x = -1;
printf("%u\n", x);  // Prints 4294967295
```

This behaviour is defined by the C standard and is not undefined. However, mixing signed and unsigned integers in comparisons can lead to subtle bugs because the signed value is implicitly converted to unsigned before the comparison.
