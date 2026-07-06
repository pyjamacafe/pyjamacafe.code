+++
date = '2026-07-06T13:21:00+05:30'
draft = false
title = 'if-else Decision Making'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int temperature = 75;

    if (temperature > 85) {
        printf("Hot\\n");
    } else if (temperature > 60) {
        printf("Warm\\n");
    } else {
        printf("Cool\\n");
    }

    // Modify values and observe

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Warm'
+++

## Problem Statement

Write a program using `if-else if-else` to classify a temperature reading into categories (Hot, Warm, Cool, Cold). Change the threshold values and the input to see different branches execute.

## Theory and Concepts

- `if (condition) { ... }` executes a block if the condition is true (non-zero).
- `else if (condition) { ... }` checks an alternative condition.
- `else { ... }` executes if no prior condition matched.
- Conditions are evaluated in order; the first true branch is executed and the rest are skipped.
- Braces are optional for single statements, but always using them prevents dangling-else ambiguity.

## Real World Application

If-else chains are used for menu selection, sensor threshold detection (alarm levels), input validation, and state-dependent behavior in embedded systems and applications.
