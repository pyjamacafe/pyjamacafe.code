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

===EXPLANATION===

Thumb-2 data processing instructions represent ARM's answer to the bit-manipulation demands of modern embedded software. Before Thumb-2, extracting a bit field from a register required a shift-and-mask sequence — typically two or three instructions. UBFX (Unsigned Bit Field Extract) and BFI (Bit Field Insert) collapse these sequences into a single instruction.

The historical trajectory is one of growing hardware sophistication. Early ARM processors focused on general-purpose register operations. As embedded systems grew more complex, the need for efficient bit field manipulation became critical — device control registers pack multiple fields into single 32-bit words, and every peripheral driver must extract and modify these fields. ARM responded by adding bit field instructions in the ARMv6 architecture and expanding them in ARMv7-M Thumb-2.

The intuition behind UBFX is that reading a register field is always the same operation: shift right by the bit position, then mask with (2^width - 1). UBFX does this in one cycle. Similarly, BFI does: clear the target field in the destination register, shift the source field into position, and OR it in — all in one instruction.

In professional firmware, these instructions appear in every device driver. Consider reading the ADC conversion result from a register where the 12-bit result occupies bits [15:4]. Without UBFX: `result = (ADC_DR >> 4) & 0xFFF;` — two instructions. With UBFX: `UBFX result, ADC_DR, #4, #12` — one instruction. The savings compound across thousands of register accesses in a typical firmware image.

CLZ (Count Leading Zeros) is another workhorse instruction. It counts the number of zero bits from the MSB down to the first set bit. This is the fundamental primitive for normalization (finding the highest set bit), priority encoding (finding the highest-priority active interrupt in a bitmask), and square-root algorithms.

RBIT (Reverse Bits) reverses the entire 32-bit word. It is used in CRC calculations, FFT bit-reversed addressing, and certain cryptographic operations. Without RBIT, bit reversal requires a loop; with RBIT, it takes a single cycle.

Visualize bit field operations as surgeries on a 32-bit register. UBFX is a precise extraction — the surgeon removes bits 8–15 and places them on a tray. BFI is a transplant — bits from one register are grafted into a specific position in another. CLZ is a height measurement — how many floors (zero bits) before the first occupied floor (set bit). RBIT is a mirror — the entire register reflected left-to-right.

Key points: UBFX and SBFX extract and zero/sign-extend bit fields in one cycle; BFI inserts a bit field without affecting other bits; CLZ is essential for normalization and priority encoding; RBIT is useful for CRC and cryptographic operations; all are single-cycle on most Cortex-M implementations; SBFX sign-extends the extracted field, UBFX zero-extends.

References: ARM Architecture Reference Manual ARMv7-M (section A6.7 — Data processing), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 4.10), ARM Infocenter DDI0403E.

