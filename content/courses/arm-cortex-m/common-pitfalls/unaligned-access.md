+++
date = '2026-07-06T18:28:00+05:30'
draft = true
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

    printf("Unaligned access behaviour demonstrated\n");
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

===EXPLANATION===

Unaligned memory access on ARM Cortex‑M is a portability trap. The processor family spans three behaviours: Cortex‑M0/M0+/M23 generate a HardFault on any unaligned load or store; Cortex‑M3/M4/M7/M33/M55 handle unaligned access transparently but with a performance penalty (multiple bus transactions); and even on supporting cores, specific instructions (LDM, STM, LDRD, STRD) always require alignment.

The root cause is ARM's architectural decision. The original ARM instruction set supported unaligned access for single word loads (LDR) but not for block transfers. Cortex‑M0, being a minimal Thumb‑only core, omits the unaligned support logic entirely. Cortex‑M3 added it but kept restrictions. This variation catches developers who write code on a Cortex‑M4 (works fine) and deploy on a Cortex‑M0 (faults immediately).

A common bug: an Ethernet driver receives a packet into a byte‑aligned buffer, then casts the buffer to a `struct ip_header *` that contains 32‑bit fields. On Cortex‑M0, reading `header->destination_ip` generates a HardFault because the struct pointer is not 4‑byte aligned. The fix is to either align the buffer to 4 bytes, use `memcpy` to extract fields, or use packed structs with `__attribute__((packed))` — but packed structs cause the compiler to generate byte‑wise loads (slower) and are still not safe on M0 if you dereference a packed pointer to a non‑packed type.

The CCR (Configuration and Control Register) bit `UNALIGN_TRP` is available on supporting cores to force unaligned faults — useful during development to catch portability issues before deployment on M0 hardware.

Visualise a row of mailboxes at a post office. Aligned access is like picking up a whole shelf (32‑bit bus transfer). Unaligned access on supporting cores is like taking two trips to pick up parts of a shelf. On non‑supporting cores, trying to pick up half a shelf causes the shelf to collapse (fault).

Key points:
1. Cortex‑M0/M0+/M23 always fault on unaligned access — no workaround in hardware.
2. Cortex‑M3+ handle unaligned access for LDR/STR but not LDM/STM/LDRD/STRD.
3. `memcpy` of 4 bytes compiles to a single LDR/STR on aligned pointers and byte operations on unaligned.
4. Packed structs generate byte accesses — slower but safe.
5. The linker ensures global variables are aligned to their natural alignment; heap allocations may not be.


ARM Architecture Reference Manual, "Alignment Support" section. ARM's *Cortex‑M0+ Devices Generic User Guide* documents the fault behaviour. MISRA‑C Rule 3.16 advises against casting between incompatible pointer types that may violate alignment.
