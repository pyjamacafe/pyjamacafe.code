+++
date = '2026-07-06T10:27:00+05:30'
draft = true
title = 'Sleep Modes and WFI/WFE Instructions'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 7
weight = 2
initial_code = '''// Implement sleep modes using WFI and WFE
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR       (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPONEXIT (1UL << 1)
#define SCB_SCR_SLEEPDEEP   (1UL << 2)

void sleep_now(uint32_t use_wfe) {
    __asm volatile(
        "DSB          \n\\t"
        "WFI          \n\\t"
        "ISB          \n\\t"
        : : : "memory"
    );
}

void deep_sleep(void) {
    SCB_SCR |= SCB_SCR_SLEEPDEEP;
    __asm volatile(
        "DSB          \n\\t"
        "WFI          \n\\t"
        "ISB          \n\\t"
    : : : "memory");
}

void sleep_on_exit_enable(void) {
    SCB_SCR |= SCB_SCR_SLEEPONEXIT;
}

void sleep_on_exit_disable(void) {
    SCB_SCR &= ~SCB_SCR_SLEEPONEXIT;
}

int main(void) {
    printf("Cortex-M Sleep Mode Control\n\n");

    printf("SCB_SCR default: 0x%08X\n", SCB_SCR);

    printf("\nSleep modes:\n");
    printf("  Normal sleep:  CPU clock gated, fast wakeup\n");
    printf("  Deep sleep:    Entire chip power-gated, slow wakeup\n");
    printf("  Sleep-on-exit: MCU sleeps after ISR (no thread mode exec)\n");

    sleep_on_exit_enable();
    printf("\nSleep-on-exit enabled\n");

    sleep_now(0);
    printf("Woke from WFI (event/interrupt)\n");

    deep_sleep();
    printf("Woke from deep sleep\n");

    sleep_on_exit_disable();
    printf("Sleep-on-exit disabled\n");

    printf("\nSCB_SCR: 0x%08X\n", SCB_SCR);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates all three sleep modes of the Cortex-M processor: normal sleep (WFI/WFE), deep sleep (SLEEPDEEP), and sleep-on-exit. Configure the SCB_SCR register appropriately before each sleep instruction and wake up using either interrupts or events.

## Theory and Concepts

- WFI (Wait For Interrupt): suspends execution until any interrupt or debug event occurs.
- WFE (Wait For Event): suspends execution until an event occurs (interrupt, SEV, or event register set).
- SCB_SCR SLEEPDEEP bit selects: 0 = normal sleep, 1 = deep sleep.
- SCB_SCR SLEEPONEXIT bit: when set, the processor sleeps on exception return instead of returning to the interrupted thread.
- SLEEPONEXIT is useful for interrupt-driven applications that never need the main loop.
- WFE can wake on events without an interrupt (useful for spin-locks and polling loops).
- DSB before WFI ensures all memory accesses complete before sleep.
- System clock may be stopped in deep sleep (implementation-defined).

## Real World Application

Battery-powered IoT devices spend most of their time in sleep mode to conserve power. A sensor node wakes via WFI on a timer interrupt, reads a sensor, transmits data, and returns to sleep. SLEEPONEXIT mode eliminates unnecessary thread-mode execution.

===EXPLANATION===

Power management is the defining challenge of embedded systems in the IoT era, and the Cortex-M WFI (Wait For Interrupt) and WFE (Wait For Event) instructions are the primary mechanisms for reducing energy consumption. These instructions gate the processor clock, dropping current consumption from milliamps to microamps while preserving all register and memory state.

The historical evolution tells the story. Early microcontrollers had no sleep instruction — the only way to save power was to reduce the clock frequency. ARM introduced the WFI instruction with ARMv6-M and ARMv7-M, and it has been refined ever since. The Cortex-M33 in ARMv8-M adds additional sleep depth levels. The core mechanism remains the same: a WFI instruction suspends instruction execution until any interrupt or debug event occurs.

The intuition behind WFI is simple: if no code needs to run, stop the clock. The challenge is knowing when code does need to run. The NVIC is the wake-up alarm — it monitors all interrupt sources even while the processor sleeps. When an enabled interrupt becomes pending, the NVIC asserts a wake-up signal, the clock starts, the processor services the interrupt, and optionally returns to sleep.

SLEEPONEXIT is a particularly elegant optimization. In interrupt-driven systems where the main loop only sets up peripherals and then sleeps, the main loop executes once at boot and never again. With SLEEPONEXIT (SCR bit 1), the processor automatically enters sleep mode every time it returns from an interrupt handler, eliminating the power wasted running back to the main loop and hitting WFI again. This is the canonical pattern for event-driven IoT sensor nodes.

WFE adds an extra dimension: it can wake on events without generating an interrupt. The event register is a per-processor latch that, when set, causes WFE to return immediately without sleeping. This enables ultra-low-power polling loops: instead of busy-waiting on a flag, the processor executes WFE in a loop. If the flag is already set, the event register catches it and WFE returns instantly. If not, the processor sleeps until an event arrives.

In professional battery-powered designs, the power budget is everything. A BLE sensor node might spend 99.9% of its time in sleep mode, waking for 1 millisecond every second to take a measurement and transmit it. The sleep current might be 1 microamp, the active current 5 milliamps. The average power is dominated by the sleep current, making every microamp saved in sleep mode critical.

Visualize the processor as a librarian in a quiet library. WFI is the librarian sitting still, waiting for someone to ask a question (an interrupt). WFE is the librarian dozing but with one eye open for the doorbell (an event). SLEEPONEXIT is the librarian who, after answering a question, immediately sits back down without even standing up.

Key points: DSB before WFI ensures memory operations complete; SEVONPEND makes interrupt pending set the event register; deep sleep power domains are implementation-defined; SLEEPDEEP might stop system clocks or disable regulators; always configure wake-up sources before sleeping.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.3.1–B1.3.3), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 14 — Power Management), ARM Infocenter DDI0403E.

