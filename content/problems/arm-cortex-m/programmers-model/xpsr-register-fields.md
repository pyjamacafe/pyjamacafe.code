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

