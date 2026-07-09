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

===EXPLANATION===

BFC (Bit Field Clear) and BFI (Bit Field Insert) are paired ARM instructions for modifying a contiguous range of bits within a register. BFC clears a selected field to zero; BFI copies a value from a source register into a selected field of a destination register. Together, they replace the tedious and error-prone shift-and-mask sequences that dominate embedded register manipulation code, reducing them to single-cycle operations.

These instructions were introduced with ARMv7-M (Cortex-M3) as part of a suite of bit-manipulation instructions that also includes UBFX, SBFX, and RBIT. The ARM architects recognized that embedded code spends a significant fraction of its cycles extracting and inserting bit fields from hardware control registers. Providing dedicated hardware for these operations was a natural optimization. The instructions are available on all ARMv7-M and ARMv8-M processors (Cortex-M3, M4, M7, M33, M55, M85) but not on ARMv6-M (Cortex-M0/M0+).

The intuition is that hardware control registers are typically 32-bit words packed with multiple independent fields. The prescaler of a timer might occupy bits [7:0], the counter mode bits [9:8], the auto-reload preload enable bit 10, and the enable flag bit 15. To change the prescaler without affecting other bits, the traditional C approach is: `val = (val & ~0xFF) | (new_prescaler & 0xFF)`. This requires loading val, computing the mask, ANDing, loading the new value, masking it, ORing, and storing—four plus instructions. BFI compresses this to one: `BFI val, new_prescaler, 0, 8`.

In professional device drivers, BFC and BFI appear frequently. The STM32 HAL, for instance, uses BFI in its register access macros. When you call `TIMx->PSC = prescaler`, and the compiler sees that PSC occupies bits [15:0] of a register, it may emit a BFI to insert the value into the correct field. Zephyr RTOS's SoC-level headers also leverage these instructions. The CMSIS-Core header files provide `__BFC()` and `__BFI()` intrinsics for explicit use. Understanding these instructions helps you read and trust the compiler's output, and write inline assembly that is as efficient as hand-tuned driver code.

Picture the operation: you have a destination register `dst = 0x1234FFFF`. You want to insert `src = 0xAB` into bits [15:8] of dst. BFI does: clear bits [15:8] of dst, then shift src left by 8 and copy bits [7:0] to dst's [15:8]. Result: dst = 0x1234ABFF. BFC is simpler: `BFC dst, 8, 8` clears bits [15:8]: dst = 0x123400FF. The width parameter specifies how many bits, the lsb specifies where they start. Both instructions ignore src bits beyond the width—upper bits of src are not considered.

Key points:
1. BFC clears width bits starting at lsb. BFI copies width bits from src[width-1:0] to dst[lsb+width-1:lsb].
2. Both are single-cycle on Cortex-M3/M4/M7/M33/M55.
3. The C equivalent: `dst = (dst & ~(((1<<width)-1)<<lsb)) | ((src & ((1<<width)-1)) << lsb)`—many instructions; BFI does it in one.
4. BFI with width=32 copies the entire source: `BFI dst, src, 0, 32` is equivalent to `MOV dst, src`.
5. BFC/BFI operate on registers only, not memory—you must load from memory, modify, then store back.
6. The lsb + width must not exceed 32.
7. ARMv6-M lacks these instructions; use shift-and-mask instead.


References:
1. ARM Architecture Reference Manual ARMv7-M (BFC/BFI descriptions), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 4), ARM Compiler Intrinsics Reference, and CMSIS-Core header file cmsis_armv7m.h for intrinsic implementations.
