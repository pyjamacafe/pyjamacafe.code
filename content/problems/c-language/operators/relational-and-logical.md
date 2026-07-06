+++
date = '2026-07-06T13:11:00+05:30'
draft = false
title = 'Relational and Logical Operators'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 2
initial_code = '''#include <stdio.h>
#include <stdbool.h>

int main(void) {
    int a = 5, b = 10, c = 5;

    // Relational: == != < > <= >=
    // Logical: && || !
    bool result1 = (a == c) && (b > a);
    bool result2 = (a > b) || (b > c);
    bool result3 = !(a == b);

    // Print each result

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Relational and logical operator results demonstrated'
+++

## Problem Statement

Use relational operators (`==`, `!=`, `<`, `>`, `<=`, `>=`) to compare integers. Combine them with logical operators (`&&`, `||`, `!`) to form compound conditions. Print the boolean results (0 or 1) and verify short-circuit evaluation.

## Theory and Concepts

- Relational operators return 1 (true) or 0 (false).
- `&&` (logical AND) — returns true if both operands are true. Short-circuits: if left is false, right is not evaluated.
- `||` (logical OR) — returns true if either operand is true. Short-circuits: if left is true, right is not evaluated.
- `!` (logical NOT) — inverts the truth value.
- In C, any non-zero value is considered true; zero is false.

## Real World Application

Relational and logical operators are used in every conditional statement — checking sensor thresholds, validating user input, implementing state machines, and controlling program flow based on multiple conditions.
