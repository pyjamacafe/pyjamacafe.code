+++
date = '2026-07-06T10:27:00+05:30'
draft = false
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
        "DSB          \\n\\t"
        "WFI          \\n\\t"
        "ISB          \\n\\t"
        : : : "memory"
    );
}

void deep_sleep(void) {
    SCB_SCR |= SCB_SCR_SLEEPDEEP;
    __asm volatile(
        "DSB          \\n\\t"
        "WFI          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
}

void sleep_on_exit_enable(void) {
    SCB_SCR |= SCB_SCR_SLEEPONEXIT;
}

void sleep_on_exit_disable(void) {
    SCB_SCR &= ~SCB_SCR_SLEEPONEXIT;
}

int main(void) {
    printf("Cortex-M Sleep Mode Control\\n\\n");

    printf("SCB_SCR default: 0x%08X\\n", SCB_SCR);

    printf("\\nSleep modes:\\n");
    printf("  Normal sleep:  CPU clock gated, fast wakeup\\n");
    printf("  Deep sleep:    Entire chip power-gated, slow wakeup\\n");
    printf("  Sleep-on-exit: MCU sleeps after ISR (no thread mode exec)\\n");

    sleep_on_exit_enable();
    printf("\\nSleep-on-exit enabled\\n");

    sleep_now(0);
    printf("Woke from WFI (event/interrupt)\\n");

    deep_sleep();
    printf("Woke from deep sleep\\n");

    sleep_on_exit_disable();
    printf("Sleep-on-exit disabled\\n");

    printf("\\nSCB_SCR: 0x%08X\\n", SCB_SCR);
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

