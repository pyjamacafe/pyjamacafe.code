+++
date = '2026-07-06T13:14:00+05:30'
draft = false
title = 'Conditional (Ternary) Operator'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    int score = 75;
    const char *grade = (score >= 60) ? "Pass" : "Fail";

    // Print grade
    // Use nested ternary for A/B/C/F grades

    int a = 10, b = 20;
    int max = (a > b) ? a : b;

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Grade: Pass, Max: 20'
+++

## Problem Statement

Use the conditional operator (`?:`) to assign a value based on a condition. First determine pass/fail based on a score threshold. Then extend to multiple grades using nested ternary expressions (or combine with if-else for readability).

## Theory and Concepts

- `condition ? value_if_true : value_if_false` evaluates to one of two expressions.
- The conditional operator is the only ternary operator in C.
- Both `value_if_true` and `value_if_false` must have compatible types.
- Ternary expressions can be nested, but deep nesting harms readability.
- The conditional operator can be used in places where `if-else` cannot, such as inside `printf` arguments or `return` statements.

## Real World Application

The ternary operator is used for concise conditional assignments — clamping values to ranges, selecting between two configurations, handling null-pointer defaults, and inline condition checks in return statements.
