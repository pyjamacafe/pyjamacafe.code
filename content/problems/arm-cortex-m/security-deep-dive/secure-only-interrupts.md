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
