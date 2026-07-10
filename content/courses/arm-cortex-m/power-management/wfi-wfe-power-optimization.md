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
        "DSB          \n\\t"
        "WFI          \n\\t"
        "ISB          \n\\t"
    : : : "memory");
    wfi_count++;
}

void idle_wfe(void) {
    __asm volatile(
        "DSB          \n\\t"
        "WFE          \n\\t"
        "ISB          \n\\t"
    : : : "memory");
    wfe_count++;
}

void poll_with_wfe(volatile uint32_t *flag) {
    while (*flag == 0) {
        __asm volatile("SEV" ::: "memory");
        __asm volatile(
            "DSB          \n\\t"
            "WFE          \n\\t"
            "ISB          \n\\t"
        : : : "memory");
    }
}

void busy_wait(uint32_t count) {
    for (volatile uint32_t i = 0; i < count; i++);
}

int main(void) {
    printf("WFI/WFE Power Optimization Strategies\n\n");

    printf("Method 1: Busy-wait (worst power)\n");
    printf("  CPU at 100%%, current draw = active current\n");
    busy_wait(1000);

    printf("Method 2: WFI (better power)\n");
    printf("  CPU clock gated, wakes on interrupt\n");
    printf("  Draw: ~10%% of active current\n");
    idle_wfi();

    printf("Method 3: WFE (best for polling)\n");
    printf("  CPU clock gated, wakes on event\n");
    printf("  No interrupt needed for wakeup\n");
    idle_wfe();

    printf("\nIdle statistics:\n");
    printf("  WFI calls: %u\n", wfi_count);
    printf("  WFE calls: %u\n", wfe_count);

    printf("\nStrategy selection guide:\n");
    printf("  - WFI when waiting for any interrupt\n");
    printf("  - WFE when polling a flag/semaphore\n");
    printf("  - WFI + SLEEPONEXIT for ISR-only apps\n");
    printf("  - WFE + SEVONPEND for event-driven sync\n");

    printf("\nPower savings hierarchy:\n");
    printf("  Busy-wait:  1x power\n");
    printf("  WFI:        0.1x power\n");
    printf("  WFE:        0.1x power (wakes faster)\n");
    printf("  Deep WFI:   0.01x power\n");

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

===EXPLANATION===

WFI (Wait For Interrupt) and WFE (Wait For Event) are the two instruction-level sleep primitives in the ARM architecture. They are the lowest-level power management controls available to the programmer, and understanding when to use each is essential for writing power-efficient embedded software. While they appear similar—both stop the CPU clock until a wakeup condition occurs—their semantics and use cases are fundamentally different.

The ARM architecture has provided WFI and WFE since the ARMv6 architecture (ARM11), and the Cortex-M series refined them. WFI was designed for the classic "idle until something happens" pattern: stop the CPU, wait for any interrupt (or debug event), wake up and handle it. WFE was designed for spin-lock and polling patterns: stop the CPU, wait for an "event" (which can be an interrupt, an SEV instruction from another CPU or peripheral, or an external event signal), wake up and check the condition. The key insight is that WFE can wake without an interrupt—a simple event signal is sufficient.

The intuition hinges on whether you are waiting for an interrupt or waiting for a flag. If you are in a main loop calling `while(1) __WFI();`, you want any interrupt to wake you—WFI is correct. If you are polling a shared variable in a loop like `while(!flag_ready) { __WFE(); }`, you want WFE: another CPU or a DMA controller can send an event (SEV) when the flag is set, waking you without the overhead of interrupt entry/exit. WFE can also be paired with SEVONPEND to convert interrupt pending into an event wakeup, avoiding the interrupt handler entirely.

In professional firmware, the WFI + SLEEPONEXIT combination is ubiquitous in FreeRTOS and other RTOS idle tasks. When the scheduler finds no tasks ready to run, the idle task executes WFI. Any interrupt (SysTick for scheduler ticks, or a peripheral interrupt) wakes the CPU, runs the handler, and the scheduler resumes. WFE is used in multicore AMP (asymmetric multiprocessing) systems for inter-processor communication: one core writes a message to shared memory, executes SEV, and the other core wakes from WFE to process it. Zephyr RTOS uses WFE in its idle loop on Cortex-M for slightly lower wakeup latency than WFI.

Picture the difference in hardware implementation: WFI gates the CPU clock but leaves the NVIC active and watching for interrupt requests. When an interrupt arrives, the NVIC asserts wakeup, the clock restarts, and the CPU processes the interrupt. WFE also gates the clock, but uses a separate "event register" per CPU. An SEV instruction sets the event register; any interrupt pending (if SEVONPEND is set) also sets it; an external event signal (E event bus) also sets it. WFE clears the event register and wakes immediately. If the event register was already set, WFE returns immediately without sleeping—this avoids race conditions in polling loops.

Key points:
1. Always use DSB before WFI/WFE to ensure all memory transactions complete before sleep. Use ISB after wakeup.
2. WFI guarantees wakeup on any unmasked interrupt; WFE guarantees wakeup on any event (interrupt, SEV, or external event signal).
3. WFE is not suitable for deep sleep on all MCUs—some require WFI to enter deep sleep.
4. The SEVONPEND (Send Event on Pending) feature makes WFE wake on interrupt pending without the interrupt firing—useful for power-efficient event loops that do not want ISR overhead.
5. WFE wakes faster than WFI on many implementations because it bypasses the interrupt entry sequence.


References:
1. ARM Architecture Reference Manual ARMv7-M (WFI and WFE sections), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 13, ARM AN321 on power management, and FreeRTOS portable/ARM_CM4F/port.c for the idle task implementation using WFI.
