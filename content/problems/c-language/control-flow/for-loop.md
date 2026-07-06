+++
date = '2026-07-06T13:23:00+05:30'
draft = false
title = 'For Loop'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 3
initial_code = '''#include <stdio.h>

int main(void) {
    // Print numbers 1 to 10
    for (int i = 1; i <= 10; i++) {
        printf("%d ", i);
    }
    printf("\\n");

    // Count down from 10 to 1
    for (int j = 10; j >= 1; j--) {
        printf("%d ", j);
    }
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '1 2 3 4 5 6 7 8 9 10 \\n 10 9 8 7 6 5 4 3 2 1'
+++

## Problem Statement

Write a program that uses a `for` loop to print numbers from 1 to 10, then another `for` loop to count down from 10 to 1. Understand the three parts of the `for` statement: initialization, condition, and update.

## Theory and Concepts

- `for (init; condition; update) { body }`:
  - `init` runs once before the loop starts (typically declares and initializes a counter).
  - `condition` is tested before each iteration; loop continues while true.
  - `update` runs after each iteration (typically increments/decrements the counter).
- Any of the three parts can be empty (`for (;;)` is an infinite loop).
- Variables declared in `init` (C99+) are scoped to the loop.

## Real World Application

For loops are used for iterating over arrays, processing buffers, generating sequences, implementing time delays (blinking LEDs at different rates), and any repetitive task with a known iteration count.
