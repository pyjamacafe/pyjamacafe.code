+++
date = '2026-07-06T10:51:00+05:30'
draft = false
title = 'Bit Field Clear and Insert Operations'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 12
weight = 1
initial_code = '''// Use BFC and BFI for bit field manipulation
#include <stdio.h>
#include <stdint.h>

uint32_t bit_field_clear(uint32_t value, uint32_t lsb, uint32_t width) {
    uint32_t result = value;
    __asm volatile("BFC %0, %1, %2"
                   : "+r" (result)
                   : "r" (lsb), "r" (width));
    return result;
}

uint32_t bit_field_insert(uint32_t dst, uint32_t src,
                          uint32_t lsb, uint32_t width) {
    __asm volatile("BFI %0, %1, %2, %3"
                   : "+r" (dst)
                   : "r" (src), "r" (lsb), "r" (width));
    return dst;
}

void print_binary(uint32_t val, int bits) {
    for (int i = bits - 1; i >= 0; i--) {
        putchar((val >> i) & 1 ? '1' : '0');
        if (i > 0 && i % 8 == 0) putchar('_');
    }
}

int main(void) {
    printf("Bit Field Clear and Insert (BFC/BFI)\\n\\n");

    uint32_t val = 0x12345678;
    printf("Original:  0x%08X  ", val);
    print_binary(val, 32);
    printf("\\n");

    uint32_t cleared = bit_field_clear(val, 8, 8);
    printf("BFC(8,8):  0x%08X  ", cleared);
    print_binary(cleared, 32);
    printf("  (bits 15:8 cleared)\\n\\n");

    uint32_t src = 0x000000AB;
    uint32_t inserted = bit_field_insert(0xFFFF0000, src, 0, 8);
    printf("BFI(0xFFFF0000, 0xAB, 0, 8):\\n");
    printf("  Result:   0x%08X  ", inserted);
    print_binary(inserted, 32);
    printf("\\n");

    inserted = bit_field_insert(0x0000FFFF, src, 8, 8);
    printf("BFI(0x0000FFFF, 0xAB, 8, 8):\\n");
    printf("  Result:   0x%08X  ", inserted);
    print_binary(inserted, 32);
    printf("\\n\\n");

    printf("Advantages over shift+mask:\\n");
    printf("  - Single instruction (no bits to mask creation)\\n");
    printf("  - No temporary register needed\\n");
    printf("  - Executes in 1 cycle on Cortex-M3+\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the BFC (Bit Field Clear) and BFI (Bit Field Insert) instructions. Show how BFC clears a range of bits in a register with a single instruction, and how BFI copies a bit field from one register into another at a specified position. Compare with the traditional shift-and-mask approach.

## Theory and Concepts

- BFC: clears width bits starting at lsb in a register. Example: BFC R0, #8, #4 clears bits [11:8].
- BFI: copies width bits from the least significant bits of src to position lsb in dst.
- Both instructions are single-cycle on Cortex-M3/M4/M7/M33/M55.
- Without BFI: (dst & ~(((1<<width)-1)<<lsb)) | ((src & ((1<<width)-1)) << lsb) — 4+ instructions.
- The width must be 1-32, and lsb + width must not exceed 32.
- For width = 32, BFC clears the entire register, BFI copies src entirely.
- BFC/BFI are available in ARMv7-M and ARMv8-M (not in ARMv6-M).
- These instructions operate on registers only, not memory.

## Real World Application

Bit field operations are ubiquitous in embedded programming for configuring peripheral registers. BFC/BFI are used in device drivers to modify specific fields in control registers without affecting adjacent fields, such as setting a specific bit field in an ADC or timer control register.

