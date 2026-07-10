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

    printf("SysTick initialized: reload=%u, freq=%u Hz\n", reload, cpu_freq);
    printf("Calibration value: 0x%08X\n", STK_CALIB);
    printf("STK_CSR: 0x%08X\n", STK_CSR);

    for (volatile int i = 0; i < 100000; i++);

    printf("Elapsed ms (approx): %u\n", systick_get_milliseconds());

    STK_CSR = 0;
    printf("SysTick disabled\n");

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

===EXPLANATION===

The SysTick timer is a simple 24-bit down-counter with auto-reload, integrated into every Cortex-M processor. Despite its humble specification, it is arguably the most important peripheral in the entire system — it provides the heartbeat for every RTOS and the time base for most bare-metal firmware.

The historical motivation for SysTick was RTOS standardization. Before SysTick, every RTOS had to use a chip-specific timer to generate its tick interrupt. This made porting between microcontrollers cumbersome — the timer initialization code had to be rewritten for every target. ARM solved this by embedding a standardized timer into the CPU core itself. FreeRTOS, RTX, ThreadX, Mbed OS, and virtually every other Cortex-M RTOS rely on SysTick as the tick source.

The intuition behind SysTick is straightforward: it is a 24-bit counter that counts down from a reload value to zero, generates an interrupt, reloads, and repeats. If the processor clock is 100 MHz and you set the reload to 99,999, you get exactly 1,000 interrupts per second — one every millisecond. This 1 ms tick is the standard time base for most embedded systems.

The CLKSOURCE bit selects between the processor clock and an external reference clock. Using the processor clock gives precise, deterministic timing as long as the clock frequency is constant. Using the external reference (typically divided from the main oscillator) provides a tick that continues even in deep sleep modes where the processor clock is stopped.

The COUNTFLAG bit is a useful status indicator. It is set to 1 when the counter reaches zero, and cleared when STK_CSR is read or STK_CVR is written. This allows polling-based delay loops that check COUNTFLAG without enabling the interrupt — useful for short, blocking delays.

In professional RTOS implementations, the SysTick handler performs three critical functions: incrementing the tick count (used for timeouts and delays), decrementing task delay counters, and triggering the scheduler if a time-slice has expired. The entire OS time model rests on the SysTick interrupt firing at precise, regular intervals.

The STK_CALIB register provides a calibration value specific to the silicon implementation. ARM specifies that this value should produce either a 10 ms or 1 ms tick. Reading it allows the software to configure SysTick without knowing the exact clock frequency — though in practice, most firmware computes the reload value from a known clock frequency.

Visualize SysTick as a grandfather clock's pendulum. Each swing triggers the tick mechanism. The pendulum length (reload value) determines the interval. The count of swings (systick_ticks) tracks the passage of time. Without the pendulum, the clockwork of the RTOS stops.

Key points: 24-bit counter, maximum reload 0xFFFFFF; reload value = (clock_freq / desired_freq) - 1; CLKSOURCE = 1 uses processor clock; default SysTick priority is implementation-defined (set via SHPR3); COUNTFLAG is cleared by reading CSR or writing CVR; writing to CVR clears the counter and COUNTFLAG.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B3.3 — SysTick), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 13 — SysTick Timer), ARM Infocenter DDI0403E.

