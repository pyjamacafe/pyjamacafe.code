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

