+++
date = '2026-07-06T18:29:00+05:30'
draft = false
title = 'Missing volatile in ISR-main Communication'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 2
initial_code = '''#include <stdio.h>

// BUG: missing volatile — compiler may optimise reads
int flag = 0;

// FIX: volatile int flag = 0;

void SysTick_Handler(void) {
    flag = 1;  // Set by interrupt
}

int main(void) {
    // Without volatile, the compiler may optimise this to:
    // if (0 != 0) — always false
    // Or load flag once into a register and never re-read
    while (flag == 0) {
        // Wait for interrupt
        // Without volatile, this may be infinite!
        break;  // Prevent infinite loop in simulation
    }

    printf("Flag detected!\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'volatile bug demonstrated'
+++

## Problem Statement

Demonstrate the bug caused by missing `volatile` on a shared variable between an interrupt handler and the main loop. Explain that without `volatile`, the compiler may optimise the read of `flag` into a register, never re-reading from memory, resulting in an infinite loop.

## Theory and Concepts

- The `volatile` keyword tells the compiler that a variable can change at any time, outside the normal program flow (e.g., by an interrupt handler).
- Without `volatile`, the compiler assumes the variable is only modified by the current thread of execution and may optimise repeated reads into a single register load.
- This optimisation can cause infinite loops in embedded code where a flag is set by an ISR and polled in the main loop.
- `volatile` should be used for: global variables shared between ISR and main, memory-mapped peripheral registers, and variables modified by DMA.
- `volatile` does NOT provide atomicity — use atomic types or critical sections for read-modify-write operations.

## Real World Application
Missing `volatile` is one of the most common embedded C bugs, especially for beginners. It causes intermittent failures that are difficult to reproduce — the code works in debug (where optimisation is off) but fails in release builds or when cache/prefetch is enabled.
