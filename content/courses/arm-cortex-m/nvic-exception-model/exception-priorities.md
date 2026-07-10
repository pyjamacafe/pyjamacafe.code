+++
date = '2026-07-06T10:15:00+05:30'
draft = false
title = 'Exception Priority Configuration'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 5
weight = 2
initial_code = '''// Configure and verify exception priorities
#include <stdio.h>
#include <stdint.h>

#define NVIC_IPR_BASE 0xE000E400

void set_irq_priority(uint32_t irq_num, uint32_t priority) {
    volatile uint32_t *ipr = (uint32_t *)(NVIC_IPR_BASE + (irq_num / 4) * 4);
    uint32_t shift = (irq_num % 4) * 8;

    uint32_t reg_val = *ipr;
    reg_val &= ~(0xFFUL << shift);
    reg_val |= ((priority & 0xFF) << shift);
    *ipr = reg_val;

    __asm volatile("DSB" ::: "memory");
}

uint32_t get_irq_priority(uint32_t irq_num) {
    volatile uint32_t *ipr = (uint32_t *)(NVIC_IPR_BASE + (irq_num / 4) * 4);
    uint32_t shift = (irq_num % 4) * 8;
    return (*ipr >> shift) & 0xFF;
}

#define SCB_SHPR1 (*((volatile uint32_t *)0xE000ED18))
#define SCB_SHPR2 (*((volatile uint32_t *)0xE000ED1C))
#define SCB_SHPR3 (*((volatile uint32_t *)0xE000ED20))

void set_system_handler_priority(uint32_t shpr_reg, uint32_t priority) {
    switch (shpr_reg) {
        case 1: SCB_SHPR1 = (priority << 24) | (priority << 16) | (priority << 8) | priority; break;
        case 2: SCB_SHPR2 = (priority << 24) | (priority << 16) | (priority << 8) | priority; break;
        case 3: SCB_SHPR3 = (priority << 24) | (priority << 16) | (priority << 8) | priority; break;
    }
}

int main(void) {
    set_irq_priority(0, 0x80);
    set_irq_priority(1, 0x40);

    set_system_handler_priority(3, 0xE0);

    printf("IRQ0 priority: 0x%02X\n", get_irq_priority(0));
    printf("IRQ1 priority: 0x%02X\n", get_irq_priority(1));

    printf("SHPR3: 0x%08X\n", SCB_SHPR3);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write functions to set and get the priority of any exception on a Cortex-M processor. Support both external interrupts (via NVIC_IPR registers) and system exceptions (via SCB_SHPR registers). Use the priority values 0x00 (highest) through 0xE0 (lowest) with 8-bit configurable priority levels.

## Theory and Concepts

- Each exception has a programmable priority level, stored in NVIC_IPR (for IRQs) and SCB_SHPR (for system handlers).
- Priority registers are 8-bit per exception, but the number of implemented bits is implementation defined (typically 3-8 bits).
- The lower the numeric priority value, the higher the actual priority.
- For NVIC_IPR, each register contains priorities for 4 IRQs (bytes 0-3).
- System handler priorities: SHPR1 (MemManage, BusFault, UsageFault), SHPR2 (SVCall), SHPR3 (SysTick, PendSV, DebugMonitor).
- A DSB instruction ensures the priority change takes effect before subsequent exceptions.
- PRIGROUP (in SCB_AIRCR) enables configurable priority grouping (preempt priority vs sub-priority).

## Real World Application

Correct priority assignment prevents priority inversion and ensures hard real-time deadlines are met. For example, a motor control loop must have higher priority than a communication stack to ensure precise timing.

===EXPLANATION===

Priority-based preemption is the foundation of real-time interrupt handling, and its history traces back to the earliest priority interrupt systems on mainframes. The Cortex-M NVIC implements a full, configurable priority scheme where every interrupt and system exception has a programmable priority level. The core rule is simple but non-intuitive: lower numeric value means higher priority. A priority-zero interrupt will preempt any other.

The intuition behind programmable priority is that not all interrupts are equally urgent. A brushless DC motor controller needs to update PWM duty cycles every 20 microseconds — missing that deadline means a jittery motor or even a stalled rotor. A UART receive interrupt, by contrast, can typically wait hundreds of microseconds before the hardware buffer overflows. By assigning priority 0 to the motor timer and priority 128 to the UART, the motor control ISR always preempts the UART ISR, ensuring hard real-time guarantees.

Priority grouping (the PRIGROUP field in SCB_AIRCR) adds a subtle but powerful dimension. It splits the 8-bit priority value into two logical fields: a preemption priority group and a sub-priority within that group. Interrupts with different preemption priorities can nest (higher preempts lower). Interrupts with the same preemption priority but different sub-priorities do not nest — they simply pend, and the NVIC selects the one with the lower sub-priority to run next. This grouping allows systems to define interrupt "classes" where only certain groups can preempt each other.

In professional RTOS design, priority assignment follows specific patterns. The RTOS tick timer (SysTick) typically gets a low priority so that real-time interrupts can preempt it. PendSV gets the lowest priority of all — it is the "background" interrupt that runs after all other interrupts are done, used for context switching. Device drivers are assigned priorities based on their latency tolerance: timer and ADC interrupts at the top, communication and DMA at the bottom.

Visualize priorities as floors in a building. An interrupt at floor 0 (highest priority) occupies the penthouse: nothing can touch it. An interrupt at floor 7 occupies the basement. When a floor-3 ISR is running and a floor-1 interrupt fires, the floor-3 ISR is instantly suspended — the NVIC enforces the floor hierarchy. Priority grouping adds elevator banks: only certain groups of floors can access certain elevators.

Key points: 0x00 is highest priority, 0xE0 is lowest (or 0xFF depending on implemented bits); NVIC_IPR encodes four IRQs per register; system handlers use SCB_SHPR1–3; PRIGROUP controls preemption nesting depth; lower priority interrupts can starve if higher priority ones fire too frequently.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B3.4 — NVIC priority registers), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8.2 — Priority), ARM Infocenter DDI0403E.

