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

