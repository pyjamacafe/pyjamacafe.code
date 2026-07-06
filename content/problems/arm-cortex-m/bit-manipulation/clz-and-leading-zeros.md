+++
date = '2026-07-06T10:53:00+05:30'
draft = false
title = 'CLZ and Leading Zero Count'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 12
weight = 3
initial_code = '''// Count leading zeros using CLZ instruction
#include <stdio.h>
#include <stdint.h>

uint32_t clz(uint32_t value) {
    uint32_t result;
    __asm volatile("CLZ %0, %1" : "=r" (result) : "r" (value));
    return result;
}

uint32_t bit_width(uint32_t value) {
    if (value == 0) return 0;
    return 32 - clz(value);
}

uint32_t ceil_log2(uint32_t value) {
    if (value <= 1) return 0;
    uint32_t w = bit_width(value - 1);
    return w;
}

uint32_t round_up_pow2(uint32_t value) {
    if (value == 0) return 0;
    uint32_t w = bit_width(value - 1);
    return 1 << w;
}

int find_first_set(uint32_t value) {
    if (value == 0) return -1;
    return 31 - clz(value & -value);
}

void print_clz_info(uint32_t val) {
    printf("CLZ(0x%08X) = %u", val, clz(val));
    printf(", bit_width=%u, ceil_log2=%u, next_pow2=%u",
           bit_width(val), ceil_log2(val), round_up_pow2(val));

    int ffs = find_first_set(val);
    if (ffs >= 0) printf(", highest_bit=%d", ffs);
    printf("\\n");
}

int main(void) {
    printf("Count Leading Zeros with CLZ\\n\\n");

    print_clz_info(0x00000000);
    print_clz_info(0x00000001);
    print_clz_info(0x80000000);
    print_clz_info(0x00FF0000);
    print_clz_info(0x12345678);
    print_clz_info(0xFFFFFFF0);

    printf("\\nApplications:\\n");
    printf("  - Bit width of integers (32 - CLZ)\\n");
    printf("  - Round up to next power of 2\\n");
    printf("  - Find highest set bit (log2)\\n");
    printf("  - Normalize values for division\\n");
    printf("  - Priority encoder emulation\\n");

    uint32_t test = 0x00001234;
    printf("\\nExample: normalize 0x%04X for division\\n", test);
    uint32_t shift = clz(test);
    printf("  CLZ=%u, shift left by %u -> 0x%08X\\n",
           shift, shift, test << shift);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that uses the CLZ (Count Leading Zeros) instruction to implement utility functions: bit width calculation, ceiling log2, round up to next power of 2, and find highest set bit. Show how CLZ can normalize a value for fractional division and fixed-point arithmetic.

## Theory and Concepts

- CLZ counts the number of leading zero bits in a 32-bit register.
- CLZ(0) is 32 (Cortex-M3/M4) or 0 (ARMv7-R); Cortex-M returns 32 for input 0.
- Applications: normalization, logarithm estimation, priority encoding, bitmap scanning.
- Bit width = 32 - CLZ(value). Ceiling log2 = 32 - CLZ(value - 1) for value > 1.
- Next power of 2: 1 << (32 - CLZ(value - 1)).
- CLZ is a single-cycle instruction on most Cortex-M processors.
- Without CLZ: a loop would take up to 32 iterations.
- Normalization shifts a value left so the MSB becomes 1, used in division and floating-point.

## Real World Application

CLZ is used in division algorithms (restoring/non-restoring), floating-point normalization, and real-time audio processing for gain control. RTOS kernels use it for bitmap scheduling to find the highest priority ready task.

