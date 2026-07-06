+++
date = '2026-07-06T10:47:00+05:30'
draft = false
title = 'Callee-Saved vs Caller-Saved Registers'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 2
initial_code = '''// Demonstrate callee-saved and caller-saved register conventions
#include <stdio.h>
#include <stdint.h>

uint32_t callee_saved_demo(uint32_t a, uint32_t b) {
    uint32_t tmp1 = a * 2;
    uint32_t tmp2 = b * 3;
    uint32_t tmp3 = tmp1 + tmp2;
    uint32_t tmp4 = tmp3 / 2;

    __asm volatile(
        "PUSH {R4-R7}          \\n\\t"
        "MOV R4, %0            \\n\\t"
        "MOV R5, %1            \\n\\t"
        "ADD R6, R4, R5        \\n\\t"
        "LSL R7, R6, #2        \\n\\t"
        "MOV %0, R7            \\n\\t"
        "POP {R4-R7}           \\n\\t"
        : "+r" (a)
        : "r" (b)
        : "r4", "r5", "r6", "r7"
    );

    return a;
}

int use_scratch_registers(int x) {
    int r0 = x + 1;
    int r1 = r0 * 2;
    int r2 = r1 - 3;
    int r3 = r2 / 4;
    return r3;
}

int main(void) {
    printf("Callee-Saved vs Caller-Saved Registers\\n\\n");

    printf("Caller-saved (R0-R3, R12):\\n");
    printf("  - Saved by the CALLER before function call\\n");
    printf("  - Used for arguments and scratch values\\n");
    printf("  - Compiler saves them if values needed after call\\n\\n");

    int result = use_scratch_registers(10);
    printf("  use_scratch_registers(10) = %d\\n\\n", result);

    printf("Callee-saved (R4-R11):\\n");
    printf("  - Saved by the CALLEE if modified\\n");
    printf("  - Preserved across function calls\\n");
    printf("  - Used for local variables and temporaries\\n\n");

    uint32_t calc = callee_saved_demo(5, 7);
    printf("  callee_saved_demo(5, 7) = %u\\n\\n", calc);

    printf("Register classification:\\n");
    printf("  R0-R3:    Argument/scratch (caller-saved)\\n");
    printf("  R4-R11:   Variable (callee-saved)\\n");
    printf("  R12 (IP): Intra-call scratch (caller-saved)\\n");
    printf("  R13 (SP): Stack pointer (callee-saved)\\n");
    printf("  R14 (LR): Link register (caller-saved)\\n");
    printf("  R15 (PC): Program counter\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the difference between callee-saved (R4-R11) and caller-saved (R0-R3) registers. Implement a function that uses callee-saved registers with explicit push/pop, and another that uses scratch registers. Show that values in callee-saved registers persist across function calls.

## Theory and Concepts

- Callee-saved (R4-R11): if the callee modifies these, it must save and restore them (usually on the stack).
- Caller-saved (R0-R3, R12): the caller must save these before a call if their values are needed after.
- LR (R14): technically caller-saved. Changed by BL/BLX. Caller saves if the value is needed after nested calls.
- SP (R13): callee-saved. The callee must restore SP to its original value before returning.
- Compilers track which registers are live across calls and generate save/restore code automatically.
- In interrupt handlers, all used registers must be saved because the handler could preempt any code.
- Cortex-M hardware automatically saves R0-R3, R12, LR, PC, xPSR on exception entry.

## Real World Application

Context switching in RTOS kernels saves and restores R4-R11 (and other state) because these are the callee-saved registers that hold task-specific values across function calls.

