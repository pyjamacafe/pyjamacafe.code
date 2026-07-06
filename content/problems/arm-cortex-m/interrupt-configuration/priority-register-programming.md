+++
date = '2026-07-06T10:22:00+05:30'
draft = false
title = 'NVIC Priority Register Programming'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 6
weight = 2
initial_code = '''// Program NVIC priority registers
#include <stdio.h>
#include <stdint.h>

#define NVIC_IPR_BASE 0xE000E400
#define SCB_AIRCR     (*((volatile uint32_t *)0xE000ED0C))

uint32_t get_priority_grouping(void) {
    return (SCB_AIRCR >> 8) & 7;
}

void set_priority_grouping(uint32_t grouping) {
    uint32_t reg = SCB_AIRCR;
    reg = (reg & ~(0xFFFFUL << 16)) | (0x05FAUL << 16);
    SCB_AIRCR = reg;
}

void set_irq_priority(uint32_t irq_num, uint32_t preempt, uint32_t sub) {
    uint32_t grouping = get_priority_grouping();
    uint32_t preempt_bits = (7 - grouping) + 1;
    uint32_t sub_bits = grouping;
    uint32_t priority = (preempt << sub_bits) | (sub & ((1 << sub_bits) - 1));
    priority <<= (8 - preempt_bits - sub_bits);

    volatile uint32_t *ipr = (uint32_t *)(NVIC_IPR_BASE + (irq_num / 4) * 4);
    uint32_t shift = (irq_num % 4) * 8;
    uint32_t reg_val = *ipr;
    reg_val &= ~(0xFFUL << shift);
    reg_val |= (priority << shift);
    *ipr = reg_val;

    printf("IRQ%u: preempt=%u, sub=%u, raw=0x%02X\\n",
           irq_num, preempt, sub, (uint32_t)(priority & 0xFF));
}

int main(void) {
    printf("NVIC Priority Configuration\\n\\n");

    set_priority_grouping(3);

    printf("Priority grouping: %u (8 groups, 8 sub-priorities)\\n",
           get_priority_grouping());

    set_irq_priority(0, 1, 0);
    set_irq_priority(1, 1, 1);
    set_irq_priority(2, 2, 0);

    printf("\\nVerification:\\n");
    volatile uint32_t *ipr0 = (uint32_t *)NVIC_IPR_BASE;
    printf("IPR0: 0x%08X\\n", *ipr0);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a function to program interrupt priority values using the NVIC IPR registers. Support configurable priority grouping via the PRIGROUP field in SCB_AIRCR. Given a preemption priority and sub-priority number, compute the correct 8-bit priority value and write it to the appropriate IPR register byte.

## Theory and Concepts

- Each external interrupt has an 8-bit priority field in the NVIC_IPR registers.
- The number of implemented priority bits is device-specific (typically 3-8 bits for Cortex-M).
- PRIGROUP (SCB_AIRCR[10:8]) splits the priority field into preemption priority and sub-priority.
- PRIGROUP=0: all bits are preempt priority. PRIGROUP=7: all bits are sub-priority.
- The register address calculation: NVIC_IPR_BASE + (irq_num / 4) * 4, byte offset = irq_num % 4.
- Each IPR register packs priorities for four consecutive interrupts.
- Lower numeric value = higher priority.
- Priority grouping affects only exception preemption behavior, not the priority value storage.

## Real World Application

Priority grouping allows nested interrupt scenarios where a group of interrupts can preempt another group, while within a group, only sub-priority determines pending order (no preemption). This is used in complex systems with multiple interrupt classes.

