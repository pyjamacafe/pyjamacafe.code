+++
date = '2026-07-06T18:04:00+05:30'
draft = true
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
    printf("Waiting...\n");
    delay_ms(1000);
    printf("Done!\n");
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

===EXPLANATION===

SysTick is a simple 24‑bit down‑counter that ARM included in every Cortex‑M processor specifically to provide a uniform system tick for RTOSes. Before SysTick, each microcontroller vendor implemented its own timer peripheral for this purpose, fragmenting RTOS ports. SysTick standardised the time base: any Cortex‑M RTOS can use the same driver code across STM32, NXP, Microchip, and Silicon Labs parts.

The counter decrements on each processor clock cycle (or an external reference clock, selectable via CLKSOURCE). When it reaches zero, it reloads from the RVR register and optionally asserts an interrupt. The reload value determines the tick period: `reload = (CPU_Hz / Tick_Hz) - 1`. A 48 MHz CPU ticking at 1 kHz gives reload = 47999. The 24‑bit counter limits the maximum period — at 48 MHz, the longest tick is about 350 ms; for slower ticks (e.g., 10 Hz) you must use a lower clock source or chain multiple ticks.

In production, SysTick's interrupt handler is the RTOS's scheduler heartbeat. FreeRTOS's `xPortSysTickHandler` increments the tick count, checks for timed‑out delays, and unblocks waiting tasks. The handler typically triggers a PendSV to request a context switch rather than switching directly — this avoids scheduling logic inside the tick handler and defers the switch to PendSV's lowest‑priority context.

Visualise a metronome: SysTick is the metronome arm ticking at a precise interval, driving the tempo of the entire software orchestra. The conductor (RTOS scheduler) uses each tick to decide if a new piece (task) should start playing.

Key points:
1. SysTick is a 24‑bit timer — the reload value must not exceed 0x00FFFFFF.
2. The COUNTFLAG bit in CSR lets you poll without an interrupt.
3. The TENMS calibration value in CALIB register is provided by the silicon vendor for 10 ms timing.
4. Do not use SysTick for precise hardware timing — use a dedicated timer instead.
5. When debugging, SysTick keeps running; you can pause it via the debugger's SysTick control.


ARM's *Cortex‑M3 Devices Generic User Guide* Chapter 4 and the *ARMv7‑M Architecture Reference Manual* define SysTick. The CMSIS‑Core API (`SysTick_Config()`) provides a simple initialisation wrapper used in virtually all Cortex‑M projects.
