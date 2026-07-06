+++
date = '2026-07-06T18:04:00+05:30'
draft = false
title = 'SysTick as RTOS Time Base'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 16
weight = 2
initial_code = '''#include <stdio.h>

#define SYSTICK_CSR   (*(volatile unsigned int *)0xE000E010)
#define SYSTICK_RVR   (*(volatile unsigned int *)0xE000E014)
#define SYSTICK_CVR   (*(volatile unsigned int *)0xE000E018)

volatile unsigned int system_tick = 0;

void SysTick_Handler(void) {
    system_tick++;
}

void systick_init(unsigned int tick_hz, unsigned int cpu_hz) {
    unsigned int reload = cpu_hz / tick_hz - 1;
    SYSTICK_RVR = reload;
    SYSTICK_CVR = 0;
    // Enable SysTick with processor clock, enable interrupt
    SYSTICK_CSR = 0x07;
}

void delay_ms(unsigned int ms) {
    unsigned int target = system_tick + ms;
    while (system_tick < target);
}

int main(void) {
    systick_init(1000, 48000000);  // 1 kHz tick at 48 MHz
    printf("Waiting...\\n");
    delay_ms(1000);
    printf("Done!\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'SysTick configured and delay working'
+++

## Problem Statement

Configure the SysTick timer to generate a periodic 1 ms interrupt. Implement a simple `delay_ms` function that blocks until the specified number of ticks has elapsed. This forms the time base for an RTOS tick and for software timers.

## Theory and Concepts

- SysTick is a 24-bit down-counter with a reload register, current value register, and control/status register.
- Reload value = (CPU frequency / tick frequency) − 1. For 48 MHz CPU and 1 kHz tick, reload = 47999.
- Bit 0 (ENABLE) starts the timer; bit 1 (TICKINT) enables the interrupt; bit 2 (CLKSOURCE) selects processor clock vs external.
- The interrupt handler increments a global tick counter used for delays and timeouts.
- SysTick is intended by ARM to provide a system tick for RTOSes and is present in all Cortex-M processors.

## Real World Application

SysTick is the standard time base for all ARM Cortex-M RTOSes — FreeRTOS configures SysTick for its tick interrupt, and most application frameworks use it for millisecond delays, timeouts, and software timers.
