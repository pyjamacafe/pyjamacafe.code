+++
date = '2026-07-06T18:00:00+05:30'
draft = false
title = 'DWT Cycle Counter for Profiling'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 14
weight = 3
initial_code = '''#include <stdio.h>

#define DWT_CYCCNT  (*(volatile unsigned int *)0xE0001004)
#define DWT_CONTROL (*(volatile unsigned int *)0xE0001000)
#define DWT_LAR     (*(volatile unsigned int *)0xE0001FB0)
#define SCB_DEMCR   (*(volatile unsigned int *)0xE000EDFC)

void dwt_init(void) {
    // Enable DWT and cycle counter
    SCB_DEMCR |= (1 << 24);       // TRCENA
    DWT_LAR = 0xC5ACCE55;        // Unlock DWT (if locked)
    DWT_CONTROL |= 1;             // Enable CYCCNT
}

unsigned int dwt_get_cycles(void) {
    return DWT_CYCCNT;
}

int main(void) {
    dwt_init();
    unsigned int start = dwt_get_cycles();

    // Code to profile
    volatile int sum = 0;
    for (int i = 0; i < 100; i++) {
        sum += i;
    }

    unsigned int elapsed = dwt_get_cycles() - start;
    printf("Elapsed cycles: %u\\n", elapsed);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Cycle count measured'
+++

## Problem Statement

Initialise the DWT (Data Watchpoint and Trace) cycle counter to measure the execution time of a code section in CPU cycles. Write a simple profiling wrapper that records the cycle count before and after a function call, then prints the difference.

## Theory and Concepts

- The DWT_CYCCNT register increments on every CPU cycle.
- It must be enabled by setting the TRCENA bit in DEMCR and the CYCCNTENA bit in DWT_CONTROL.
- The DWT unit may be locked; writing the unlock key (0xC5ACCE55) to DWT_LAR enables access.
- Cycle counting works on Cortex-M3 and above (M4, M7, M33, M55). Not available on Cortex-M0/M0+/M23.
- The counter wraps every ~4 billion cycles (32-bit). Use `uint32_t` subtraction to handle wrapping correctly.

## Real World Application

Cycle-accurate profiling is essential for optimising time-critical code — interrupt service routines, audio processing, control loops, and communication protocol handling. The DWT cycle counter provides a low-overhead way to measure performance without an external profiler.
