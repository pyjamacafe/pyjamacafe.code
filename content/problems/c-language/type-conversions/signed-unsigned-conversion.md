+++
date = '2026-07-06T13:18:00+05:30'
draft = false
title = 'Signed and Unsigned Conversion'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 4
weight = 3
initial_code = '''#include <stdio.h>

int main(void) {
    signed int s = -1;
    unsigned int u = 1;

    // Compare signed with unsigned
    if (s < u) {
        printf("s is less than u\\n");
    } else {
        printf("s is NOT less than u (surprising!)\\n");
    }

    // Print s as unsigned
    printf("s as unsigned: %u\\n", s);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 's as unsigned: 4294967295'
+++

## Problem Statement

Compare a negative signed integer with a positive unsigned integer. Print the result of the comparison and explain why it is counterintuitive. Also print the signed value using `%u` (unsigned format specifier) to see the wrapped value.

## Theory and Concepts

- When comparing `signed int` with `unsigned int`, the signed value is implicitly converted to unsigned.
- Negative numbers wrap to large unsigned values (e.g., -1 becomes 2³²−1 on 32-bit).
- This can cause `s < u` to be false even when s is -1 and u is 1.
- Always be aware of implicit signed/unsigned conversions — they can introduce subtle bugs.
- Enable compiler warnings (`-Wsign-compare` or `-Wall`) to catch these issues.

## Real World Application

Signed/unsigned comparison bugs are notorious in production code — loop conditions like `i < array.length` where `i` is signed and `length` is unsigned can fail. This category of bug affected Java`s `Arrays.binarySearch` and countless C/C++ projects.
