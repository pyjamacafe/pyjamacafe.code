+++
date = '2026-07-06T10:04:00+05:30'
draft = true
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
        "MRS %0, CONTROL \n\\t"
        "MRS %1, xPSR    \n\\t"
        : "=r" (control), "=r" (xpsr)
    );

    uint32_t exception_num = xpsr & 0x1FF;
    uint32_t npriv = control & 1;
    uint32_t spsel = (control >> 1) & 1;

    printf("  Inside handler - Exception: %u\n", exception_num);
    printf("  CONTROL: nPRIV=%u, SPSEL=%u\n", npriv, spsel);
    printf("  Privileged: %s\n", npriv ? "NO (unprivileged)" : "YES (privileged)");
}

__attribute__((naked)) void SVC_Handler(void) {
    __asm volatile(
        "TST LR, #4        \n\\t"
        "ITE EQ             \n\\t"
        "MRSEQ R0, MSP      \n\\t"
        "MRSNE R0, PSP      \n\\t"
        "B svcall_handler   \n\\t"
    );
}

void trigger_svc(void) {
    printf("Before SVC:\n");

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

===EXPLANATION===

The Thread/Handler mode split has been part of Cortex-M since ARMv6-M, but its full power emerged with ARMv7-M's MPU and unprivileged support. Before Cortex-M, ARM7TDMI-based MCUs had a single mode running all code — a buggy task could corrupt the kernel or other tasks. Cortex-M introduced two distinct worlds: Thread mode for application code, Handler mode for exception handlers. ARMv7-M added the CONTROL register to further split Thread mode into privileged (CONTROL[0]=0) and unprivileged (CONTROL[0]=1). This three-tier model (Handler privileged, Thread privileged, Thread unprivileged) is what enables modern RTOS-based isolation.

The intuition: Thread mode is the "user space" of the microcontroller; Handler mode is the "kernel space." When an interrupt fires, the processor automatically switches to Handler mode with full privilege — no explicit mode switch is needed. The CONTROL register's nPRIV bit lets the kernel downgrade a thread to unprivileged, preventing it from accessing MPU-protected memory, executing CPS (change processor state), or touching the NVIC directly. To perform privileged work, the thread must execute an SVC instruction, which triggers an exception that enters Handler mode — the kernel then performs the requested operation and returns to Thread mode.

Professional RTOS implementations depend on this. FreeRTOS runs all tasks in Thread mode — the kernel configures privileged threads by default, or unprivileged threads when `configUSE_NEWLIB_REENTRANT` is enabled with MPU support. Zephyr uses separate privilege modes: kernel tasks run in privileged thread mode, user tasks in unprivileged thread mode. When a user task calls a kernel API (e.g., `k_sem_give`), it triggers a `SVC` call that escalates to Handler mode, executes the kernel function, and returns. The Linux kernel's `CONFIG_ARM_MPU` for Cortex-M uses this exact mechanism with `svc` instructions to implement `syscall`. CMSIS-RTOS2 specifies that `osKernelInitialize` must be called in privileged mode, while thread functions execute in unprivileged mode.

Visualize the mode transitions as a state machine with three states: Thread-Privileged (TP), Thread-Unprivileged (TU), and Handler (H). TP→TU via `MSR CONTROL, #1`. TU→H via any exception (interrupt, fault, SVC). H→TP via exception return (EXC_RETURN). H→TU is not directly possible — you must return to TP first, then switch to TU.

Key points:
1. The IPSR field in xPSR is 0 in Thread mode, non-zero in Handler mode.
2. CONTROL register is only writable in privileged mode.
3. SVC is the standard mechanism for unprivileged-to-privileged transitions.
4. PendSV is used for context switching because it behaves like any other interrupt.
5. LR contains EXC_RETURN during handler execution — bit 2 indicates MSP vs PSP, bit 0 indicates return to Thread mode.


References:
1. ARMv7-M ARM (DDI0403) B1.3, FreeRTOS `port.c` for Cortex-M, Zephyr `arch/arm/core/swap.c`, CMSIS-RTOS2 `osKernelInitialize` spec, Cortex-M3 TRM (DDI0337).
