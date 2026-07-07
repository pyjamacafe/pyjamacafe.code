+++
date = '2026-07-06T18:14:00+05:30'
draft = false
title = 'Secure-only Interrupts and Banked NVIC'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 17
weight = 2
initial_code = '''#include <stdio.h>

// NVIC registers (non-secure alias)
#define NVIC_ISER0   (*(volatile unsigned int *)0xE000E100)
#define NVIC_ICER0   (*(volatile unsigned int *)0xE000E180)

// NVIC registers (secure alias)
#define NVIC_ISER0_S (*(volatile unsigned int *)0xE000E400)
#define NVIC_ICER0_S (*(volatile unsigned int *)0xE000E480)

void enable_secure_interrupt(int irq_num) {
    if (irq_num < 32) {
        NVIC_ISER0_S |= (1 << irq_num);  // Secure NVIC
    }
}

void enable_nonsecure_interrupt(int irq_num) {
    if (irq_num < 32) {
        NVIC_ISER0 |= (1 << irq_num);    // Non-secure NVIC
    }
}

int main(void) {
    // Configure interrupt 10 as secure, 15 as non-secure
    enable_secure_interrupt(10);
    enable_nonsecure_interrupt(15);

    printf("Secure interrupt 10 enabled\\n");
    printf("Non-secure interrupt 15 enabled\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Secure and non-secure interrupts configured'
+++

## Problem Statement

Configure secure-only interrupts and non-secure interrupts using the banked NVIC registers. The NVIC is banked in ARMv8-M TrustZone — there are separate register sets for secure and non-secure worlds. Secure software can configure any interrupt as secure or non-secure; non-secure software can only access the non-secure NVIC.

## Theory and Concepts

- In ARMv8-M TrustZone, the NVIC registers are banked: secure and non-secure copies exist at different addresses.
- Secure NVIC base: 0xE000E400 (ISER, ICER, etc.)
- Non-secure NVIC base: 0xE000E100
- A secure interrupt can only be handled by secure code; a non-secure interrupt can be handled by either (if the VTOR is configured appropriately).
- The target security state of an interrupt is determined by the security of its NVIC configuration register.
- Interrupts can also be configured as "non-secure callable" to allow non-secure handlers to service secure interrupts via a gateway.

## Real World Application

Secure-only interrupts are used for security-critical operations — tamper detection, secure firmware update triggers, cryptographic operation completion, and system monitor functions that must not be interfered with by non-secure code.

===EXPLANATION===

ARMv8‑M TrustZone introduced banked NVIC registers to enforce interrupt isolation between the secure and non‑secure worlds. Every NVIC register (ISER, ICER, ISPR, ICPR, IABR, IPR) exists at two base addresses: 0xE000E100 for non‑secure access and 0xE000E400 for secure access. A secure interrupt can only be pended, enabled, or cleared via the secure alias, and its handler executes in secure mode. Non‑secure code can neither see nor touch secure interrupts.

This design solves a critical security problem: without banked NVIC, a compromised non‑secure application could disable the secure firmware's tamper detection interrupt, leaving the system unprotected. By placing security‑critical interrupts in the secure NVIC, the system ensures they remain under exclusive secure control.

The interrupt target security (ITS) is configured through the NVIC->ITNS register. Each bit selects whether the corresponding interrupt targets the secure (0) or non‑secure (1) world. Once an interrupt is assigned to secure world, the non‑secure alias becomes readonly — non‑secure writes are simply ignored. The secure monitor controls ITS during secure firmware initialisation and locks the configuration.

A practical example: a secure‑enabled IoT device uses Interrupt 10 for a physical tamper sensor. The secure bootloader configures ITNS[10] = 0 (secure). Even if the non‑secure application runs malicious code, it cannot disable interrupt 10 — the tamper response always executes in secure mode, triggering data erasure or alert transmission.

Visualise a building with two security perimeters. The outer perimeter (non‑secure) has its own guards and cameras. But the vault door (secure interrupt) is controlled only by the inner security team — outer guards cannot even see the vault camera feeds.

Key points:
1. The ITNS register is writable only from secure code.
2. Non‑secure code attempting to write to secure NVIC registers takes a secure fault or has the write silently ignored.
3. Secure interrupts can be marked Non‑Secure Callable (NSC) to allow non‑secure handlers via a gateway.
4. Secure PendSV and SysTick have their own banked instances.
5. The secure VTOR defines where secure interrupt vectors are located.


ARM's *ARMv8‑M Architecture Reference Manual*, Chapter "Exception and Interrupt Handling with TrustZone", details the banked NVIC implementation. The CMSIS‑Core documentation for ARMv8‑M provides register definitions and access macros.