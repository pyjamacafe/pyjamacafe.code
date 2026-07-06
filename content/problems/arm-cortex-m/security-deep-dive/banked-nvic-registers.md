+++
date = '2026-07-06T18:15:00+05:30'
draft = false
title = 'Banked NVIC Register Access'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 17
weight = 3
initial_code = '''#include <stdio.h>

// Non-secure alias
#define NVIC_IPR0_NS  ((volatile unsigned int *)0xE000E400)
// Secure alias
#define NVIC_IPR0_S   ((volatile unsigned int *)0xE000ED00)

void set_interrupt_priority_secure(int irq, unsigned int priority) {
    volatile unsigned int *ipr = NVIC_IPR0_S + (irq / 4);
    unsigned int shift = (irq % 4) * 8;
    *ipr = (*ipr & ~(0xFF << shift)) | (priority << shift);
}

void set_interrupt_priority_nonsecure(int irq, unsigned int priority) {
    volatile unsigned int *ipr = NVIC_IPR0_NS + (irq / 4);
    unsigned int shift = (irq % 4) * 8;
    *ipr = (*ipr & ~(0xFF << shift)) | (priority << shift);
}

int main(void) {
    set_interrupt_priority_secure(10, 0x80);
    set_interrupt_priority_nonsecure(15, 0xC0);
    printf("Banked NVIC priorities configured\\n");
    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'Banked NVIC register access demonstrated'
+++

## Problem Statement

Access the banked NVIC interrupt priority registers (IPR) from both the secure and non-secure aliases. Implement functions to set interrupt priorities in both worlds. Explain that the secure world sees both aliases while the non-secure world only sees the non-secure alias.

## Theory and Concepts

- The NVIC registers are banked at different base addresses for secure and non-secure access.
- The secure alias provides full access to all interrupts; the non-secure alias only controls interrupts that are configured as non-secure.
- Writing to the secure alias on a non-secure interrupt affects only the non-secure configuration.
- The secure alias for IPR is at 0xE000ED00 + offset; the non-secure alias is at 0xE000E400 + offset.
- This banking ensures that non-secure code cannot modify secure interrupt priorities or configuration.
- Secure code can retrieve the security level of each interrupt via the NVIC->ITNS register.

## Real World Application

Banked NVIC registers enable TrustZone to enforce interrupt separation — a non-secure RTOS can manage its own interrupts while secure firmware manages security-critical interrupts independently, maintaining isolation guarantees.
