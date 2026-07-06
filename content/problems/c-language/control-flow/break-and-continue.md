+++
date = '2026-07-06T13:25:00+05:30'
draft = false
title = 'Break and Continue'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    // Print odd numbers up to 10 (skip evens with continue)
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) continue;
        printf("%d ", i);
    }
    printf("\\n");

    // Find first number divisible by 7 between 1 and 50
    for (int j = 1; j <= 50; j++) {
        if (j % 7 == 0) {
            printf("Found: %d\\n", j);
            break;
        }
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '1 3 5 7 9 \\n Found: 7'
+++

## Problem Statement

Use `continue` to skip even numbers in a loop (printing only odds). Use `break` to exit a loop early when a number divisible by 7 is found. Explain how each alters the normal loop flow.

## Theory and Concepts

- `break`: immediately exits the innermost enclosing loop or `switch`.
- `continue`: skips the rest of the current iteration and proceeds to the next loop iteration (update + condition check).
- `break` is useful for early termination (search found, error detected).
- `continue` is useful for skipping invalid cases without deeply nested `if`.
- Both affect only the innermost loop; to break out of nested loops, use flags or `goto`.

## Real World Application

Break is used in search loops (find first matching element), input validation (exit on invalid data), and error handling. Continue is used to skip malformed records in data processing, filter invalid sensor readings, and implement producer-consumer patterns with skip conditions.
