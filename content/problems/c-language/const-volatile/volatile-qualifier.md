+++
date = '2026-07-06T14:14:00+05:30'
draft = false
title = 'Volatile Type Qualifier'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 17
weight = 3
initial_code = '''#include <stdio.h>

// Simulated hardware register
volatile int status_register = 0;

void hardware_interrupt(void) {
    // Called by interrupt (simulated here)
    status_register = 1;
}

int main(void) {
    // Without volatile, compiler might optimise this loop away
    while (status_register == 0) {
        // Wait for hardware to set the register
        // volatile ensures the compiler re-reads the variable each time
        printf("Waiting...\\n");
        break;  // To avoid infinite loop in simulation
    }

    printf("Status changed!\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'volatile qualifier demonstrated'
+++

## Problem Statement

Simulate a hardware register using a `volatile` variable. Write a loop that polls the variable until it changes. Explain that without `volatile`, the compiler might optimize the read into a single load, never noticing external changes.

## Theory and Concepts

- `volatile` tells the compiler that a variable can change at any time (outside the program's normal flow — e.g., by hardware, interrupt, or another thread).
- Without `volatile`, the compiler may optimize reads into registers, caching the value and never re-reading from memory.
- `volatile` prevents the compiler from optimizing away reads, writes, or reordering accesses.
- `volatile` is a type qualifier (like `const`). It can be combined: `volatile const int *reg`.
- `volatile` does not guarantee atomicity — use atomic types or locks for concurrent access.

## Real World Application

`volatile` is essential in embedded programming for memory-mapped peripheral registers, interrupt service routine communication, shared variables in signal handlers, and delay loop counters that the compiler would otherwise optimize away.
