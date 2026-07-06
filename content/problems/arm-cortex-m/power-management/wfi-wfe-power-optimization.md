+++
date = '2026-07-06T10:58:00+05:30'
draft = false
title = 'WFI/WFE Power Optimization Strategies'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 3
initial_code = '''// Optimize power usage with WFI and WFE
#include <stdio.h>
#include <stdint.h>

volatile uint32_t system_ticks = 0;
volatile uint32_t wfi_count = 0;
volatile uint32_t wfe_count = 0;

void idle_wfi(void) {
    __asm volatile(
        "DSB          \\n\\t"
        "WFI          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
    wfi_count++;
}

void idle_wfe(void) {
    __asm volatile(
        "DSB          \\n\\t"
        "WFE          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
    wfe_count++;
}

void poll_with_wfe(volatile uint32_t *flag) {
    while (*flag == 0) {
        __asm volatile("SEV" ::: "memory");
        __asm volatile(
            "DSB          \\n\\t"
            "WFE          \\n\\t"
            "ISB          \\n\\t"
        : : : "memory");
    }
}

void busy_wait(uint32_t count) {
    for (volatile uint32_t i = 0; i < count; i++);
}

int main(void) {
    printf("WFI/WFE Power Optimization Strategies\\n\\n");

    printf("Method 1: Busy-wait (worst power)\\n");
    printf("  CPU at 100%%, current draw = active current\\n");
    busy_wait(1000);

    printf("Method 2: WFI (better power)\\n");
    printf("  CPU clock gated, wakes on interrupt\\n");
    printf("  Draw: ~10%% of active current\\n");
    idle_wfi();

    printf("Method 3: WFE (best for polling)\\n");
    printf("  CPU clock gated, wakes on event\\n");
    printf("  No interrupt needed for wakeup\\n");
    idle_wfe();

    printf("\\nIdle statistics:\\n");
    printf("  WFI calls: %u\\n", wfi_count);
    printf("  WFE calls: %u\\n", wfe_count);

    printf("\\nStrategy selection guide:\\n");
    printf("  - WFI when waiting for any interrupt\\n");
    printf("  - WFE when polling a flag/semaphore\\n");
    printf("  - WFI + SLEEPONEXIT for ISR-only apps\\n");
    printf("  - WFE + SEVONPEND for event-driven sync\\n");

    printf("\\nPower savings hierarchy:\\n");
    printf("  Busy-wait:  1x power\\n");
    printf("  WFI:        0.1x power\\n");
    printf("  WFE:        0.1x power (wakes faster)\\n");
    printf("  Deep WFI:   0.01x power\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that compares power optimization strategies using WFI and WFE. Implement three idle patterns: (1) busy-wait loop, (2) WFI waiting for any interrupt, (3) WFE with event polling. Measure and compare the power implications, showing when to use each strategy.

## Theory and Concepts

- Busy-wait: CPU runs at full speed in a loop — worst energy efficiency.
- WFI: CPU clock stops until an interrupt or debug event. Fast wakeup.
- WFE: CPU clock stops until an event (interrupt, SEV, or external event). Even faster wakeup than WFI.
- WFI vs WFE: WFI only wakes on interrupts and debug. WFE also wakes on events without interrupts.
- WFE can be used for spin-locks without interrupts: poll + WFE + SEV pattern.
- DSB before sleep: ensures all pending memory transactions complete before CPU halts.
- ISB after wakeup: ensures the pipeline fetches fresh instructions after sleep.
- SEVONPEND: makes interrupt pending set the event register, allowing WFE to wake on interrupts.

## Real World Application

FreeRTOS idle task uses WFI when no tasks are ready. Linux uses WFI in the idle loop. Event-driven firmware uses WFE + SEV for efficient inter-task synchronization without interrupts.

