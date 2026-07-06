+++
date = '2026-07-06T10:00:00+05:30'
draft = false
title = 'R0-R12 General-Purpose Registers'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 1
initial_code = '''// Demonstrate reading and writing R0-R12 registers
#include <stdio.h>
#include <stdint.h>

static uint32_t saved_regs[13];

void save_registers(void) {
    __asm volatile(
        "STR R0, [%0, #0]  \\n\\t"
        "STR R1, [%0, #4]  \\n\\t"
        "STR R2, [%0, #8]  \\n\\t"
        "STR R3, [%0, #12] \\n\\t"
        "STR R4, [%0, #16] \\n\\t"
        "STR R5, [%0, #20] \\n\\t"
        "STR R6, [%0, #24] \\n\\t"
        "STR R7, [%0, #28] \\n\\t"
        "STR R8, [%0, #32] \\n\\t"
        "STR R9, [%0, #36] \\n\\t"
        "STR R10, [%0, #40] \\n\\t"
        "STR R11, [%0, #44] \\n\\t"
        "STR R12, [%0, #48] \\n\\t"
        : : "r" (saved_regs) : "memory"
    );
}

int main(void) {
    uint32_t value = 0xDEADBEEF;

    __asm volatile("MOV R0, %0" : : "r" (value));

    save_registers();

    printf("R0 = 0x%08X\\n", saved_regs[0]);
    printf("All registers saved successfully\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'R0 = 0xDEADBEEF\\nAll registers saved successfully'
+++

## Problem Statement

Write a program that reads and displays the values of general-purpose registers R0 through R12 using inline assembly. Store each register value into an array and print them. Then modify R4-R7 with known test patterns and verify the writes by reading them back.

## Theory and Concepts

- Cortex-M has 16 core registers: R0-R15.
- R0-R12 are general-purpose: R0-R7 are low registers (accessible in all Thumb instructions), R8-R12 are high registers (accessible in Thumb-2 and with MOV/MOVT).
- R0-R3 are used for function arguments and return values (AAPCS convention).
- R4-R11 are callee-saved registers preserved across function calls.
- R12 (IP) is the Intra-Procedure-call scratch register.
- Registers can be read/written using MRS/MSR or inline assembly STR/LDR.

## Real World Application

Context switching in RTOS kernels saves and restores R4-R11 (and other registers) during task switches. Debuggers display register banks for troubleshooting. Understanding register accessibility is essential for writing efficient assembly routines and interrupt handlers.

