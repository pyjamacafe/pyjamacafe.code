+++
date = '2026-07-06T14:33:00+05:30'
draft = false
title = 'const and volatile Together'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 17
weight = 5
initial_code = '''#include <stdio.h>

// Simulated hardware status register
// const: program should not modify it
// volatile: hardware can change it at any time
volatile const int hardware_status = 0;

void simulate_interrupt(void) {
    // In real code, an interrupt handler would modify this
    // Here we need to cast away const (simulation only)
    *(volatile int *)&hardware_status = 1;
}

int main(void) {
    printf("Initial: %d\\n", hardware_status);

    simulate_interrupt();
    printf("After interrupt: %d\\n", hardware_status);

    // Read-only from software perspective
    // hardware_status = 5;  // ERROR: const

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'const volatile demonstrated'
+++

## Problem Statement

Declare a variable with both `const` and `volatile` qualifiers — `const` means software should not modify it, `volatile` means it can change externally (e.g., by hardware). Demonstrate reading from it and explain why both qualifiers are needed for memory-mapped hardware registers.

## Theory and Concepts

- `const volatile` means the variable is read-only from the software's perspective but can change at any time due to external factors.
- `const` prevents the software from accidentally writing to it (compiler error).
- `volatile` prevents the compiler from optimizing reads (always re-read from memory).
- This combination is used for read-only hardware status registers, real-time clock values, and read-only memory-mapped I/O.
- Trying to cast away `const` from a `const volatile` variable is undefined behavior (except when the variable is truly modifiable underneath).

## Real World Application

`const volatile` is used in embedded systems for read-only hardware registers (status flags, version IDs, timer values), shared memory between CPU and peripherals, and memory-mapped sensor data that the CPU reads but should not write to.
