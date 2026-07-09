+++
date = '2026-07-06T10:30:00+05:30'
draft = false
title = 'SEV, SEVONPEND and Event Communication'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 7
weight = 5
initial_code = '''// Use SEV and SEVONPEND for event-based synchronization
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR       (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SEVONPEND (1UL << 4)

volatile uint32_t event_flag = 0;

void send_event(void) {
    __asm volatile("SEV" ::: "memory");
    printf("Event sent via SEV\\n");
}

void wait_for_event(void) {
    printf("Waiting for event (WFE)...\\n");
    __asm volatile(
        "DSB          \\n\\t"
        "WFE          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
    printf("Woke from WFE\\n");
}

void poll_with_wfe(void) {
    while (event_flag == 0) {
        __asm volatile(
            "DSB          \\n\\t"
            "WFE          \\n\\t"
            "ISB          \\n\\t"
        : : : "memory");
    }
    event_flag = 0;
}

void enable_sevonpend(void) {
    SCB_SCR |= SCB_SCR_SEVONPEND;
    printf("SEVONPEND enabled: interrupts will wake WFE\\n");
}

void send_event_from_interrupt(void) {
    __asm volatile("SEV" ::: "memory");
}

int main(void) {
    printf("SEV and SEVONPEND Event Communication\\n\\n");

    enable_sevonpend();

    printf("\\nTest 1: Direct SEV -> WFE pair\\n");
    send_event();
    wait_for_event();

    printf("\\nTest 2: WFE polling loop with event flag\\n");
    send_event_from_interrupt();
    poll_with_wfe();
    printf("Event flag consumed\\n");

    printf("\\nEvent register behavior:\\n");
    printf("  - SEV sets the event register for all cores\\n");
    printf("  - WFE clears the event register and sleeps\\n");
    printf("  - If event register was set, WFE does NOT sleep\\n");
    printf("  - SEVONPEND: interrupt pending also sets event reg\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates inter-thread and inter-processor event communication using the SEV (Send Event) and WFE (Wait For Event) instructions. Implement a polling loop using WFE that avoids busy-waiting, and enable SEVONPEND so that interrupt pending also generates an event.

## Theory and Concepts

- SEV sends an event to all cores in a multiprocessor system (or the event register in a single-core system).
- WFE sleeps until an event occurs. If the event register is already set, WFE does not sleep (it clears the register and continues).
- The event register is single-bit and per-processor. It is set by SEV from any core, by debug entry, or by an interrupt if SEVONPEND is enabled.
- SEVONPEND (SCR bit 4): when set, any interrupt that becomes pending (not just the ones that fire) sets the event register.
- WFE is useful for low-power spin-loops: the processor sleeps instead of busy-waiting.
- Multi-core synchronization: SEV from one core wakes another core waiting on WFE.
- WFE can also wake on external events (certain peripherals can generate events directly).

## Real World Application

Multi-core Cortex-M processors (like the nRF5340 with dual Cortex-M33) use SEV/WFE for inter-processor communication and power-efficient synchronization. Single-core systems use WFE for power-efficient polling of semaphores and flags.

===EXPLANATION===

The SEV (Send Event) and WFE (Wait For Event) instructions form a lightweight inter-processor communication primitive that predates and complements the interrupt system. While interrupts signal a processor to execute code, events signal a processor to stop sleeping — a subtle but important distinction that enables power-efficient synchronization.

The historical motivation for SEV/WFE comes from multiprocessor ARM systems. In a dual-core design, one core might need to wake another core without the overhead of a full interrupt. The SEV instruction sends an event pulse to all cores in the system, setting their event register. A WFE on the target core then returns immediately without sleeping, or if the core was already sleeping, wakes it up.

The event register is a per-core, single-bit latch that acts as a memory of recent events. WFE checks this register: if it is 1, WFE clears it and continues executing (no sleep). If it is 0, WFE sleeps until either an SEV is executed by any core, an interrupt occurs, or a debug event arrives. This design means that WFE never misses a wake-up: if the event arrives between the flag check and the WFE instruction, the event register catches it.

SEVONPEND (SCR bit 4) bridges events and interrupts. When enabled, any interrupt that becomes pending sets the event register for all cores. This means a WFE can wake not only on explicit SEV instructions but also on any interrupt pending event. This is particularly useful for power-efficient idle loops: instead of polling a hardware flag in a busy-wait, the processor can WFE and wake automatically when the peripheral generates an interrupt.

In professional multi-core systems, SEV/WFE is used for message passing without interrupts. Core A writes data to a shared memory region and executes SEV. Core B, which was executing WFE in a polling loop, wakes up, sees that new data is available, and processes it. The core B loop uses almost no power during the wait because the processor is in sleep mode, not busy-waiting.

A single-core example: a DMA transfer completion flag. Instead of `while (!(DMA->SR & DONE)) {}` which burns hundreds of milliamps spinning, you write `while (!(DMA->SR & DONE)) { WFE(); }`. The WFE sleeps until the DMA channel's completion interrupt sets the event register via SEVONPEND. Power consumption drops from milliamps to microamps.

Visualize SEV/WFE as two people in adjacent rooms. One person finishes their work and taps the wall (SEV). The other, who has been dozing with their hand on the wall (WFE), feels the tap and wakes up. SEVONPEND adds a third person — an interrupt — who can also tap the wall when something happens.

Key points: SEV sets the event register on all cores; WFE checks and clears the event register; the event register prevents lost wake-ups; SEVONPEND makes interrupt pending set the event register; WFE is more power-efficient than polling; WFI is better for cases where an interrupt handler must run.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.3.2–B1.3.3), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 14.4), ARM Infocenter DDI0403E.

