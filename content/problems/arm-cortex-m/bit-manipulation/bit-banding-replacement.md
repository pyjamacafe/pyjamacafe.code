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

===EXPLANATION===

Bit-banding was a hardware feature on Cortex-M3 and M4 processors that mapped every individual bit in a 1 MB region of SRAM (0x20000000–0x200FFFFF) and peripheral memory (0x40000000–0x400FFFFF) to a unique 32-bit word in a dedicated alias region. Writing to the alias word set or cleared only that one bit atomically, without a read-modify-write sequence. It was elegant, fast, and safe—but it disappeared in ARMv8-M (Cortex-M23, M33, M55), forcing developers to adopt replacement techniques.

The history of bit-banding reflects ARM's evolving priorities. It was introduced with ARMv7-M (Cortex-M3, 2004) as a hardware optimization for bit-level operations. The idea was that writing to bit-addressed memory simplifies code that controls GPIO pins, sets flags, or manages semaphore bits. The alias region started at 0x22000000 for SRAM and 0x42000000 for peripherals. Computing the alias address was straightforward: `alias = alias_base + (addr - ref_base) * 32 + bit * 4`. ARMv8-M removed bit-banding for several reasons: the address map became crowded, the feature added silicon area, and modern compilers could generate reasonable code with BFI/BFC and LDREX/STREX.

The intuition behind reimplementing bit-banding without hardware support is about choosing the right alternative for each context. If you are setting a bit in a memory-mapped peripheral register that is only touched by one context (e.g., a GPIO output register in single-threaded code), a simple read-modify-write with interrupts disabled is fine. If you are modifying a shared flag that an ISR or another CPU core accesses, you need atomic operation—LDREX/STREX provides that without disabling interrupts. If you are manipulating a bit field in a register value (not memory), BFI (Bit Field Insert) and BFC (Bit Field Clear) are the most efficient.

In practice, porting code from Cortex-M3/M4 to ARMv8-M requires systematic replacement of bit-banding accesses. The STM32L5 and STM32U5 series (Cortex-M33) both lack bit-banding. When vendors release SDK updates, they replace `#define BITBAND(addr, bit)` macros with atomic access patterns. The LDREX/STREX pattern is preferred for volatile inter-task variables because it is lock-free and interrupt-safe. For non-volatile register accesses, the compiler's generated code using BFI/BFC is often more efficient than the manually coded bit-banding alias formula, since bit-banding requires subtracting base addresses and multiplying by 32.

Visualize the comparison: bit-banding sets bit 3 of a variable at 0x20001000 by writing 1 to 0x22000000 + (0x20001000 - 0x20000000)*32 + 3*4 = 0x22000600C. Atomic, single cycle, no interrupt masking. The ARMv8-M replacement using LDREX/STREX: load the word from 0x20001000, OR with (1 << 3), conditionally store back, retry if the store fails. This is atomic but requires a loop and takes 3–10 cycles. The RMW with interrupt masking: disable interrupts, load, OR, store, enable interrupts. Simple and fast but blocks interrupts for a few cycles. The BFI replacement (for registers): load into a register, BFI to insert the bit, store back.

Key points: (1) Bit-banding was removed in ARMv8-M (M23, M33, M55, M85). All code using it must be ported. (2) LDREX/STREX is truly atomic without interrupt disabling—use for shared variables between main code and ISRs. (3) Read-modify-write with PRIMASK disable is simpler and faster for single-threaded code—just ensure no ISR touches the same location. (4) BFI/BFC are register-to-register instructions; they do not operate on memory directly. Load first, then modify, then store. (5) For peripheral registers where each bit is controlled by writing the whole register (like GPIO BSRR on STM32), atomicity is already provided by hardware double-buffering.

References: ARMv7-M Architecture Reference Manual (bit-banding section), ARMv8-M Architecture Reference Manual (removal note), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 8), "Definitive Guide to ARM Cortex-M33 and Cortex-M55" (Joseph Yiu), and STM32L5/U5 migration application notes.

