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

