+++
date = '2026-07-06T10:25:00+05:30'
draft = false
title = 'NVIC Pending Status and Clear'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 6
weight = 5
initial_code = '''// Manage interrupt pending state
#include <stdio.h>
#include <stdint.h>

#define NVIC_ISPR0 (*((volatile uint32_t *)0xE000E200))
#define NVIC_ISPR1 (*((volatile uint32_t *)0xE000E204))
#define NVIC_ICPR0 (*((volatile uint32_t *)0xE000E280))
#define NVIC_ICPR1 (*((volatile uint32_t *)0xE000E284))
#define NVIC_IABR0 (*((volatile uint32_t *)0xE000E300))
#define NVIC_IABR1 (*((volatile uint32_t *)0xE000E304))

void set_pending(uint32_t irq) {
    if (irq < 32)      NVIC_ISPR0 = (1UL << irq);
    else if (irq < 64) NVIC_ISPR1 = (1UL << (irq - 32));
}

void clear_pending(uint32_t irq) {
    if (irq < 32)      NVIC_ICPR0 = (1UL << irq);
    else if (irq < 64) NVIC_ICPR1 = (1UL << (irq - 32));
}

uint32_t is_pending(uint32_t irq) {
    if (irq < 32)      return (NVIC_ISPR0 >> irq) & 1;
    else if (irq < 64) return (NVIC_ISPR1 >> (irq - 32)) & 1;
    return 0;
}

uint32_t is_active(uint32_t irq) {
    if (irq < 32)      return (NVIC_IABR0 >> irq) & 1;
    else if (irq < 64) return (NVIC_IABR1 >> (irq - 32)) & 1;
    return 0;
}

void print_nvic_state(const char *label, uint32_t irq) {
    printf("%s IRQ%u: pending=%u active=%u\\n",
           label, irq, is_pending(irq), is_active(irq));
}

int main(void) {
    printf("NVIC Pending and Active State Management\\n\\n");

    printf("Test: Pend IRQ5, then clear it\\n\\n");

    print_nvic_state("Before:", 5);

    set_pending(5);
    print_nvic_state("After set_pending:", 5);

    clear_pending(5);
    print_nvic_state("After clear_pending:", 5);

    printf("\\nTest: Multiple pends\\n");
    set_pending(0);
    set_pending(1);
    set_pending(2);
    printf("ISPR0 after pending 0,1,2: 0x%08X\\n", NVIC_ISPR0);

    clear_pending(1);
    printf("ISPR0 after clearing IRQ1: 0x%08X\\n", NVIC_ISPR0);

    printf("\\nActive status should be 0 in thread mode:\\n");
    printf("IABR0: 0x%08X\\n", NVIC_IABR0);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a complete set of functions to manage the pending state of NVIC interrupts. Implement set_pending, clear_pending, is_pending, and is_active for interrupts up to IRQ 63. Demonstrate the state transitions: set pending, check pending status, clear pending, and verify that active status reflects currently executing handlers.

## Theory and Concepts

- Pending state indicates an interrupt request is waiting to be serviced.
- Interrupts become pending when: the peripheral asserts the interrupt signal, software writes to ISPR/STIR, or the interrupt was already pending and is disabled then re-enabled.
- Pend state is cleared when: the processor starts executing the handler, or software writes to ICPR.
- Writing 1 to ICPR clears the pending bit; writing 0 has no effect.
- Active state indicates the processor is currently executing the interrupt handler.
- A new pending event while the handler is active will be remembered and serviced after the current handler completes.
- For level-sensitive interrupts, the peripheral must de-assert the IRQ line before exiting the handler to prevent re-pending.

## Real World Application

Managing pending state correctly is critical for reliable interrupt handling. Clearing pending state is used to abort unwanted interrupts, de-bounce noisy lines, and implement interrupt-driven state machines.

