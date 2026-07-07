+++
date = '2026-07-06T10:02:00+05:30'
draft = false
title = 'xPSR Register Fields'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 3
initial_code = '''// Decode the xPSR register fields
#include <stdio.h>
#include <stdint.h>

void print_xpsr_fields(uint32_t xpsr) {
    printf("xPSR = 0x%08X\\n", xpsr);
    printf("  Negative (N) [31]: %d\\n", (xpsr >> 31) & 1);
    printf("  Zero     (Z) [30]: %d\\n", (xpsr >> 30) & 1);
    printf("  Carry    (C) [29]: %d\\n", (xpsr >> 29) & 1);
    printf("  Overflow (V) [28]: %d\\n", (xpsr >> 28) & 1);

    uint32_t ici_it = (xpsr >> 10) & 0x3F;
    printf("  ICI/IT  [15:10]: 0x%02X\\n", ici_it);

    uint32_t exception_num = xpsr & 0x1FF;
    printf("  Exception [8:0]: %u\\n", exception_num);
}

int main(void) {
    uint32_t xpsr;

    __asm volatile("MRS %0, xPSR" : "=r" (xpsr));
    print_xpsr_fields(xpsr);

    int a = -5, b = 3;
    int result = a + b;

    __asm volatile("MRS %0, xPSR" : "=r" (xpsr));
    printf("\\nAfter signed operation (-5 + 3):\\n");
    print_xpsr_fields(xpsr);
    printf("result = %d\\n", result);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Read and decode the combined xPSR register (Application PSR, Interrupt PSR, and Execution PSR). Write a function that parses each field: N, Z, C, V flags, ICI/IT bits, and the exception number. Perform arithmetic operations and observe how the flags change after each operation.

## Theory and Concepts

- xPSR merges three PSRs: APSR (condition flags), IPSR (exception number), EPSR (ICI/IT state and Thumb bit).
- APSR bits: N[31], Z[30], C[29], V[28] — set by arithmetic and logic operations.
- IPSR bits [8:0] indicate the exception number (0 = thread mode, 1-15 = system exceptions, 16+ = IRQ).
- EPSR bit [24] is the Thumb (T) bit — always 1 in Cortex-M. Bits [15:10] hold ICI/IT state.
- MRS instruction reads special-purpose registers into general-purpose registers.

## Real World Application

Understanding xPSR is essential for debugging incorrect condition code evaluations, analyzing fault stack frames (which contain the saved xPSR), and implementing context switching where xPSR must be saved and restored.

===EXPLANATION===

The xPSR register dates from ARMv6-M, though its composite structure was formalised in ARMv7-M. It combines three conceptually separate program status registers into one read-accessible register: the Application PSR (APSR — condition flags N,Z,C,V and saturation Q flag), the Interrupt PSR (IPSR — current exception number), and the Execution PSR (EPSR — Thumb state T bit, ICI/IT bits for interrupted load/store multiples and IT block execution). The xPSR is the single most important register for debugging because the hardware pushes it onto the stack on every exception entry — that stacked xPSR tells you exactly which instruction was executing and what the condition flags were when the fault occurred.

The intuition: xPSR is the processor's "state snapshot" at any instant. The condition flags (APSR) tell you the result of the last arithmetic operation — useful when debugging why a comparison branched the wrong way. The exception number (IPSR) tells you which handler is currently running — 0 means thread mode, 2 means NMI, 3 means HardFault, 11 means SVC, 14 means PendSV, 15 means SysTick, 16+ means external IRQ. The EPSR tells you whether the CPU is in the middle of a multi-word load/store (LDM/STM) or inside an IT block — crucial for understanding why the PC points to an unexpected address.

In professional practice, FreeRTOS's `vPortValidateInterruptPriority` reads the IPSR to determine if it's called from an interrupt context, using `(xPSR & 0x1FF)` — if non-zero, it's handler mode. Zephyr's `arch_is_in_isr()` does the same. The Linux kernel's `in_interrupt()` for ARM Cortex-M reads `IPSR` to decide whether to preempt. CMSIS-Core provides `__get_xPSR()`, `__get_APSR()`, `__get_IPSR()`, and `__get_PSP()` for portable access. Debug tools like J-Link's `regs` command dump xPSR and decode flags automatically.

Visualise xPSR as a 32-bit value: bits [31:28] = NZCV flags (set by arithmetic), bit [27] = Q (saturation, DSP), bits [26:25] = GE (SIMD, v7-M only), bits [24] = T (always 1), bits [15:10] = ICI/IT state, bits [8:0] = exception number. On fault, the hardware pushes this entire 32-bit word alongside PC, LR, R12, R0-R3 — the fault handler can decode this word to understand the CPU's exact state.

Key points: (1) NZCV flags are set implicitly by most arithmetic; test them explicitly after operations. (2) The exception number in IPSR is the only reliable way to determine if you're in handler mode. (3) T bit (bit 24) must be 1 — if it's 0, a HardFault occurs immediately. (4) ICI/IT bits are restored from stacked xPSR for correct LDM/STM continuation. (5) Writes to xPSR via MSR only affect APSR — IPSR and EPSR are read-only.

References: ARMv7-M ARM (DDI0403) B1.4, CMSIS-Core `core_cm.h` xPSR macros, FreeRTOS `portmacro.h` IPSR check, Zephyr `include/arch/arm/cortex_m/irq.h`.

