+++
date = '2026-07-06T10:14:00+05:30'
draft = false
title = 'TrustZone Secure and Non-Secure Interrupt Handling'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 5
initial_code = '''// Configure interrupts as secure or non-secure
#include <stdio.h>
#include <stdint.h>

#define NVIC_ISER0  (*((volatile uint32_t *)0xE000E100))
#define NVIC_ICER0  (*((volatile uint32_t *)0xE000E180))
#define NVIC_ISPR0  (*((volatile uint32_t *)0xE000E200))

#define NVIC_ITNS0 (*((volatile uint32_t *)0xE000E900))

void set_interrupt_secure(uint32_t irq_num, uint32_t secure) {
    if (secure) {
        NVIC_ITNS0 &= ~(1UL << irq_num);
    } else {
        NVIC_ITNS0 |= (1UL << irq_num);
    }

    printf("IRQ %u configured as %s\\n",
           irq_num, secure ? "Secure" : "Non-Secure");
}

void enable_interrupt(uint32_t irq_num) {
    NVIC_ISER0 = (1UL << irq_num);
    printf("IRQ %u enabled\\n", irq_num);
}

void disable_interrupt(uint32_t irq_num) {
    NVIC_ICER0 = (1UL << irq_num);
    printf("IRQ %u disabled\\n", irq_num);
}

int main(void) {
    set_interrupt_secure(0, 1);
    set_interrupt_secure(1, 0);
    set_interrupt_secure(2, 0);
    set_interrupt_secure(3, 1);

    enable_interrupt(0);
    enable_interrupt(1);

    printf("\\nSecure interrupts (ITNS=0): IRQ 0, IRQ 3\\n");
    printf("Non-Secure interrupts (ITNS=1): IRQ 1, IRQ 2\\n");

    uint32_t itns = NVIC_ITNS0;
    printf("ITNS0 register: 0x%08X\\n", itns);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Configure interrupt targets for security (NVIC_ITNS registers) to designate some interrupts as Secure and others as Non-Secure. Write a function that assigns security for each interrupt, enables secure-only interrupts, and verifies that non-secure software cannot modify the configuration of secure interrupts.

## Theory and Concepts

- In ARMv8-M with TrustZone, the NVIC is banked: Secure NVIC and Non-Secure NVIC.
- NVIC_ITNS (Interrupt Target Non-Secure) register determines if an interrupt is Secure (0) or Non-Secure (1).
- Secure software can configure all interrupts. Non-secure software can only configure interrupts marked as Non-Secure.
- Secure interrupts can preempt non-secure code; the reverse is not possible.
- Non-secure interrupts cannot be pending while secure code is executing (unless explicitly configured).
- The vector table is also banked: secure and non-secure copies.
- The security of each interrupt is locked after first use; a reset is needed to change it.
- Airplane (not yet pended) interrupts can be reassigned; once pended or enabled, the assignment is locked.

## Real World Application

Secure IoT firmware uses secure interrupts for trusted operations like cryptographic processing and secure timers. Non-secure interrupts handle user-facing features (keyboard, display, connectivity). The separation ensures that an exploited non-secure component cannot compromise secure operations.

