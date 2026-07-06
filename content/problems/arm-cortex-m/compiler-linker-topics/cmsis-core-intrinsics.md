+++
date = '2026-07-06T18:25:00+05:30'
draft = false
title = 'CMSIS-Core Intrinsic Functions'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 19
weight = 3
initial_code = '''#include <stdio.h>
#include "CMSIS/core_cm33.h"  // CMSIS-Core header for Cortex-M33

int main(void) {
    // CMSIS intrinsics for common operations
    unsigned int primask = __get_PRIMASK();
    __set_PRIMASK(1);   // Disable interrupts
    // Critical section
    __set_PRIMASK(0);   // Enable interrupts

    // Barrier instructions
    __DSB();
    __ISB();

    // Wait for interrupt
    // __WFI();

    // Reverse bits in a 32-bit word
    unsigned int reversed = __RBIT(0xF0F0F0F0);
    printf("RBIT(0xF0F0F0F0) = 0x%08X\\n", reversed);

    // Count leading zeros
    unsigned int leading = __CLZ(0x00FFFFFF);
    printf("CLZ(0x00FFFFFF) = %u\\n", leading);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'CMSIS intrinsics demonstrated'
+++

## Problem Statement

Use CMSIS-Core intrinsic functions to perform common ARM Cortex-M operations: disable/enable interrupts (PRIMASK), execution and data synchronisation barriers (DSB/ISB), bit reversal (RBIT), and count leading zeros (CLZ). These intrinsics compile to single Thumb-2 instructions.

## Theory and Concepts

- CMSIS-Core provides standardised intrinsic functions that map directly to ARM instructions — `__disable_irq()`, `__enable_irq()`, `__DSB()`, `__ISB()`, `__WFI()`, `__WFE()`, `__RBIT()`, `__CLZ()`, and `__REV()`.
- These intrinsics are portable across all Cortex-M processors and toolchains that support CMSIS.
- Using intrinsics instead of inline assembly improves code readability, portability, and compiler optimisation.
- CMSIS also provides register access structures for the NVIC, SCB, SysTick, MPU, and FPU.
- The CMSIS-Core header for each processor (core_cm0.h, core_cm33.h, etc.) is part of the CMSIS pack provided by ARM and silicon vendors.

## Real World Application

CMSIS intrinsics are the standard way to access Cortex-M system instructions from C code. They are used in RTOS kernels, device drivers, and application code — anywhere that needs to control interrupts, synchronise memory accesses, or use hardware bit-manipulation features.
