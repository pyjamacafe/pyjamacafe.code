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
    printf("\n");
}

int main(void) {
    printf("Count Leading Zeros with CLZ\n\n");

    print_clz_info(0x00000000);
    print_clz_info(0x00000001);
    print_clz_info(0x80000000);
    print_clz_info(0x00FF0000);
    print_clz_info(0x12345678);
    print_clz_info(0xFFFFFFF0);

    printf("\nApplications:\n");
    printf("  - Bit width of integers (32 - CLZ)\n");
    printf("  - Round up to next power of 2\n");
    printf("  - Find highest set bit (log2)\n");
    printf("  - Normalize values for division\n");
    printf("  - Priority encoder emulation\n");

    uint32_t test = 0x00001234;
    printf("\nExample: normalize 0x%04X for division\n", test);
    uint32_t shift = clz(test);
    printf("  CLZ=%u, shift left by %u -> 0x%08X\n",
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

===EXPLANATION===

CLZ (Count Leading Zeros) is an ARM instruction that returns the number of zero bits before the first one bit in a 32-bit register. It is the arithmetic foundation for bit width calculation, logarithm estimation, round-up to power of two, and normalization. While it seems like a niche bit-counting operation, CLZ is used constantly in operating systems, DSP libraries, and safety-critical firmware for operations ranging from priority encoding to division acceleration.

The CLZ instruction has been part of the ARM architecture since ARMv5TE, making it one of the longest-standing DSP-style instructions. It is available on every Cortex-M processor except some Cortex-M0 implementations (where the compiler must emulate it with a loop). The instruction is essential for efficient software division: by normalizing the divisor (shifting left until the leading bit is 1), the division algorithm reduces the number of iterations from 32 to the number of significant bits in the divisor.

The intuition is that CLZ answers the question: "how many bits do I need to represent this number?" If the value 0x00001234 has CLZ = 19 (bits [31:19] are zero), then the bit width is 32 - 19 = 13 bits. The ceiling of log2 is derived: `ceil(log2(N)) = 32 - CLZ(N - 1)` for N > 1. Rounding up to the next power of two uses the same idea: `next_pow2(N) = 1 << (32 - CLZ(N - 1))`. Finding the highest set bit—useful for finding which priority level in a bitmap has tasks ready—is simply `31 - CLZ(value & -value)`.

In professional RTOS kernels, CLZ is the key to O(1) priority scheduling. FreeRTOS uses a bitmap (`uxTopReadyPriority`) where each bit represents a priority level. When a task becomes ready, the scheduler needs to find the highest priority bit set. Without CLZ, this requires a loop that iterates over each bit (up to 32 iterations). With CLZ, it is one instruction: `31 - CLZ(uxTopReadyPriority)`. The Linux kernel uses a similar approach with `__builtin_clz()` for its bitmap scheduler. CMSIS-DSP uses CLZ for normalization in fixed-point arithmetic and FFT.

Imagine you have a 32-bit integer 0x00001234. Visualize the bits: 0000_0000_0000_0000_0001_0010_0011_0100. CLZ counts the 19 leading zeros (bits 31 down to 13 are zero; the first one is at bit 12). Bit width = 32 - 19 = 13. For normalization, you would left-shift by 19 to get 0x91A0_0000, with the leading bit now at position 31. For priority encoding, if the priority bitmap is 0x00001234, the highest set bit is at position 12, corresponding to priority 12.

Key points:
1. CLZ.
2. returns 32 on Cortex-M3/M4/M7/M33/M55 (ARMv7-M and ARMv8-M). In ARMv7-A, CLZ.
3. is unpredictable—but Cortex-M implementations define it as 32.
4. Applications: bit width (32 - CLZ), ceiling log2 (32 - CLZ(N - 1)), next power of two (1 << (32 - CLZ(N - 1))), find highest set bit (31 - CLZ(N)), normalization for division and floating-point.
5. Single-cycle on most Cortex-M implementations.
6. Available as `__clz()` intrinsic in ARM Compiler, `__CLZ` in IAR, `__builtin_clz()` in GCC.
7. For Cortex-M0 without CLZ, the compiler generates a loop that is functionally correct but up to 32× slower.
8. CLZ is also used in the iterative division algorithm: normalize divisor, then for each bit from MSB to LSB, subtract (shifted divisor) from remainder.


References:
1. ARM Architecture Reference Manual ARMv7-M (CLZ instruction), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 4), FreeRTOS source code (tasks.c priority scheduling), CMSIS-DSP library (arm_math.h for CLZ intrinsics), and Henry Warren's "Hacker's Delight" (Chapter 5 on counting bits).
