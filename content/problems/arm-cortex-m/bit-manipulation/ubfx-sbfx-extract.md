+++
date = '2026-07-06T10:52:00+05:30'
draft = false
title = 'UBFX and SBFX Bit Field Extract'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 12
weight = 2
initial_code = '''// Extract bit fields with UBFX and SBFX
#include <stdio.h>
#include <stdint.h>

uint32_t ubfx(uint32_t value, uint32_lsb, uint32_t width) {
    uint32_t result;
    __asm volatile("UBFX %0, %1, %2, %3"
                   : "=r" (result)
                   : "r" (value), "r" (lsb), "r" (width));
    return result;
}

int32_t sbfx(int32_t value, uint32_t lsb, uint32_t width) {
    int32_t result;
    __asm volatile("SBFX %0, %1, %2, %3"
                   : "=r" (result)
                   : "r" (value), "r" (lsb), "r" (width));
    return result;
}

typedef struct {
    unsigned int field_a : 4;
    unsigned int field_b : 8;
    unsigned int field_c : 16;
    unsigned int field_d : 4;
} packed_reg_t;

int main(void) {
    printf("UBFX and SBFX Bit Field Extract\\n\\n");

    uint32_t reg = 0xA5A5A5A5;
    printf("Register value: 0x%08X\\n", reg);

    uint32_t field1 = ubfx(reg, 0, 8);
    uint32_t field2 = ubfx(reg, 8, 8);
    uint32_t field3 = ubfx(reg, 16, 8);
    uint32_t field4 = ubfx(reg, 24, 8);

    printf("UBFX extracts (8-bit fields):\\n");
    printf("  [7:0]   = 0x%02X\\n", field1);
    printf("  [15:8]  = 0x%02X\\n", field2);
    printf("  [23:16] = 0x%02X\\n", field3);
    printf("  [31:24] = 0x%02X\\n\\n", field4);

    int32_t neg = -128;
    printf("SBFX sign extension:\\n");
    printf("  Original: %d (0x%08X)\\n", neg, neg);

    int32_t ext8 = sbfx(neg, 0, 8);
    printf("  SBFX(0,8): %d (sign-extended from 8 bits)\\n", ext8);

    int32_t ext4 = sbfx(neg, 0, 4);
    printf("  SBFX(0,4): %d (sign-extended from 4 bits)\\n\\n", ext4);

    packed_reg_t packed;
    packed.field_a = 0xA;
    packed.field_b = 0xBC;
    packed.field_c = 0xDEF0;
    packed.field_d = 0x5;

    uint32_t *raw = (uint32_t *)&packed;
    printf("C bitfield access: 0x%08X\\n", *raw);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates UBFX (Unsigned Bit Field Extract) and SBFX (Signed Bit Field Extract) instructions. Extract multiple bit fields from a packed register value and display them. Show the difference between UBFX (zero-extends) and SBFX (sign-extends) when extracting signed values.

## Theory and Concepts

- UBFX: extracts width bits from position lsb, zero-extends the result to 32 bits.
- SBFX: extracts width bits from position lsb, sign-extends the result to 32 bits.
- Both are single-cycle instructions (Cortex-M3 and above).
- Traditional C code: (value >> lsb) & ((1 << width) - 1) — 2-3 instructions.
- SBFX replaces: ((int32_t)(value << (32 - width - lsb))) >> (32 - width) — 3 instructions.
- The width must be 1-32. Lsb must be 0-31. Lsb + width must be ≤ 32.
- Bit field extraction is used to decode peripheral register fields.
- ARMv6-M (Cortex-M0/M0+) does not have UBFX/SBFX — must use shift-and-mask.

## Real World Application

Device driver code constantly decodes bit fields from hardware registers: extracting the ADC conversion result, reading the timer counter value, decoding error flags from status registers. UBFX/SBFX make these operations efficient.

===EXPLANATION===

UBFX (Unsigned Bit Field Extract) and SBFX (Signed Bit Field Extract) are ARM instructions that extract a contiguous range of bits from a register and place them right-aligned in the destination, zero-extending (UBFX) or sign-extending (SBFX) the result. They are the inverse of BFI (Bit Field Insert): instead of inserting bits into a field, they pull bits out. For any code that reads hardware registers or parses packed data structures, these instructions replace multi-instruction shift-and-mask sequences with a single cycle.

The ARM instruction set has always provided bit field operations, but UBFX and SBFX were introduced with the ARMv7-M architecture (Cortex-M3) to provide dedicated extraction operations. Before these instructions, extracting a field required at least two operations: shift right to align the field to bit 0, then AND with a mask to clear the upper bits (for unsigned) or use a signed shift to preserve the sign bit. UBFX combines both operations into one, while SBFX adds sign extension without extra shift instructions.

The intuition is that hardware registers are packed with multiple fields in fixed positions. A 32-bit timer control register might have the prescaler value in bits [7:0], the counter mode in bits [9:8], and the interrupt enable flag in bit 15. Reading the prescaler with UBFX(reg, 0, 8) gives you the value directly. Reading a signed 8-bit field from bits [23:16] with SBFX(reg, 16, 8) gives you a properly sign-extended 32-bit value. Without UBFX/SBFX, each extraction requires a right-shift, a mask computation, and an AND operation—three instructions instead of one.

In professional firmware, these instructions appear frequently in device driver code. The STM32 HAL, NXP SDK, and Zephyr RTOS all rely on them—though usually through compiler-generated code rather than inline assembly. When you write `uint32_t prescaler = (TIMx->PSC >> 0) & 0xFF;`, a good compiler emits a UBFX instruction. When you write `int32_t signed_val = ((int32_t)(val << (32 - width - lsb))) >> (32 - width);`, SBFX handles it in one instruction. Understanding UBFX/SBFX helps you read compiler output and write register manipulation code that the compiler can optimize.

Picture the bit layout: a 32-bit register with 8-bit fields at positions 0, 8, 16, 24. UBFX(reg, 0, 8) → bits [7:0] become result bits [7:0], upper bits zeroed. UBFX(reg, 8, 8) → bits [15:8] shifted down to [7:0], upper bits zeroed. SBFX(reg, 16, 4) → bits [19:16] extracted and sign-extended to 32 bits: if bit 19 is 1, the result is 0xFFFFFFFx; if 0, it is 0x0000000x. This is equivalent to: `(int32_t)(value << (32 - 4 - 16)) >> (32 - 4)`—three shift operations replaced by one SBFX.

Key points: (1) UBFX extracts width bits at lsb, zero-extends; SBFX extracts and sign-extends. (2) Both are single-cycle on Cortex-M3/M4/M7/M33/M55. (3) Width must be 1–32 and lsb + width ≤ 32. (4) ARMv6-M (Cortex-M0/M0+) does not have these instructions—the compiler generates shift + AND sequences instead. (5) The compiler typically generates UBFX/SBFX automatically from C bit field operators (`&` and `>>`) and from `__builtin_arm_ubfx`/`__builtin_arm_sbfx` intrinsics. (6) For signed bit fields in C bit fields (`int field : 4`), the compiler must choose between SBFX + mask or shift + sign-extend; SBFX is optimal.

References: ARM Architecture Reference Manual ARMv7-M (instruction descriptions), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 4 on instruction set), ARM Compiler Reference Guide for intrinsics, and the ARM Cortex-M33/M55 Technical Reference Manuals.

