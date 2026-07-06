+++
date = '2026-07-06T10:23:00+05:30'
draft = false
title = 'Software Trigger Interrupt Register (STIR)'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 6
weight = 3
initial_code = '''// Use STIR for software-triggered interrupts
#include <stdio.h>
#include <stdint.h>

#define NVIC_STIR     (*((volatile uint32_t *)0xE000EF00))

void sw_trigger_irq(uint32_t irq_num) {
    NVIC_STIR = irq_num & 0x1FF;
    __asm volatile("DSB" ::: "memory");

    printf("Software-triggered IRQ%u\\n", irq_num);
}

void nvic_set_pending(uint32_t irq_num) {
    if (irq_num < 32) {
        (*((volatile uint32_t *)0xE000E200)) = (1UL << irq_num);
    }
}

int main(void) {
    printf("Software Trigger Interrupt Register (STIR)\\n\\n");

    printf("Method 1: Writing to ISPR (Set Pending Register)\\n");
    nvic_set_pending(0);
    printf("  IRQ0 pended via ISPR\\n\\n");

    printf("Method 2: Writing to STIR (more efficient)\\n");
    sw_trigger_irq(5);
    sw_trigger_irq(10);

    printf("\\nComparison:\\n");
    printf("  ISPR: requires bitmask calculation per IRQ\\n");
    printf("  STIR: accepts IRQ number directly (0-479)\\n");
    printf("  STIR is single-register, single-write operation\\n");

    volatile uint32_t ispr0 = *((volatile uint32_t *)0xE000E200);
    printf("\\nISPR0: 0x%08X\\n", ispr0);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that uses the Software Trigger Interrupt Register (STIR) to pend interrupts from software. Compare the STIR approach with the traditional ISPR (Interrupt Set Pending Register) method. STIR allows pending an interrupt by writing its number directly, without needing to compute a bitmask.

## Theory and Concepts

- STIR (SCS register at 0xE000EF00) allows pending any interrupt by writing its number.
- On ARMv7-M, STIR requires priority grouping to be configured first.
- On ARMv8-M, STIR is banked for secure and non-secure states.
- Writing to STIR is functionally equivalent to setting the corresponding bit in ISPR.
- STIR is more efficient for software triggering because it avoids bitmask calculation.
- STIR accepts interrupt numbers 0-479 (9 bits).
- A DSB is recommended after writing STIR to ensure the pend is visible before subsequent operations.
- STIR cannot pend system exceptions (SVCall, PendSV, SysTick) — use SCB ICSR for those.

## Real World Application

Software-triggered interrupts are used for inter-processor communication in multi-core systems, deferred procedure calls in RTOS kernels, and for testing interrupt handlers during development without requiring peripheral hardware.

