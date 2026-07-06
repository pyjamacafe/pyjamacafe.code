+++
date = '2026-07-06T10:33:00+05:30'
draft = false
title = 'IT Block and Conditional Execution'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 8
weight = 3
initial_code = '''// Use IT (If-Then) blocks for conditional execution
#include <stdio.h>
#include <stdint.h>

int32_t abs_value_it(int32_t x) {
    int32_t result;
    __asm volatile(
        "MOV %0, %1      \\n\\t"
        "CMP %0, #0      \\n\\t"
        "ITT MI            \\n\\t"
        "RSBMI %0, %0, #0 \\n\\t"
        : "=r" (result)
        : "r" (x)
        : "cc"
    );
    return result;
}

int32_t conditional_add(int32_t a, int32_t b, int32_t should_add) {
    int32_t result = a;
    __asm volatile(
        "CMP %1, #0      \\n\\t"
        "ITT EQ            \\n\\t"
        "ADDEQ %0, %0, %2 \\n\\t"
        : "+r" (result)
        : "r" (should_add), "r" (b)
        : "cc"
    );
    return result;
}

int32_t saturate_add(int32_t a, int32_t b) {
    int32_t result;
    __asm volatile(
        "QADD %0, %1, %2 \\n\\t"
        : "=r" (result)
        : "r" (a), "r" (b)
    );
    return result;
}

int main(void) {
    printf("IT Block and Conditional Execution\\n\\n");

    printf("abs_value_it(-50) = %d\\n", abs_value_it(-50));
    printf("abs_value_it(30)  = %d\\n", abs_value_it(30));

    printf("\\nconditional_add(10, 5, 1) = %d (no add)\\n",
           conditional_add(10, 5, 1));
    printf("conditional_add(10, 5, 0) = %d (added)\\n",
           conditional_add(10, 5, 0));

    printf("\\nSaturating arithmetic:\\n");
    int32_t max_val = 0x7FFFFFFF;
    printf("QADD(%d, 1) = %d (saturated to max)\\n", max_val,
           saturate_add(max_val, 1));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write conditional execution sequences using the IT (If-Then) block instruction. Implement an absolute value function using ITT MI (if minus), a conditional addition using ITT EQ, and demonstrate saturating arithmetic with QADD. Explain how the IT block limits the scope of conditional execution.

## Theory and Concepts

- IT instruction creates an If-Then block of up to 4 subsequent instructions.
- IT: single conditional instruction. ITT: two conditional instructions (same condition).
- ITE: single conditional + else. ITETE: 4 instructions with alternating conditions.
- IT blocks can nest conditions: ITTEE = if-then-else-else.
- Conditions: EQ, NE, CS/HS, CC/LO, MI, PL, VS, VC, HI, LS, GE, LT, GT, LE, AL.
- The last instruction in an IT block cannot be a branch (except BX in some cases).
- Saturation instructions (QADD, QSUB, SSAT, USAT) saturate results to avoid overflow.
- Cortex-M processors fully support Thumb-2 IT blocks (unlike ARMv6-M which has limited IT).

## Real World Application

IT blocks replace short if-else chains in performance-critical code without branching. Saturation arithmetic is used in audio processing (preventing clipping), PID controllers (preventing integral windup), and signal processing applications.

