+++
date = '2026-07-06T18:13:00+05:30'
draft = false
title = 'TT Instruction for Memory Security Checks'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 17
weight = 1
initial_code = '''#include <stdio.h>

// TT (Test Target) instruction result structure
struct tt_result {
    unsigned int result;
};

struct tt_result test_target(const void *addr) {
    struct tt_result r;
    __asm("TT %%0, %1" : "=r" (r.result) : "r" (addr));
    return r;
}

int main(void) {
    const void *test_addrs[] = {
        (void *)0x00000000,  // Flash / Secure code
        (void *)0x20000000,  // SRAM
        (void *)0x40000000,  // Peripheral
        (void *)0xE0000000,  // System
    };

    for (int i = 0; i < 4; i++) {
        struct tt_result r = test_target(test_addrs[i]);
        printf("Address 0x%08X: result=0x%08X\n",
               (unsigned int)test_addrs[i], r.result);

        // Bit 0: secure
        // Bit 1: non-secure callable
        // Bits 8-9: memory type (01=Device, 10=Normal)
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'TT instruction results printed'
+++

## Problem Statement

Use the TT (Test Target) instruction to query the security attributes and memory type of various addresses. The TT instruction returns the security state (Secure/Non-Secure), whether the address is Non-Secure Callable, and the memory type (Normal/Device/Strongly-Ordered) for any given address.

## Theory and Concepts

- The TT instruction is new in ARMv8-M and provides a way to query the security and memory attributes of an address.
- The result encodes: Secure (bit 0), Non-Secure Callable (bit 1), memory type indicator (bits 8–9), and other attributes.
- TT is useful for validating pointers passed from non-secure code before dereferencing them.
- TT also provides the region index in the SAU/IDAU that governs the address.
- The instruction is only available when TrustZone is implemented.

## Real World Application

TT is used in the secure side of TrustZone-based firmware to validate addresses passed from non-secure callers — for example, checking that a non-secure caller passes a valid non-secure buffer before copying data into it. This prevents security vulnerabilities from incorrect pointer usage.

===EXPLANATION===

The TT (Test Target) instruction is one of the most elegant additions in ARMv8‑M. It answers a single question at hardware speed: "What are the security and memory attributes of this address?" A secure function can call TT on a pointer before dereferencing it — if the pointer claims to be non‑secure but TT reveals it points to secure memory, the function rejects it. This prevents confused‑deputy attacks where a non‑secure caller tricks secure firmware into reading or writing secure memory.

The instruction returns a 32‑bit result encoding: secure (bit 0), NSC (bit 1), SAU/IDAU region index (bits 4‑7), memory type (bits 8‑9, encoding Normal/Device/Strongly‑Ordered), shareability (bits 10‑11), and whether the read‑only attribute is set. TT also has variants: TTA (Test Target with Attribution) includes the current security state in the lookup, and TTT (Test Target with Tag) queries the tag associated with the address.

Consider a secure service that decrypts data into a buffer provided by a non‑secure caller. Without TT, the secure code must trust the caller's pointer — a malicious caller might pass a pointer to secure SRAM containing cryptographic keys. With TT, the secure code checks: if TT returns secure for the target address, the service returns an error instead of decrypting into secure memory.

Visualise a passport checkpoint. Each address crossing from non‑secure to secure territory must show its "passport" — TT reads the passport, verifies the traveller's identity (security attribute) and destination (memory type). A traveller claiming to be non‑secure but carrying a secure passport is turned away.

Key points:
1. TT is only available in ARMv8‑M with TrustZone.
2. TT is a single‑cycle instruction — negligible overhead for security checks.
3. Always validate pointers from non‑secure callers before dereferencing.
4. TT returns the combined IDAU+SAU attribution, not just SAU.
5. The result also indicates whether the address is executable (bit 18).


ARM's *ARMv8‑M Architecture Reference Manual*, "Test Target Instruction" section, provides the full result encoding. Arm's *TrustZone for Cortex‑M* application notes include examples of TT‑based pointer validation in secure partition managers.
