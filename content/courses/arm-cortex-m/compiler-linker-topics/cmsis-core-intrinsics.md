+++
date = '2026-07-06T18:25:00+05:30'
draft = true
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
    printf("RBIT(0xF0F0F0F0) = 0x%08X\n", reversed);

    // Count leading zeros
    unsigned int leading = __CLZ(0x00FFFFFF);
    printf("CLZ(0x00FFFFFF) = %u\n", leading);

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

===EXPLANATION===

Before CMSIS (Cortex Microcontroller Software Interface Standard), each toolchain and silicon vendor had its own way of accessing special CPU features. ARM's inline assembler syntax differed from GCC's; one vendor used `__disable_interrupt()` while another used `INTC_disable()`. CMSIS‑Core solved this by defining a standardised set of intrinsic functions that map directly to single Thumb‑2 instructions and compile identically across all supported toolchains.

The intrinsics fall into several groups: interrupt control (`__disable_irq`, `__enable_irq`, `__get_PRIMASK`, `__set_PRIMASK`, `__get_BASEPRI`, `__set_BASEPRI`, `__get_FAULTMASK`), barrier instructions (`__DMB`, `__DSB`, `__ISB`), sleep modes (`__WFI`, `__WFE`, `__SEV`), bit manipulation (`__RBIT`, `__REV`, `__REV16`, `__REVSH`, `__CLZ`), and system register access (`__get_MSP`, `__set_MSP`, `__get_PSP`, `__set_PSP`, `__get_CONTROL`, `__set_CONTROL`).

A professional firmware team uses intrinsics exclusively — inline assembly is rarely needed. For example, entering a critical section calls `__set_PRIMASK(1)` and `__DMB()`. The toolchain's optimizer may even inline these to single‑cycle MRS/MSR instructions. Porting between Cortex‑M0 (no unaligned access) and Cortex‑M33 (unaligned access supported) requires no code changes when using intrinsics.

The underlying implementation is elegant: each intrinsic is a tiny static inline function in the CMSIS header that wraps the assembly instruction. `__DSB()` expands to `__ASM volatile ("dsb")`. Because the compiler sees a function call, it respects ordering and does not re‑move the barrier.

Visualise CMSIS intrinsics as a universal remote control. Instead of learning each TV's original remote (toolchain‑specific assembly), you press the "Volume Up" button (`__DSB()`) and the universal remote sends the correct infrared code for your specific TV brand.

Key points:
1. CMSIS intrinsics are portable across all Cortex‑M variants and major toolchains (ARMCC, GCC, IAR, LLVM).
2. Intrinsics avoid inline assembly pitfalls: register clobber lists, asm volatile semantics, and compiler‑specific syntax.
3. The CMSIS‑Core header for the specific processor (e.g., `core_cm33.h`) includes all intrinsics.
4. Some intrinsics have memory barrier semantics that prevent compiler reordering.
5. CMSIS‑Core also provides `__STATIC_INLINE` and `__FORCEINLINE` for optimisation control.


The CMSIS‑Core documentation (part of ARM.CMSIS.5 pack) lists every intrinsic with its instruction mapping. ARM's *Cortex‑M0+ Devices Generic User Guide* and *Cortex‑M33 Devices Generic User Guide* document the underlying instructions.
