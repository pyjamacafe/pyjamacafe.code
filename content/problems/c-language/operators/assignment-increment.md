+++
date = '2026-07-06T13:13:00+05:30'
draft = false
title = 'Assignment and Increment/Decrement'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 4
initial_code = '''#include <stdio.h>

int main(void) {
    int x = 10;

    // Compound assignment
    x += 5;  // x = x + 5
    x -= 3;  // x = x - 3
    x *= 2;  // x = x * 2
    x /= 4;  // x = x / 4

    // Prefix vs postfix
    int a = 1, b = 1;
    int pre = ++a;    // a incremented first
    int post = b++;   // b incremented after

    // Print results

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Assignment and increment/decrement demonstrated'
+++

## Problem Statement

Demonstrate compound assignment operators (`+=`, `-=`, `*=`, `/=`, etc.) and the difference between prefix (`++x`) and postfix (`x++`) increment/decrement. Print the values before and after each operation to clearly show when the increment takes effect.

## Theory and Concepts

- `x += 5` is equivalent to `x = x + 5` but evaluates `x` only once.
- Compound operators exist for most binary operators: `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`.
- `++x` (prefix): increments x, then returns the new value.
- `x++` (postfix): returns the old value, then increments x.
- Using postfix in complex expressions can lead to undefined behavior if the same variable is modified and read without a sequence point.

## Real World Application

Increment and decrement are ubiquitous in loops, array traversal, and pointer advancement. Compound assignments make code shorter and often map directly to single machine instructions, improving efficiency in tight loops.
