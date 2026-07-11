+++
date = '2026-07-06T18:22:00+05:30'
draft = true
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
    printf("Result: %f\n", safe);
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

===EXPLANATION===

The ARM FPU implements IEEE 754 exception handling with a two‑tier model: default (no‑trap) mode, where exceptions set cumulative flags and produce default results (Inf, NaN, 0), and trap‑enabled mode, where exceptions trigger a UsageFault. The FPSCR contains both the enable bits (IOCEN, DZEN, OFEN, UFEN, IXEN — bits 8‑12) and the cumulative flags (IOC, DZC, OFC, UFC, IXC — bits 0‑4).

The historical context: IEEE 754 originally mandated trap handling, but most implementations default to no‑trap mode because trapping is expensive and complicates pipelines. ARM's FPU supports both, letting safety‑critical applications enable traps where needed while leaving performance‑sensitive code in no‑trap mode.

When a FPU exception occurs with its trap enabled, the FPU sets the cumulative flag, generates a synchronous UsageFault (UsageFault cause bit 0 — INVSTATE — or more precisely, the FPU invokes the UsageFault via the FPEXC register's EX bit). The handler reads the FPSCR to determine which exception(s) occurred. Because the fault is synchronous, the stacked PC points to the faulting VFP instruction — the handler can inspect or correct the operands and retry.

A motor control application using FOC (Field‑Oriented Control) exemplifies both modes. During normal operation, no‑trap mode is used: a division by zero produces infinity, the control loop saturates, and the system continues. But a separate safety monitor, running on a watchdog timer, checks the FPSCR cumulative flags. If OFC or DZC is set, the monitor flags a potential sensor fault and initiates a safe shutdown.

Visualise a fire alarm system with two modes. In "detect and report" mode (no‑trap), smoke triggers a light on the panel but does not evacuate the building. In "detect and act" mode (trap‑enabled), smoke triggers the sprinklers immediately. The building manager chooses the mode based on the area's risk level.

Key points:
1. Trap‑enabled FPU exceptions generate UsageFault, not HardFault directly.
2. The cumulative flags are sticky — they must be cleared by software after handling.
3. The FPU does not support precise exception recovery on Cortex‑M — the handler cannot reliably fix up and continue.
4. The FZ (flush‑to‑zero) mode suppresses underflow exceptions by flushing denormals to zero.
5. The DN (default NaN) mode simplifies NaN handling.


ARM's *ARMv7‑M Architecture Reference Manual*, "Floating‑point exception handling" section, defines the FPU fault model. The IEEE 754‑2008 standard specifies the five exception types. Safety‑critical guidance is available in IEC 61508‑3 and ISO 26262‑6.
