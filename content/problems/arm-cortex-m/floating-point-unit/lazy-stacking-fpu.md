+++
date = '2026-07-06T18:20:00+05:30'
draft = false
title = 'FPU Lazy Stacking Configuration'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 3
initial_code = '''#include <stdio.h>

#define FPCCR (*(volatile unsigned int *)0xE000EF34)
#define FPCAR (*(volatile unsigned int *)0xE000EF38)

void configure_fpu_stacking(void) {
    // ASPEN = 1: automatic state preservation
    // LSPEN = 1: lazy state preservation
    // Set bits 31 (ASPEN) and 30 (LSPEN) in FPCCR
    FPCCR |= (1 << 31) | (1 << 30);
    __asm("DSB");
    __asm("ISB");
}

int main(void) {
    configure_fpu_stacking();
    printf("FPU lazy stacking configured\\n");

    // Perform some FPU operations
    float a = 3.0f, b = 4.0f;
    float c = a * a + b * b;
    printf("Result: %f\\n", c);

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'Lazy stacking configured and FPU used'
+++

## Problem Statement

Configure the FPU's automatic and lazy stacking mechanisms by setting the ASPEN and LSPEN bits in the FPCCR register. Explain when each mode is used and how lazy stacking reduces interrupt latency when the FPU is not actively used by the interrupted context.

## Theory and Concepts

- FPCCR.ASPEN (bit 31): Automatic State Preservation — enables hardware to automatically save/restore FPU state on exception entry/exit.
- FPCCR.LSPEN (bit 30): Lazy State Preservation — FPU registers are marked as invalid on exception entry but only actually saved when the handler uses an FPU instruction.
- When lazy stacking is enabled, the CPU sets the FPCA (Floating-Point Context Active) flag in the CONTROL register when an FPU instruction executes.
- On exception entry, if LSPEN=1, the CPU writes a flag value to FPCAR instead of saving all 32 FPU registers (saving ~100 cycles).
- If the handler uses the FPU, the lazy preservation mechanism triggers a synchronous save before the FPU instruction executes.
- If the handler does not use the FPU, the save is skipped entirely — the FPU state remains in the interrupted context.

## Real World Application

Lazy FPU stacking is essential in RTOS environments where multiple tasks share the FPU but most interrupt handlers do not use floating-point. It can reduce worst-case interrupt latency by over 100 cycles compared to eager stacking.
