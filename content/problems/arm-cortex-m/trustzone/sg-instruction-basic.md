+++
date = '2026-07-06T10:10:00+05:30'
draft = false
title = 'SG Instruction and Security Gateway Entry'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 1
initial_code = '''// Implement a secure gateway entry point using SG
#include <stdio.h>
#include <stdint.h>

__attribute__((section(".nsc_func")))
uint32_t secure_add(uint32_t a, uint32_t b) {
    __asm volatile("SG" ::: "memory");
    uint32_t result = a + b;
    return result;
}

__attribute__((section(".nsc_func")))
void secure_memcpy(uint32_t *dst, uint32_t *src, uint32_t len) {
    __asm volatile("SG" ::: "memory");
    for (uint32_t i = 0; i < len; i++) {
        dst[i] = src[i];
    }
}

int main(void) {
    uint32_t sum = secure_add(10, 20);
    printf("secure_add(10, 20) = %u\\n", sum);

    uint32_t src[] = {1, 2, 3, 4};
    uint32_t dst[4];
    secure_memcpy(dst, src, 4);

    printf("Copied array: ");
    for (int i = 0; i < 4; i++) {
        printf("%u ", dst[i]);
    }
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Implement secure gateway entry points using the SG (Secure Gateway) instruction. Create two secure functions that can be called from non-secure code: one that performs an addition and one that copies an array. Place the functions in the NSC (Non-Secure Callable) region and add the SG instruction at the entry point.

## Theory and Concepts

- SG is a 32-bit Thumb instruction that serves as the entry point for Non-Secure Callable (NSC) functions.
- An SG instruction must be the first instruction of any function callable from non-secure state.
- The processor transitions from Non-Secure to Secure state when executing an SG at an NSC address.
- NSC regions are defined in the SAU as Non-Secure Callable (attribute 0x3 on limit descriptor).
- Without the SG instruction at the entry, a branch to an NSC region causes a HardFault or SecureFault.
- The linker must place NSC functions at a separate section aligned to 32 bytes.
- Floating-point and security state are automatically stacked during the transition.

## Real World Application

TrustZone secure services (cryptographic operations, secure storage, attestation) expose entry points via NSC functions. The SG instruction ensures that non-secure code can only enter secure code at approved entry points, preventing ROP/JOP attacks across the security boundary.

