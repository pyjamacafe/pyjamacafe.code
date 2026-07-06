+++
date = '2026-07-06T10:56:00+05:30'
draft = false
title = 'Sleep-on-Exit Mode Configuration'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 1
initial_code = '''// Configure sleep-on-exit for interrupt-driven applications
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR       (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPONEXIT (1UL << 1)
#define SCB_SCR_SLEEPDEEP   (1UL << 2)

volatile uint32_t event_counter = 0;

void SysTick_Handler(void) {
    event_counter++;
}

void enable_sleep_on_exit(void) {
    SCB_SCR |= SCB_SCR_SLEEPONEXIT;
    printf("Sleep-on-exit enabled\\n");
}

void disable_sleep_on_exit(void) {
    SCB_SCR &= ~SCB_SCR_SLEEPONEXIT;
    printf("Sleep-on-exit disabled\\n");
}

void setup_systick(void) {
    (*((volatile uint32_t *)0xE000E010 + 0x04)) = 1000000 - 1;
    (*((volatile uint32_t *)0xE000E010 + 0x08)) = 0;
    (*((volatile uint32_t *)0xE000E010 + 0x00)) = 7;
}

int main(void) {
    printf("Sleep-on-Exit Mode\\n\\n");

    printf("Normal mode: main() runs after each interrupt\\n");
    printf("Sleep-on-exit: CPU sleeps after ISR, skips main()\\n\\n");

    enable_sleep_on_exit();

    printf("SCB_SCR: 0x%08X\\n", SCB_SCR);

    printf("\\nBehavior:\\n");
    printf("  Interrupt occurs -> Handler executes\\n");
    printf("  -> Sleep-on-exit: CPU sleeps immediately\\n");
    printf("  (main loop never runs between interrupts)\\n\\n");

    printf("Power savings:\\n");
    printf("  Thread mode execution eliminated\\n");
    printf("  Only handler mode + sleep mode\\n");
    printf("  Ideal for purely interrupt-driven designs\\n\\n");

    disable_sleep_on_exit();

    printf("After disable: SCB_SCR = 0x%08X\\n", SCB_SCR);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that configures the Sleep-on-Exit mode for an interrupt-driven application. When Sleep-on-Exit is enabled (SCB_SCR bit 1), the processor enters sleep mode immediately after returning from an exception handler, without executing the main thread. This saves power in systems that are purely interrupt-driven.

## Theory and Concepts

- SLEEPONEXIT (SCB_SCR bit 1): when set, the processor sleeps on exception return if no other exceptions are pending.
- In normal operation: thread code executes between interrupts. In sleep-on-exit: thread code never executes.
- This is useful for: interrupt-only applications where the main loop is not needed.
- The main loop typically just goes to WFI; sleep-on-exit achieves the same with lower latency.
- Sleep mode (not deep sleep) is entered, so wakeup is fast (a few cycles).
- After SysTick or peripheral interrupt, the handler runs, then the CPU sleeps again.
- External interrupts (NMI, pin interrupts, etc.) can still wake the CPU.
- Combined with deep sleep and SLEEPDEEP for additional power savings.

## Real World Application

Bare-metal sensor nodes: the device sleeps, wakes on a timer interrupt, reads sensors, processes data, transmits, then sleeps again. Sleep-on-exit eliminates unnecessary thread-mode execution, reducing power consumption.

