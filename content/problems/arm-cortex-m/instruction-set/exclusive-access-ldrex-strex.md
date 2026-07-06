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

