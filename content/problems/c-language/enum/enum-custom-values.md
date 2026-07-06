+++
date = '2026-07-06T14:08:00+05:30'
draft = false
title = 'Enum with Custom Values'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 15
weight = 2
initial_code = '''#include <stdio.h>

enum error_code {
    SUCCESS      = 0,
    ERR_TIMEOUT  = -1,
    ERR_BUSY     = -2,
    ERR_INVALID  = -3,
    ERR_UNKNOWN  = 99
};

int main(void) {
    enum error_code ec = ERR_TIMEOUT;

    printf("Error code: %d\\n", ec);

    // Enums can have negative values too
    printf("All codes: %d, %d, %d, %d, %d\\n",
           SUCCESS, ERR_TIMEOUT, ERR_BUSY, ERR_INVALID, ERR_UNKNOWN);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'All error codes printed'
+++

## Problem Statement

Define an enumeration for error codes with explicitly assigned values, including negative values and non-sequential values. Print each enumerator's value. Explain that enum values are just integers and can be any integer constant expression.

## Theory and Concepts

- Enumerators can be assigned explicit integer values: `ERR_TIMEOUT = -1`.
- Multiple enumerators can share the same value (e.g., `FAIL = -1, ERROR = -1`).
- Uninitialized enumerators continue from the previous value (increment by 1).
- The values must be integer constant expressions.
- Enum values can be negative, zero, or positive — any value within the range of `int`.

## Real World Application

Custom enum values are used for error codes where 0 means success and negative means failure, bit flags where each constant is a power of 2, status codes that must match specific hardware or protocol values, and state values that begin at a specific number.
