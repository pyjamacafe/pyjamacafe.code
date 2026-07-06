+++
date = '2026-07-06T10:57:00+05:30'
draft = false
title = 'Deep Sleep and Power-Down Modes'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 2
initial_code = '''// Configure deep sleep and power-down modes
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR        (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPDEEP  (1UL << 2)

typedef enum {
    SLEEP_MODE,
    DEEP_SLEEP_MODE,
    STANDBY_MODE
} power_mode_t;

void enter_sleep(void) {
    SCB_SCR &= ~SCB_SCR_SLEEPDEEP;
    __asm volatile(
        "DSB          \\n\\t"
        "WFI          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
}

void enter_deep_sleep(void) {
    SCB_SCR |= SCB_SCR_SLEEPDEEP;
    __asm volatile(
        "DSB          \\n\\t"
        "WFI          \\n\\t"
        "ISB          \\n\\t"
    : : : "memory");
}

void print_power_mode(power_mode_t mode) {
    const char *names[] = {
        "Sleep (CPU clock gated, fast wake, ~100uA)",
        "Deep sleep (main regulator off, ~10uA)",
        "Standby (backup domain only, ~1uA)"
    };
    printf("  %s\\n", names[mode]);
}

int main(void) {
    printf("Deep Sleep and Power-Down Modes\\n\\n");

    printf("Cortex-M power modes:\\n");
    print_power_mode(SLEEP_MODE);
    print_power_mode(DEEP_SLEEP_MODE);
    print_power_mode(STANDBY_MODE);

    printf("\\nDeep sleep configuration:\\n");
    printf("  1. Set SLEEPDEEP in SCB_SCR\\n");
    printf("  2. Configure PWR register for regulator mode\\n");
    printf("  3. Execute DSB then WFI/WFE\\n\\n");

    printf("Wakeup sources from deep sleep:\\n");
    printf("  - Any enabled interrupt (if clock still running)\\n");
    printf("  - External interrupts (EXTI)\\n");
    printf("  - RTC alarm / wakeup timer\\n");
    printf("  - NMI (always available)\\n\\n");

    printf("Testing deep sleep entry (will immediately wake):\\n");
    enter_sleep();
    printf("Woke from sleep\\n\\n");

    printf("Entering deep sleep (MCU-dependent):\\n");
    enter_deep_sleep();
    printf("Woke from deep sleep\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that configures the Cortex-M deep sleep mode by setting the SLEEPDEEP bit in SCB_SCR. Compare the three power modes: sleep (CPU clock gated), deep sleep (main regulator off), and standby (backup domain only). List wakeup sources for each mode.

## Theory and Concepts

- Sleep: CPU clock is gated (stop). All peripherals running. Fast wakeup (~4 cycles).
- Deep sleep: SLEEPDEEP bit in SCB_SCR. Core and most peripherals powered down. Wakeup latency ~10μs.
- Standby: highest power savings. Core power removed. Only backup SRAM and RTC active. Wakeup like reset.
- The exact deep sleep behavior is implementation-defined (MCU vendor specific).
- PWR_CR register (STM32) selects voltage regulator mode: normal, low-power, or power-down.
- DSB before WFI ensures all pending memory accesses complete before sleep.
- WFI vs WFE: WFI wakes only on interrupts. WFE can also wake on events without interrupts.
- Wakeup from deep sleep is like exiting reset for the core — code resumes from the interrupt handler.

## Real World Application

Battery-powered devices (smart watches, IoT sensors, medical patches) spend >99% of time in deep sleep or standby. They wake periodically to take measurements, process data, and communicate, then return to sleep.

