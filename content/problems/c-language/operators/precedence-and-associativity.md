+++
date = '2026-07-06T13:15:00+05:30'
draft = false
title = 'Operator Precedence and Associativity'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 6
initial_code = '''#include <stdio.h>

int main(void) {
    int a = 5, b = 10, c = 3, d = 2;

    // Predict the result before running
    int result1 = a + b * c;
    int result2 = (a + b) * c;
    int result3 = a << 1 + b;
    int result4 = (a << 1) + b;

    // Print results and compare with predictions

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Precedence results: 35, 45, ...'
+++

## Problem Statement

Write expressions that combine different operators and predict the results based on precedence and associativity rules. Then run the program to verify. Include at least one expression where wrong precedence gives a surprising result (e.g., `a << 1 + b` vs `(a << 1) + b`).

## Theory and Concepts

- Operator precedence determines which operator is evaluated first (e.g., `*` before `+`).
- Associativity determines the order when operators have the same precedence (left-to-right for most, right-to-left for assignment and unary operators).
- Common pitfalls: `*p++` is parsed as `*(p++)`, `a << 1 + b` is parsed as `a << (1 + b)`.
- When in doubt, use parentheses — they make the intention clear and avoid subtle bugs.

## Real World Application

Understanding precedence prevents bugs in arithmetic expressions, bit manipulations, and pointer operations. Code reviewers often flag expressions that rely on implicit precedence without parentheses, as they are error-prone during maintenance.
