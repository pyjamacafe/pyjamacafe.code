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

===EXPLANATION===

The UsageFault is the Cortex-M's diagnostic exception for detecting programming errors. While HardFault catches unrecoverable system failures, UsageFault catches specific, avoidable mistakes — dividing by zero, executing undefined instructions, accessing unaligned addresses, or corrupting the processor state. It is the equivalent of a runtime assertion in hardware.

The historical context is revealing. Early ARM processors silently returned zero on division by zero — a design choice that prioritized performance over safety. As Cortex-M processors entered safety-critical domains (automotive, medical, industrial control), the need for trap-on-error behavior became paramount. ARM responded by adding the DIV_0_TRP bit in SCB_CCR: when set, any SDIV or UDIV instruction with a divisor of zero triggers a UsageFault instead of silently returning zero.

The intuition behind UsageFault is that certain error conditions can be precisely identified and reported. The UFSR (UsageFault Status Register) in CFSR provides a rich set of status bits: UNDEFINSTR (bit 0) for undefined opcodes, INVSTATE (bit 1) for EPSR corruption, INVPC (bit 2) for invalid exception return, NOCP (bit 3) for disabled FPU access, UNALIGNED (bit 8) for unaligned accesses when trapping is enabled, and DIVBYZERO (bit 9) for division by zero when trapping is enabled.

In professional firmware development, enabling all UsageFault traps during development is standard practice. A division by zero during testing catches bugs early. The unaligned access trap catches code that performs unaligned word accesses — which are legal but slow on Cortex-M (they take multiple bus cycles). The NOCP trap catches accidental FPU or coprocessor access when the FPU is disabled, preventing subtle state corruption.

The UNALIGNED trap (SCB_CCR bit 3) is particularly useful. Cortex-M3 and M4 support unaligned word and halfword accesses in hardware, but they execute more slowly than aligned accesses. Enabling the trap catches code that accidentally uses unaligned pointers — a common source of portability bugs between architectures that don't support unaligned access (like Cortex-M0+).

Visualize the UsageFault as a quality-control inspector on an assembly line. When the DIVBYZERO sensor detects a zero divisor, it stops the line. When UNALIGNED detects a misaligned access, it flags the offending instruction. Without these traps, the defective product (silent error) continues down the line and causes a malfunction later — much harder to diagnose.

Key points: UsageFault must be enabled via SHCSR bit 18; DIV_0_TRP and UNALIGN_TRP are in SCB_CCR; UFSR is in CFSR[23:16]; faults are precise — the stacked PC points to the offending instruction; the UsageFault handler must clear the status bits before return; without trapping, division by zero returns 0; unaligned access on Cortex-M3/M4 is legal but slow.

References: ARM Architecture Reference Manual ARMv7-M (section B1.5.10 — UsageFault), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 10.3), ARM Infocenter DDI0403E.

