+++
date = '2026-07-06T13:07:00+05:30'
draft = false
title = 'Enumeration Constants'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 3
initial_code = '''#include <stdio.h>

enum weekdays { MON, TUE, WED, THU, FRI, SAT, SUN };
enum colors { RED = 1, GREEN = 3, BLUE = 5 };

int main(void) {
    enum weekdays today = WED;
    enum colors c = GREEN;

    // Print the enum values

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Enum values: MON=0, TUE=1, WED=2, RED=1, GREEN=3, BLUE=5'
+++

## Problem Statement

Define an `enum` for days of the week (starting from 0) and an `enum` for colors with explicitly assigned values. Print the numeric values of each enumerator and verify that they match the expected sequence.

## Theory and Concepts

- `enum` creates an integer type with named constants.
- By default, enumerators start at 0 and increment by 1.
- Explicit values can be assigned: `RED = 1`.
- Uninitialized enumerators continue from the previous value.
- `enum` constants are `int` and can be used wherever integers are expected.

## Real World Application

Enums are used for state machines (IDLE, RUNNING, ERROR), configuration options (MODE_A, MODE_B), error codes (SUCCESS, ERR_TIMEOUT, ERR_BUSY), and command identifiers. They make code more readable than raw integer constants.
