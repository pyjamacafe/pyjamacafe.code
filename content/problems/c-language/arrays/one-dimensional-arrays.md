+++
date = '2026-07-06T13:50:00+05:30'
draft = false
title = 'One-dimensional Arrays'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 11
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    int scores[5] = {85, 92, 78, 95, 88};
    int sum = 0;

    for (int i = 0; i < 5; i++) {
        sum += scores[i];
    }

    double average = (double)sum / 5;
    printf("Average: %.1f\\n", average);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Average: 87.6'
+++

## Problem Statement

Declare and initialize a one-dimensional integer array with 5 elements. Compute the sum using a loop, then calculate and print the average. Use array indexing to access each element.

## Theory and Concepts

- Array declaration: `type name[size]` where size must be a constant expression (C89) or a variable (C99 VLA).
- Array indices start at 0 and go up to `size - 1`.
- Arrays are stored contiguously in memory.
- The array name decays to a pointer to the first element when passed to a function.
- `sizeof(array) / sizeof(array[0])` gives the number of elements (only works in the array's definition scope).

## Real World Application

One-dimensional arrays are the most fundamental data structure in C — used for buffers, sensor data logs, lookup tables, audio samples, pixel rows, and any collection of elements that needs sequential access.
