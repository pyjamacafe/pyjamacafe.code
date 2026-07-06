+++
date = '2026-07-06T10:46:00+05:30'
draft = false
title = 'AAPCS: R0-R3 Parameter Passing'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 1
initial_code = '''// Demonstrate AAPCS parameter passing in R0-R3
#include <stdio.h>
#include <stdint.h>

uint32_t add_four(uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    return a + b + c + d;
}

void capture_args(uint32_t r0, uint32_t r1, uint32_t r2, uint32_t r3) {
    printf("Function arguments received in:\\n");
    printf("  R0 = 0x%08X\\n", r0);
    printf("  R1 = 0x%08X\\n", r1);
    printf("  R2 = 0x%08X\\n", r2);
    printf("  R3 = 0x%08X\\n", r3);
}

uint64_t return_64bit(uint32_t lo, uint32_t hi) {
    return ((uint64_t)hi << 32) | lo;
}

int main(void) {
    printf("AAPCS Parameter Passing (R0-R3)\\n\\n");

    printf("Test 1: Four 32-bit parameters\\n");
    uint32_t sum = add_four(0x11, 0x22, 0x44, 0x88);
    printf("  Result in R0: 0x%08X\\n\\n", sum);

    printf("Test 2: Capture argument registers\\n");
    capture_args(0xDEAD, 0xBEEF, 0xCAFE, 0xBAAB);

    printf("\\nTest 3: 64-bit return (R0:R1 pair)\\n");
    uint64_t val = return_64bit(0x12345678, 0x9ABCDEF0);
    printf("  64-bit result: 0x%016llX\\n", (unsigned long long)val);
    printf("  R0 (low):  0x%08X\\n", (uint32_t)val);
    printf("  R1 (high): 0x%08X\\n", (uint32_t)(val >> 32));

    printf("\\nAAPCS rules:\\n");
    printf("  R0-R3: argument registers (caller-saved)\\n");
    printf("  R0:    return value (32-bit) or low half (64-bit)\\n");
    printf("  R1:    return high half (64-bit)\\n");
    printf("  >4 args: passed on stack\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the AAPCS (ARM Architecture Procedure Call Standard) calling convention for passing parameters in R0-R3. Create functions with different numbers and types of parameters. Show how the compiler places the first four 32-bit arguments in R0-R3 and how 64-bit return values use R0:R1.

## Theory and Concepts

- AAPCS defines how function arguments are passed: first 4 words in R0-R3, remaining on the stack.
- R0 also holds the return value (32-bit or 32-bit low half of 64-bit value).
- R1 holds the upper 32 bits of a 64-bit return value.
- 64-bit arguments (double, long long) occupy two consecutive registers.
- If a 64-bit argument starts at R2, it occupies R2:R3, and R0 is unused for that argument.
- Structures are passed by value in registers if they fit; otherwise by pointer.
- For variadic functions, arguments that would normally go in R0-R3 are also pushed on the stack.
- The callee does not need to save R0-R3 (caller-saved). Caller saves them if needed.

## Real World Application

Understanding AAPCS is essential for writing assembly functions that interface with C code, implementing interrupt handlers that must preserve registers, and debugging function call issues by examining the register state.

