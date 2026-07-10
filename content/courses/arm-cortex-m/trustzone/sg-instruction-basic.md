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
    printf("secure_add(10, 20) = %u\n", sum);

    uint32_t src[] = {1, 2, 3, 4};
    uint32_t dst[4];
    secure_memcpy(dst, src, 4);

    printf("Copied array: ");
    for (int i = 0; i < 4; i++) {
        printf("%u ", dst[i]);
    }
    printf("\n");

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

===EXPLANATION===

The SG (Secure Gateway) instruction is a 32-bit Thumb encoding (`0xE97FE97F`) introduced in ARMv8-M. It is the only instruction that can transition the processor from Non-Secure state to Secure state. When executed from an address within an NSC (Non-Secure Callable) region, the processor: (1) clears the NS bit in the security state, (2) restores the securable registers that were saved on the secure-to-non-secure transition, and (3) continues execution in Secure state at the instruction following SG. If SG is executed outside an NSC region, a SecureFault or HardFault is raised — this prevents non-secure code from jumping into secure memory at arbitrary locations.

The intuition: SG is the "secret handshake." Imagine a speakeasy with a hidden door. The door is in a public alley (NSC region), but the handshake (SG instruction) is required to enter. Anyone who knows the handshake can enter the secure area. If someone tries to open the door without the handshake, the bouncer (HardFault) throws them out. The speakeasy's interior (secure code) is completely hidden from the alley — the handshake is the only way in. And the handshake must be the very first gesture — entering the alley and doing anything else before the handshake also gets you thrown out.

In professional TrustZone firmware, SG instructions are placed at the very beginning of every secure function that should be callable from non-secure code. Zephyr's `arm_trustzone_configure.c` marks functions with `__attribute__((naked))` and places SG as the first instruction, followed by a branch to the actual function body. FreeRTOS uses SG in `SecureContext_Load` and `SecureContext_Init`. The mbed OS TZ bootloader's entry points (`NSC_Entry_1`, `NSC_Entry_2`) each start with SG. CMSIS-Core's example TrustZone projects show NSC functions guarded by `__TZ_GATE_INIT(entry_name)` which emits SG.

Visualize the assembly: at the NSC entry address (e.g., `0x00200000`), the first word is `0xE97FE97F` (SG instruction). The next instruction is often a branch (`B` or `BL`) to the secure function body. The SG must be the first instruction at the entry point — even a NOP before SG causes a fault. The linker ensures the NSC section is 32-byte aligned so the SG falls at a proper NSC region boundary.

Key points:
1. SG is a single 32-bit instruction — it does not take any operands or registers.
2. It must be the first instruction at the NSC entry point.
3. SG is only available on ARMv8-M and later with TrustZone.
4. Executing SG outside an NSC region or in Non-Secure state without a prior BLXNS causes a SecureFault.
5. The compiler must not reorder instructions before SG — use `__attribute__((naked))` and inline assembly to guarantee placement.


References:
1. ARMv8-M ARM (DDI0553) section B4.5, Zephyr `arm_trustzone.c`, FreeRTOS `secure_port.c`, CMSIS-Core TrustZone examples, ARM AN326 "TrustZone for Cortex-M", PSA Firmware Framework for M specification.
