+++
date = '2026-07-06T10:34:00+05:30'
draft = false
title = 'Exclusive Access: LDREX and STREX'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 8
weight = 4
initial_code = '''// Implement atomic operations using LDREX/STREX
#include <stdio.h>
#include <stdint.h>

uint32_t atomic_exchange(volatile uint32_t *ptr, uint32_t new_value) {
    uint32_t old_value;
    uint32_t success;

    __asm volatile(
        "LDREX %0, [%3]     \\n\\t"
        "STREX %1, %2, [%3] \\n\\t"
        : "=r" (old_value), "=r" (success)
        : "r" (new_value), "r" (ptr)
        : "memory"
    );

    if (success) {
        printf("STREX succeeded\\n");
    } else {
        printf("STREX failed (concurrent access detected)\\n");
    }

    return old_value;
}

uint32_t atomic_add(volatile uint32_t *ptr, uint32_t delta) {
    uint32_t old_value, new_value, success;

    __asm volatile(
        "TRY_ADD:              \\n\\t"
        "LDREX %0, [%3]       \\n\\t"
        "ADD %1, %0, %4       \\n\\t"
        "STREX %2, %1, [%3]   \\n\\t"
        "CMP %2, #0           \\n\\t"
        "BNE TRY_ADD           \\n\\t"
        : "=&r" (old_value), "=&r" (new_value), "=&r" (success)
        : "r" (ptr), "r" (delta)
        : "memory", "cc"
    );

    return old_value;
}

int main(void) {
    volatile uint32_t shared = 0x12345678;

    printf("Exclusive Access: LDREX/STREX\\n\\n");

    uint32_t old = atomic_exchange(&shared, 0xAABBCCDD);
    printf("atomic_exchange: old=0x%08X, new=0x%08X\\n\\n", old, shared);

    shared = 100;
    printf("Before atomic_add: %u\\n", shared);
    old = atomic_add(&shared, 50);
    printf("After atomic_add: %u (old=%u)\\n\\n", shared, old);

    printf("Key points:\\n");
    printf("  - LDREX marks address for exclusive access\\n");
    printf("  - STREX succeeds only if no other write occurred\\n");
    printf("  - Write collision causes STREX to return 1 (fail)\\n");
    printf("  - Loop retries until STREX succeeds\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Implement atomic read-modify-write operations using the LDREX/STREX exclusive access instructions. Write an atomic exchange (swap) and an atomic add function. The LDREX loads a value and marks the address for exclusive monitoring, and STREX conditionally stores based on whether the address was modified by another agent.

## Theory and Concepts

- LDREX loads a word from memory and sets an exclusive monitor for that address.
- STREX attempts to store to the address. Returns 0 on success, 1 on failure.
- Failure occurs if: another LDREX to the same address was executed, or another agent wrote to the address.
- Exclusive monitors are local (per-processor) for non-shared memory, global for shared memory.
- The loop pattern (LDREX, modify, STREX, check, branch) is the standard atomic operation template.
- LDREXB/LDREXH/STREXB/STREXH: byte and halfword variants.
- CLREX: clears the exclusive monitor without storing.
- Exclusive access requires the memory region to be sharable or device memory type.

## Real World Application

RTOS kernels use LDREX/STREX for atomic operations on semaphores, mutexes, and reference counts. These instructions provide the foundation for lock-free data structures and inter-processor communication in multi-core systems.

===EXPLANATION===

The LDREX/STREX exclusive access instructions are the foundation of atomic operations in the Cortex-M architecture. They solve a problem that is deceptively simple: how can a processor read a memory location, modify it, and write it back — without any other agent (interrupt handler, DMA controller, or another core) modifying the memory in between?

The historical context: before LDREX/STREX, ARM processors used SWP (Swap) instruction for atomic exchange. SWP was simple but fundamentally flawed — it locked the entire memory bus during execution, creating a system-wide bottleneck. The ARMv6 architecture introduced the Load-Exclusive/Store-Exclusive paradigm, which replaced bus locking with a monitor-based approach. The Cortex-M adopted this from ARMv7-M onward.

The intuition behind exclusive access is a reservation protocol. LDREX does two things: it loads the value from memory, and it sets a hardware monitor (a reservation) tracking that address. STREX then attempts to store. The store succeeds (returns 0) only if the monitor still holds a valid reservation for that address. If any other write to that address occurred between LDREX and STREX — whether from another core, a DMA controller, or an interrupt handler — the reservation is invalidated, and STREX fails (returns 1).

This compare-and-check loop is the standard pattern: LDREX old_value; compute new_value; STREX; check success; if failed, retry from LDREX. This loop is guaranteed to make progress as long as the memory system is fair, because the STREX will eventually succeed when no concurrent writes interfere.

The exclusive monitor is local for the Non-Shareable memory region — only the current processor tracks reservations. For Shareable memory (used in multi-core systems), the monitor is global — the cache coherence protocol tracks reservations across all cores. This distinction matters: on a single-core system, uniprocessor operations only need local monitors.

In professional RTOS kernels, every semaphore operation, mutex lock, and reference count increment uses LDREX/STREX internally. The `atomic_add` pattern — LDREX, ADD, STREX, check, loop — provides lock-free atomic arithmetic. The `atomic_compare_and_swap` pattern — LDREX, CMP, STREX, check, loop — provides the foundation for mutex implementations.

Visualize LDREX/STREX as a reservation system at a restaurant. LDREX puts your name on the waitlist (reservation). STREX claims the table: if someone else took your table (reservation invalid), you must re-add your name. The monitor is the host with the clipboard — in a single-core system (local monitor), only one host exists; in a multi-core system (global monitor), all hosts coordinate.

Key points: LDREX loads and sets the monitor; STREX returns 0 on success, 1 on failure; success requires no intervening write to the address; the loop pattern guarantees eventual progress; CLREX clears the monitor without storing; LDREXB/STREXB and LDREXH/STREXH provide byte and halfword variants; memory must be Shareable or Device type for global monitors to work.

References: ARM Architecture Reference Manual ARMv7-M (section A6.5.3 — LDREX/STREX), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 9.4), ARM Infocenter DDI0403E.

