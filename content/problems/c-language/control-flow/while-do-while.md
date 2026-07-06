+++
date = '2026-07-06T13:24:00+05:30'
draft = false
title = 'While and Do-While Loops'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 4
initial_code = '''#include <stdio.h>

int main(void) {
    // While loop: print 1 to 5
    int i = 1;
    while (i <= 5) {
        printf("%d ", i);
        i++;
    }
    printf("\\n");

    // Do-while: runs at least once
    int j = 1;
    do {
        printf("%d ", j);
        j++;
    } while (j <= 5);
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Both loops produce 1 2 3 4 5'
+++

## Problem Statement

Implement the same counting logic (1 to 5) using a `while` loop and a `do-while` loop. Then show the difference by passing a value that makes the condition false initially — observe that `do-while` runs once while `while` runs zero times.

## Theory and Concepts

- `while (condition) { body }`: checks the condition before executing the body (may execute 0 times).
- `do { body } while (condition);`: executes the body once, then checks the condition (always executes at least once).
- Both require the condition to be eventually false to avoid infinite loops.
- Loop variables must be updated inside the body to progress toward termination.

## Real World Application

While loops are used when the number of iterations is unknown in advance — reading characters from a string until null, processing packets until the buffer is empty, polling a hardware flag until it clears. Do-while is useful for menu displays that must appear at least once.
