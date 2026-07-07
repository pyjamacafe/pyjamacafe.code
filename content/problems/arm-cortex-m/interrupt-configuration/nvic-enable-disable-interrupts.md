+++
date = '2026-07-06T10:21:00+05:30'
draft = false
title = 'NVIC Interrupt Enable and Disable'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 6
weight = 1
initial_code = '''// Enable and disable interrupts via NVIC
#include <stdio.h>
#include <stdint.h>

#define NVIC_ISER0 (*((volatile uint32_t *)0xE000E100))
#define NVIC_ISER1 (*((volatile uint32_t *)0xE000E104))
#define NVIC_ICER0 (*((volatile uint32_t *)0xE000E180))
#define NVIC_ICER1 (*((volatile uint32_t *)0xE000E184))
#define NVIC_ISPR0 (*((volatile uint32_t *)0xE000E200))
#define NVIC_ISPR1 (*((volatile uint32_t *)0xE000E204))
#define NVIC_IABR0 (*((volatile uint32_t *)0xE000E300))
#define NVIC_IABR1 (*((volatile uint32_t *)0xE000E304))

void nvic_enable_irq(uint32_t irq_num) {
    if (irq_num < 32) {
        NVIC_ISER0 = (1UL << irq_num);
    } else if (irq_num < 64) {
        NVIC_ISER1 = (1UL << (irq_num - 32));
    }
}

void nvic_disable_irq(uint32_t irq_num) {
    if (irq_num < 32) {
        NVIC_ICER0 = (1UL << irq_num);
    } else if (irq_num < 64) {
        NVIC_ICER1 = (1UL << (irq_num - 32));
    }
}

void nvic_set_pending(uint32_t irq_num) {
    if (irq_num < 32) {
        NVIC_ISPR0 = (1UL << irq_num);
    } else if (irq_num < 64) {
        NVIC_ISPR1 = (1UL << (irq_num - 32));
    }
}

uint32_t nvic_is_active(uint32_t irq_num) {
    if (irq_num < 32) {
        return (NVIC_IABR0 >> irq_num) & 1;
    } else if (irq_num < 64) {
        return (NVIC_IABR1 >> (irq_num - 32)) & 1;
    }
    return 0;
}

int main(void) {
    printf("NVIC Interrupt Control\\n\\n");

    nvic_enable_irq(0);
    nvic_enable_irq(1);
    nvic_enable_irq(10);

    printf("ISER0: 0x%08X\\n", NVIC_ISER0);
    printf("Interrupts 0, 1, 10 enabled\\n\\n");

    nvic_disable_irq(1);
    printf("After disabling IRQ1:\\n");
    printf("ISER0: 0x%08X\\n", NVIC_ISER0);

    nvic_set_pending(20);
    printf("\\nPending for IRQ20 set\\n");

    printf("Active IRQ0: %u\\n", nvic_is_active(0));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write functions to enable, disable, set pending, and check active status for external interrupts using the NVIC registers. Support at least 64 interrupts across ISER0/ISER1, ICER0/ICER1, ISPR0/ISPR1, and IABR0/IABR1 registers. Demonstrate the usage by enabling a set of interrupts, disabling one, and checking status.

## Theory and Concepts

- NVIC (Nested Vectored Interrupt Controller) manages up to 480 external interrupts (implementation-dependent).
- ISER (Interrupt Set-Enable Register): write 1 to enable an interrupt. Reads return current state.
- ICER (Interrupt Clear-Enable Register): write 1 to disable an interrupt.
- ISPR (Interrupt Set-Pending Register): write 1 to pend an interrupt (useful for software triggers).
- ICPR (Interrupt Clear-Pending Register): write 1 to clear pending state.
- IABR (Interrupt Active Bit Register): read-only, indicates which interrupts are currently active.
- All NVIC registers use write-1-to-set semantics (writing 0 has no effect).
- NVIC registers are word-accessible; each bit corresponds to one interrupt.

## Real World Application

Every interrupt-driven firmware application uses NVIC enable/disable registers to control peripheral interrupts. Device drivers enable their interrupt after initializing the peripheral and disable it during critical operations.

===EXPLANATION===

The NVIC enable and disable registers — ISER (Interrupt Set-Enable Register) and ICER (Interrupt Clear-Enable Register) — are the most frequently accessed NVIC registers in any interrupt-driven firmware. They implement a simple but elegant write-1-to-set and write-1-to-clear protocol that avoids the read-modify-write problem.

The historical design choice of write-1-to-set semantics is deliberate. In a traditional GPIO-style register, enabling a single interrupt requires reading the register, OR-ing a bitmask, and writing back — a read-modify-write sequence that itself must be protected. The NVIC's approach means a single store instruction enables or disables an interrupt atomically. Writing 0 has no effect, so there is no risk of accidentally clearing other bits.

The intuition behind separate set and clear registers is that they eliminate the need for critical sections around interrupt configuration. If ISER and ICER were a single register, enabling interrupt A while another core or interrupt context disables interrupt B would require synchronization. With separate registers, the two operations are inherently independent — they write to different addresses.

In professional driver code, the pattern is always the same: during initialization, the driver configures the peripheral, sets the priority via NVIC_IPR, then enables the interrupt via ISER. During shutdown or error recovery, the driver disables the interrupt via ICER before touching shared data. The interrupt handler itself never touches the enable bits — it merely services the peripheral and clears the interrupt flag in the peripheral's own register.

The ISER/ICER registers are organized as one bit per interrupt, with each register covering 32 interrupts. ISER0 covers IRQs 0–31, ISER1 covers IRQs 32–63, and so on up to ISER14 (covering up to IRQ 479, depending on the implementation). The bit position within the register corresponds to the interrupt number modulo 32.

Visualize each interrupt as a light switch on a large panel. ISER is the panel of "turn on" buttons — press one, the light turns on. ICER is the panel of "turn off" buttons — press one, the light turns off. Both panels show the current state (reading ISER returns which interrupts are enabled). But writing to one never affects the other.

Key points: ISER at 0xE000E100, ICER at 0xE000E180; each register covers 32 interrupts; write 1 to enable/disable, write 0 has no effect; reading ISER returns the current enable state; enabling an interrupt does not automatically pend it; always configure priority before enabling.

References: ARM Architecture Reference Manual ARMv7-M (section B3.4.1–B3.4.3), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8.7), ARM Infocenter DDI0403E.

