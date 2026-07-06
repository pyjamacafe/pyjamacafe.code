+++
date = '2026-07-06T18:22:00+05:30'
draft = false
title = 'FPU Exception Handling'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 5
initial_code = '''#include <stdio.h>

// Enable FPU exceptions in FPSCR
void enable_fpu_exceptions(void) {
    unsigned int fpscr;
    __asm("VMRS %0, FPSCR" : "=r" (fpscr));

    // Clear cumulative flags, then enable exception traps
    fpscr &= ~(0x1F);  // Clear IOC, DZC, OFC, UFC, IXC
    fpscr |= (1 << 8);  // DZEN: division by zero trap enable
    fpscr |= (1 << 9);  // OFEN: overflow trap enable
    fpscr |= (1 << 12); // IOCEN: invalid operation trap enable

    __asm("VMSR FPSCR, %0" : : "r" (fpscr));
}

int main(void) {
    enable_fpu_exceptions();

    // This division by zero would trigger a fault
    // (commented out to avoid lockup)
    // float bad = 1.0f / 0.0f;

    float safe = 1.0f / 2.0f;
    printf("Result: %f\\n", safe);
    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'FPU exceptions configured'
+++

## Problem Statement

Configure the FPU to trap floating-point exceptions (division by zero, overflow, invalid operation) by setting the appropriate enable bits in the FPSCR. Explain what happens when the condition occurs — the FPU generates a UsageFault exception that can be handled in software.

## Theory and Concepts

- The FPSCR has trap enable bits (bits 8–12) that cause an exception when the corresponding floating-point error occurs.
- When a floating-point exception is enabled and the condition occurs, the FPU generates a UsageFault (if the FPU is configured to trap).
- The UsageFault handler can inspect the FPSCR to determine which exception occurred.
- If the trap is not enabled, the exception flag is set in FPSCR and execution continues with a default result (infinity, NaN, or the truncated result).
- Some FPU exceptions (like Inexact) are expected in normal operation and should typically not be trapped.
- The Cortex-M FPU supports synchronous exceptions — the fault is reported at the instruction that caused it.

## Real World Application

FPU exception handling is critical in safety-critical systems (IEC 61508, ISO 26262) where floating-point errors must be detected and handled properly — for example, detecting a sensor that returns infinity or NaN, or catching a division-by-zero in a control algorithm before it causes system failure.
