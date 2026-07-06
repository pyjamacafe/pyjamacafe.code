+++
date = '2026-07-06T18:28:00+05:30'
draft = false
title = 'Unaligned Access and Faults'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    // Create a misaligned pointer
    char buffer[8] __attribute__((aligned(4))) = {0};
    int *misaligned = (int *)(buffer + 1);  // Address is not 4-byte aligned

    // Reading via misaligned pointer — may fault on Cortex-M
    // volatile int value = *misaligned;  // Uncomment to test

    // Safe approach: use memcpy
    int safe_value;
    // __builtin_memcpy(&safe_value, misaligned, sizeof(int));

    // Cortex-M0/M23 do not support unaligned access (HardFault)
    // Cortex-M3/M33/M55 support unaligned access but with a performance penalty

    printf("Unaligned access behaviour demonstrated\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Unaligned access demonstrated'
+++

## Problem Statement

Demonstrate unaligned memory access and explain when it causes a HardFault on ARM Cortex-M processors. Write code that creates a misaligned pointer and attempts to read through it. Explain the difference between Cortex-M0/M23 (no unaligned support — fault) and Cortex-M3+/M33 (supported but slower).

## Theory and Concepts

- ARM Cortex-M0/M0+/M23 do not support unaligned access — any unaligned load/store instruction causes a HardFault.
- Cortex-M3/M4/M7/M33/M55 support unaligned access for single-word loads/stores, but with a performance penalty (multiple bus transactions).
- LDM, STM, LDRD, STRD instructions require natural alignment (fault if misaligned).
- The CCR (Configuration and Control Register) bit UNALIGN_TRP can force unaligned access to fault on cores that support it.
- Packed structs (with `__attribute__((packed))`) may lead to unaligned accesses if the structure contains types with stricter alignment requirements.
- Use `memcpy` for safe unaligned access — compilers optimise it into efficient aligned instructions when possible.

## Real World Application

Unaligned access bugs are common when casting byte buffers from network packets, file systems, or protocol serialisers to struct pointers. Proper alignment handling is essential for portable embedded code that runs across different Cortex-M family members.
