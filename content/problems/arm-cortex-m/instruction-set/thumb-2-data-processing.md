+++
date = '2026-07-06T10:31:00+05:30'
draft = false
title = 'Thumb-2 Data Processing Instructions'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 8
weight = 1
initial_code = '''// Use Thumb-2 data processing instructions
#include <stdio.h>
#include <stdint.h>

uint32_t test_ubfx(uint32_t value, uint32_t width, uint32_t lsb) {
    uint32_t result;
    __asm volatile("UBFX %0, %1, %2, %3"
                   : "=r" (result)
                   : "r" (value), "r" (lsb), "r" (width));
    return result;
}

uint32_t test_bfi(uint32_t dst, uint32_t src, uint32_t lsb, uint32_t width) {
    uint32_t result = dst;
    __asm volatile("BFI %0, %1, %2, %3"
                   : "+r" (result)
                   : "r" (src), "r" (lsb), "r" (width));
    return result;
}

int32_t test_sbfx(int32_t value, uint32_t width, uint32_t lsb) {
    int32_t result;
    __asm volatile("SBFX %0, %1, %2, %3"
                   : "=r" (result)
                   : "r" (value), "r" (lsb), "r" (width));
    return result;
}

int main(void) {
    printf("Thumb-2 Data Processing Instructions\\n\\n");

    uint32_t val = 0x12345678;

    uint32_t extracted = test_ubfx(val, 8, 8);
    printf("UBFX(0x%08X, width=8, lsb=8) = 0x%02X\\n", val, extracted);

    uint32_t patched = test_bfi(0xFFFF0000, 0x00AB, 8, 8);
    printf("BFI(0xFFFF0000, 0x00AB, 8, 8) = 0x%08X\\n", patched);

    int32_t neg = -1000;
    int32_t sign_ext = test_sbfx(neg, 8, 0);
    printf("SBFX(%d, width=8, lsb=0) = %d\\n", neg, sign_ext);

    printf("\\nOther Thumb-2 data processing:\\n");
    printf("  CLZ   - Count Leading Zeros\\n");
    printf("  RBIT  - Reverse Bits\\n");
    printf("  REV   - Reverse byte order\\n");
    printf("  SXTB  - Sign extend byte\\n");
    printf("  UXTH  - Zero extend halfword\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates Thumb-2 data processing instructions using inline assembly. Implement functions for UBFX (unsigned bit field extract), SBFX (signed bit field extract), and BFI (bit field insert). Show how these instructions manipulate bit fields in a single cycle without shift-and-mask sequences.

## Theory and Concepts

- Thumb-2 is a dual-width instruction set (16-bit and 32-bit) introduced in ARMv7-M.
- Thumb-2 provides near RISC performance while maintaining Thumb code density.
- UBFX/SBFX: extract a bit field and zero/sign extend it. Useful for register field decoding.
- BFI: copy a bit field from source to destination at a specified position.
- BFC (Bit Field Clear): clear a bit field in a register. Complementary to BFI.
- CLZ: Count Leading Zeros. Used for normalization and priority encoding.
- RBIT: Reverse bit order in a register. Useful for CRC and bit-reversed addressing.
- These instructions execute in a single cycle on most Cortex-M processors.

## Real World Application

Bit field instructions are heavily used in device driver code to extract and modify register fields. For example, reading the priority bits from an interrupt priority register, or modifying a specific field in a control register without affecting adjacent fields.

