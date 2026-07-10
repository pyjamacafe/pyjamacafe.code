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

    printf("Software-triggered IRQ%u\n", irq_num);
}

void nvic_set_pending(uint32_t irq_num) {
    if (irq_num < 32) {
        (*((volatile uint32_t *)0xE000E200)) = (1UL << irq_num);
    }
}

int main(void) {
    printf("Software Trigger Interrupt Register (STIR)\n\n");

    printf("Method 1: Writing to ISPR (Set Pending Register)\n");
    nvic_set_pending(0);
    printf("  IRQ0 pended via ISPR\n\n");

    printf("Method 2: Writing to STIR (more efficient)\n");
    sw_trigger_irq(5);
    sw_trigger_irq(10);

    printf("\nComparison:\n");
    printf("  ISPR: requires bitmask calculation per IRQ\n");
    printf("  STIR: accepts IRQ number directly (0-479)\n");
    printf("  STIR is single-register, single-write operation\n");

    volatile uint32_t ispr0 = *((volatile uint32_t *)0xE000E200);
    printf("\nISPR0: 0x%08X\n", ispr0);

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

===EXPLANATION===

The Software Trigger Interrupt Register (STIR) is one of those small but details that reveals ARM's design philosophy: provide hardware primitives for common software patterns. Before STIR, software needed to pend an interrupt by computing a bitmask and writing to the Interrupt Set Pending Register (ISPR). STIR accepts the interrupt number directly — a single register, a single write, no bitmask arithmetic.

The historical motivation comes from multicore systems. In a dual-core Cortex-M processor like the nRF5340, core 0 may need to signal core 1. Without STIR, core 0 would need to know which NVIC register and which bit within that register corresponds to the inter-processor interrupt. With STIR, core 0 simply writes the interrupt number to the register, and the hardware handles the register-bank and bitmask mapping automatically. This abstraction becomes critical in virtualized environments where the OS may not know the physical register layout.

The intuition is straightforward: manually computing `register_base + (irq_num / 32) * 4` and `1 << (irq_num % 32)` is error-prone boilerplate. STIR collapses that into a single memory-mapped write. On the programmer's side, it reduces cognitive load; on the performance side, it saves several instructions of bitmask arithmetic.

In professional systems, STIR shines in interrupt-driven state machines. A protocol decoder might run as a low-priority interrupt. When a higher-priority DMA completion interrupt finishes filling a buffer, it triggers the decoder ISR via STIR. The decoder ISR then processes the buffer without blocking the DMA. This deferred procedure call pattern is the interrupt-world equivalent of a bottom-half handler in Linux.

Visualize a telephone switchboard from the 1950s. ISPR is the old manual board where the operator must find the correct jack and plug in the cable. STIR is a modern PBX: you just dial the extension number, and the switchboard routes you automatically.

Key points: STIR is at 0xE000EF00; accepts IRQ numbers 0–479; requires a DSB after writing for ordering; cannot pend system exceptions (SVCall, PendSV, SysTick — use ICSR instead); on ARMv7-M, priority grouping must be configured before STIR is used; on ARMv8-M, STIR is banked for Secure and Non-Secure states.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B3.4.13 — STIR), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8.9), ARM Infocenter DDI0403E.

