+++
date = '2026-07-06T10:39:00+05:30'
draft = false
title = 'UsageFault: Division by Zero and Undefined Instructions'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 9
weight = 4
initial_code = '''// Detect and handle division by zero and undefined instructions
#include <stdio.h>
#include <stdint.h>

#define SCB_CCR     (*((volatile uint32_t *)0xE000ED14))
#define SCB_CFSR    (*((volatile uint32_t *)0xE000ED28))

#define CCR_DIV_0_TRP (1UL << 4)
#define CCR_UNALIGN_TRP (1UL << 3)

void enable_divbyzero_trap(void) {
    SCB_CCR |= CCR_DIV_0_TRP;
    printf("Division-by-zero trapping enabled\\n");
}

void enable_unalign_trap(void) {
    SCB_CCR |= CCR_UNALIGN_TRP;
    printf("Unaligned access trapping enabled\\n");
}

void UsageFault_Handler(void) {
    uint32_t ufsr = (SCB_CFSR >> 16) & 0xFFFF;

    printf("\\n=== USAGE FAULT ===\\n");

    if (ufsr & (1 << 0)) printf("Undefined instruction executed\\n");
    if (ufsr & (1 << 1)) printf("EPSR corruption / Invalid state\\n");
    if (ufsr & (1 << 2)) printf("Invalid PC load (EXC_RETURN or load)\\n");
    if (ufsr & (1 << 3)) printf("Coprocessor access (no FPU/CP)\\n");
    if (ufsr & (1 << 8)) printf("Unaligned memory access\\n");
    if (ufsr & (1 << 9)) printf("Division by zero\\n");

    SCB_CFSR = (ufsr << 16);
}

int divide_safe(int a, int b) {
    if (b == 0) {
        printf("Division by zero prevented at software level\\n");
        return 0;
    }
    return a / b;
}

int main(void) {
    printf("UsageFault: Division by Zero and Undefined Instructions\\n\\n");

    enable_divbyzero_trap();

    printf("\\nTest 1: Divide by zero with trap enabled\\n");
    int result = divide_safe(10, 0);
    printf("Result: %d\\n\\n", result);

    printf("Test 2: Divide by zero WITHOUT software check\\n");
    printf("(UsageFault handler will catch it)\\n");

    enable_unalign_trap();

    volatile uint8_t buffer[8] = {0};
    volatile uint32_t *unalign = (uint32_t *)(buffer + 1);

    printf("\\nTest 3: Unaligned access\\n");

    printf("\\nUsageFault conditions checklist:\\n");
    printf("  DIVBYZERO (bit 9): enable with SCB_CCR bit 4\\n");
    printf("  UNALIGNED (bit 8): enable with SCB_CCR bit 3\\n");
    printf("  NOCP (bit 3): FPU access when disabled\\n");
    printf("  INVSTATE (bit 1): BLX to non-Thumb address\\n");
    printf("  UNDEFINSTR (bit 0): opcode not in Thumb/Thumb-2\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that enables UsageFault trapping for division by zero and unaligned access via SCB_CCR. Implement a UsageFault handler that decodes the UFSR to identify the specific cause. Demonstrate both a software-checked division by zero and one that triggers the fault handler.

## Theory and Concepts

- DIVBYZERO (UFSR bit 9): triggered by SDIV/UDIV with divisor = 0 when SCB_CCR bit 4 (DIV_0_TRP) is set.
- UNALIGNED (UFSR bit 8): triggered by unaligned LDR/STR when SCB_CCR bit 3 (UNALIGN_TRP) is set.
- UNDEFINSTR (UFSR bit 0): undefined or invalid instruction.
- NOCP (UFSR bit 3): access to FPU or coprocessor when disabled.
- INVSTATE (UFSR bit 1): trying to execute with EPSR.T = 0 (not Thumb).
- INVPC (UFSR bit 2): invalid PC for exception return (EXC_RETURN with wrong format).
- UsageFault is enabled via SHCSR bit 18 (USGFAULTENA).
- Without the trap enabled, division by zero returns 0 silently (ARM architecture behavior).

## Real World Application

Safety-critical code often enables division-by-zero and unaligned-access trapping to catch programming errors during development. Production firmware may disable them to avoid unexpected faults in the field.

