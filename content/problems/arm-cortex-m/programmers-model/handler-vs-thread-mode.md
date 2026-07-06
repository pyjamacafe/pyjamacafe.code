+++
date = '2026-07-06T10:04:00+05:30'
draft = false
title = 'Handler Mode vs Thread Mode and Privilege Levels'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 5
initial_code = '''// Detect execution mode and privilege level
#include <stdio.h>
#include <stdint.h>

void svcall_handler(void) {
    uint32_t control;
    uint32_t xpsr;

    __asm volatile(
        "MRS %0, CONTROL \\n\\t"
        "MRS %1, xPSR    \\n\\t"
        : "=r" (control), "=r" (xpsr)
    );

    uint32_t exception_num = xpsr & 0x1FF;
    uint32_t npriv = control & 1;
    uint32_t spsel = (control >> 1) & 1;

    printf("  Inside handler - Exception: %u\\n", exception_num);
    printf("  CONTROL: nPRIV=%u, SPSEL=%u\\n", npriv, spsel);
    printf("  Privileged: %s\\n", npriv ? "NO (unprivileged)" : "YES (privileged)");
}

__attribute__((naked)) void SVC_Handler(void) {
    __asm volatile(
        "TST LR, #4        \\n\\t"
        "ITE EQ             \\n\\t"
        "MRSEQ R0, MSP      \\n\\t"
        "MRSNE R0, PSP      \\n\\t"
        "B svcall_handler   \\n\\t"
    );
}

void trigger_svc(void) {
    printf("Before SVC:\\n");

    __asm volatile("SVC 0");
}

int main(void) {
    trigger_svc();

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that detects the current execution mode (Thread vs Handler) and privilege level (Privileged vs Unprivileged) of the Cortex-M processor. Use the CONTROL register and IPSR field of xPSR to determine the state. Trigger an SVC exception from thread mode and analyze the mode change inside the handler.

## Theory and Concepts

- Thread mode executes normal application code. Handler mode executes exception handlers.
- Privileged code has full access to all registers and memory. Unprivileged code has restricted access (MPU-dependent).
- CONTROL[0] (nPRIV): 0 = privileged thread, 1 = unprivileged thread.
- CONTROL[1] (SPSEL): 0 = MSP, 1 = PSP (only configurable in privileged thread mode).
- IPSR[8:0] = 0 in thread mode, non-zero in handler mode.
- SVC (Supervisor Call) causes an exception that enters handler mode from thread mode.
- LR is set to EXC_RETURN on exception entry, with bits encoding return mode, stack used, and privilege.

## Real World Application

RTOS kernels use unprivileged thread mode for user tasks to prevent them from corrupting kernel data structures. System calls via SVC allow user tasks to request privileged operations safely. This is fundamental to ARM TrustZone secure partitioning and MPU-based isolation.

