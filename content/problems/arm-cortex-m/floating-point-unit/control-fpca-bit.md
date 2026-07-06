+++
date = '2026-07-06T18:21:00+05:30'
draft = false
title = 'CONTROL.FPCA and FPU Context Tracking'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 4
initial_code = '''#include <stdio.h>

unsigned int get_control(void) {
    unsigned int result;
    __asm("MRS %0, CONTROL" : "=r" (result));
    return result;
}

int main(void) {
    // Check FPCA bit (bit 2 of CONTROL)
    unsigned int control = get_control();

    if (control & (1 << 2)) {
        printf("FPCA set: FPU context is active\\n");
    } else {
        printf("FPCA clear: FPU context is inactive\\n");
    }

    // The FPCA bit is set automatically when any FPU instruction executes
    // It is cleared on exception return if lazy stacking was used

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'FPCA bit state read'
+++

## Problem Statement

Read the CONTROL register and examine the FPCA (Floating-point Context Active) bit. Perform a floating-point operation and re-read the CONTROL register to observe how the FPCA bit is automatically set by the hardware when an FPU instruction executes.

## Theory and Concepts

- CONTROL.FPCA (bit 2) indicates whether the FPU has been used since the last exception entry or return.
- The bit is set automatically by hardware when any FPU instruction executes.
- The bit is cleared on exception return if lazy stacking was used and the FPU state was not modified.
- The OS can use the FPCA bit to determine whether floating-point context needs to be saved during a context switch — if FPCA is clear, there is no need to save FPU registers.
- In an RTOS, the FPCA bit is checked during context switching to optimise FPU register save/restore.

## Real World Application

The FPCA bit enables RTOSes to implement FPU-lazy context switching — a task that never uses the FPU does not incur the overhead of FPU register save/restore during context switches. This is critical for systems with many tasks where only a few use floating-point.
