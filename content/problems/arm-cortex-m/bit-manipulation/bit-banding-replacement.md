+++
date = '2026-07-06T10:55:00+05:30'
draft = false
title = 'Bit-Banding Replacement Techniques'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 12
weight = 5
initial_code = '''// Implement bit-banding replacement for ARMv8-M
#include <stdio.h>
#include <stdint.h>

#define BITBAND_SRAM_REF  0x20000000
#define BITBAND_ALIAS     0x22000000
#define BITBAND_PERIPH_REF 0x40000000
#define BITBAND_PERIPH_ALIAS 0x42000000

volatile uint32_t target_bit = 0;
volatile uint32_t sram_var = 0;

void bitband_set_sram(volatile uint32_t *addr, uint32_t bit) {
    uint32_t alias = BITBAND_ALIAS +
                     ((uint32_t)addr - BITBAND_SRAM_REF) * 32 +
                     bit * 4;
    *((volatile uint32_t *)alias) = 1;
}

void bitband_clear_sram(volatile uint32_t *addr, uint32_t bit) {
    uint32_t alias = BITBAND_ALIAS +
                     ((uint32_t)addr - BITBAND_SRAM_REF) * 32 +
                     bit * 4;
    *((volatile uint32_t *)alias) = 0;
}

void rmw_set_bit(volatile uint32_t *addr, uint32_t bit) {
    *addr |= (1UL << bit);
}

void rmw_clear_bit(volatile uint32_t *addr, uint32_t bit) {
    *addr &= ~(1UL << bit);
}

void ldrex_strex_set_bit(volatile uint32_t *addr, uint32_t bit) {
    uint32_t mask = (1UL << bit);
    uint32_t old, new, success;
    __asm volatile(
        "TRY_SET:              \\n\\t"
        "LDREX %0, [%3]       \\n\\t"
        "ORR %1, %0, %4       \\n\\t"
        "STREX %2, %1, [%3]   \\n\\t"
        "CMP %2, #0           \\n\\t"
        "BNE TRY_SET           \\n\\t"
        : "=&r" (old), "=&r" (new), "=&r" (success)
        : "r" (addr), "r" (mask)
        : "memory", "cc"
    );
}

int main(void) {
    printf("Bit-Banding Replacement Techniques\\n\\n");

    printf("Bit-banding exists on: Cortex-M3, M4, M7\\n");
    printf("Bit-banding absent on: Cortex-M0, M0+, M23, M33, M55\\n\\n");

    sram_var = 0;

    rmw_set_bit(&sram_var, 3);
    printf("RMW set bit 3: 0x%08X\\n", sram_var);

    rmw_clear_bit(&sram_var, 3);
    printf("RMW clear bit 3: 0x%08X\\n", sram_var);

    ldrex_strex_set_bit(&sram_var, 5);
    printf("LDREX/STREX set bit 5: 0x%08X\\n\\n", sram_var);

    printf("Method comparison:\\n");
    printf("  1. Bit-banding:  alias accessible, atomic, no RMW loop\\n");
    printf("  2. RMW:          simple, non-atomic, needs IRQ disable\\n");
    printf("  3. LDREX/STREX:  atomic, works on all Cortex-M3+\\n");
    printf("  4. BFI/BFC:      register only, best for field modify\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates bit-banding replacement techniques for ARMv8-M processors (which lack bit-banding). Compare four approaches: (1) traditional read-modify-write with interrupt masking, (2) LDREX/STREX exclusive access, (3) BFI/BFC bit field instructions, and (4) compute the bit-band alias address for reference.

## Theory and Concepts

- Bit-banding maps each bit in a 1 MB SRAM/Peripheral region to a 32-bit word in the alias region.
- Cortex-M3 and M4 have bit-banding; ARMv8-M (M23, M33, M55) removed it.
- Without bit-banding: atomic bit manipulation requires RMW with PRIMASK or LDREX/STREX.
- RMW with PRIMASK: disable interrupts, read-modify-write, re-enable interrupts.
- RMW with BASEPRI: mask lower-priority interrupts only (preferred for RTOS).
- LDREX/STREX: truly atomic without disabling interrupts, but may fail on contention.
- BFI/BFC: work on register values only, not memory — must load first.
- The performance of LDREX/STREX is worse than bit-banding (loop may retry).

## Real World Application

Code ported from Cortex-M3/M4 to Cortex-M33/M55 must replace bit-banding accesses. This affects GPIO output writes, atomic flag setting in shared data, and peripheral register bit manipulation. LDREX/STREX is the preferred replacement for volatile shared variables.

