+++
date = '2026-07-06T10:26:00+05:30'
draft = false
title = 'SysTick Timer Configuration'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 7
weight = 1
initial_code = '''// Configure and use the SysTick timer
#include <stdio.h>
#include <stdint.h>

#define SYSTICK_BASE  0xE000E010
#define STK_CSR       (*((volatile uint32_t *)(SYSTICK_BASE + 0x00)))
#define STK_RVR       (*((volatile uint32_t *)(SYSTICK_BASE + 0x04)))
#define STK_CVR       (*((volatile uint32_t *)(SYSTICK_BASE + 0x08)))
#define STK_CALIB     (*((volatile uint32_t *)(SYSTICK_BASE + 0x0C)))

#define STK_CSR_ENABLE    (1UL << 0)
#define STK_CSR_TICKINT   (1UL << 1)
#define STK_CSR_CLKSOURCE (1UL << 2)
#define STK_CSR_COUNTFLAG (1UL << 16)

volatile uint32_t systick_ticks = 0;

void SysTick_Handler(void) {
    systick_ticks++;
}

void systick_init(uint32_t reload_value, uint32_t use_processor_clock) {
    STK_RVR = reload_value & 0x00FFFFFF;
    STK_CVR = 0;

    uint32_t csr = STK_CSR_ENABLE | STK_CSR_TICKINT;
    if (use_processor_clock) {
        csr |= STK_CSR_CLKSOURCE;
    }
    STK_CSR = csr;
}

uint32_t systick_get_milliseconds(void) {
    return systick_ticks;
}

int main(void) {
    uint32_t cpu_freq = 100000000;
    uint32_t reload = cpu_freq / 1000 - 1;

    systick_init(reload, 1);

    printf("SysTick initialized: reload=%u, freq=%u Hz\\n", reload, cpu_freq);
    printf("Calibration value: 0x%08X\\n", STK_CALIB);
    printf("STK_CSR: 0x%08X\\n", STK_CSR);

    for (volatile int i = 0; i < 100000; i++);

    printf("Elapsed ms (approx): %u\\n", systick_get_milliseconds());

    STK_CSR = 0;
    printf("SysTick disabled\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program to configure the SysTick timer as a periodic interrupt source. Set the reload value to generate 1 ms interrupts (assuming a 100 MHz CPU clock), enable the interrupt, and implement a handler that increments a tick counter. Read the calibration value from STK_CALIB and display the timer configuration.

## Theory and Concepts

- SysTick is a 24-bit down-counter with auto-reload, part of the System Control Space (SCS).
- STK_CSR: ENABLE[0], TICKINT[1], CLKSOURCE[2], COUNTFLAG[16].
- STK_RVR: reload value (24-bit). Counter counts down from this value to 0, then reloads.
- STK_CVR: current counter value. Reading it returns the current count. Writing clears it.
- STK_CALIB: provides a calibration value for 10 ms or 1 ms (implementation-specific).
- CLKSOURCE selects the clock source: processor clock or external reference clock.
- COUNTFLAG is set to 1 when the counter reaches 0. Cleared on read of CSR or write to CVR.
- The SysTick handler runs at the exception priority defined in SHPR3.

## Real World Application

SysTick is the most common time-base source in Cortex-M systems. RTOSes use SysTick for time-slicing and delay functions. Bare-metal firmware uses it for timeout tracking, debouncing, and periodic polling.

