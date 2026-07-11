+++
date = '2026-07-06T18:15:00+05:30'
draft = true
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
    printf("Banked NVIC priorities configured\n");
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

===EXPLANATION===

The banking of NVIC registers is the physical manifestation of TrustZone's interrupt isolation. Every control register in the NVIC — ISER, ICER, ISPR, ICPR, IABR, IPR, and STIR — has two aliases: one at the standard non‑secure base (0xE000E100) and one at the secure base (0xE000E400). Additionally, priority registers (IPR) are banked with the secure alias at 0xE000ED00 and the non‑secure alias at 0xE000E400.

This banking ensures that the two worlds have independent views of the interrupt system. A non‑secure RTOS can enable, disable, prioritise, and pend its own interrupts without any visibility into the secure world's interrupts. Secure firmware can monitor everything — it can see both aliases — but the separation is enforced in hardware: non‑secure accesses to secure alias addresses either fault or are silently ignored.

The interrupt target non‑secure (ITNS) register, located at the secure alias, determines the security assignment for each interrupt. ITNS[n] = 0 means interrupt n is secure; ITNS[n] = 1 means it is non‑secure. This register is writable only from secure code and is typically configured once during secure boot. Once written, the assignment is locked until the next reset.

A common scenario: an RTOS running on the non‑secure side uses UART IRQ (interrupt 30) for its console. The secure firmware uses TrustZone‑internal interrupt 2 for the secure timer. The non‑secure RTOS writes to NVIC_ISER0 (0xE000E100) for the UART — the hardware automatically routes this to the non‑secure ISER bank. If the non‑secure code accidentally writes to bit 2, the write has no effect because interrupt 2 is secure.

Visualise a shared mailroom with two sets of mailboxes. Secure world has the master key that opens both sets. Non‑secure world has a key that opens only its own mailboxes. Both worlds can send and receive their own mail (interrupts) independently.

Key points:
1. The ITNS register is at the secure alias; non‑secure reads return 0xFFFFFFFF for secure interrupts.
2. The non‑secure NVIC sees only the subset of interrupts assigned as non‑secure.
3. Secure code can grant interrupt control to non‑secure by setting ITNS[n] = 1.
4. The secure NVIC includes all interrupts, regardless of ITNS setting.
5. Secure code can also configure the priority of non‑secure interrupts via the secure IPR alias.


The ARMv8‑M Architecture Reference Manual, "NVIC Register Descriptions" chapter, details the address map for banked registers. CMSIS‑Core headers define `NVIC_S_BASE` and `NVIC_NS_BASE` for accessing the aliases from C code.
