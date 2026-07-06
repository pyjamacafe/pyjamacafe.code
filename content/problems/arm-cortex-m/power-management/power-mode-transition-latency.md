+++
date = '2026-07-06T10:59:00+05:30'
draft = false
title = 'Power Mode Transition Latency'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 4
initial_code = '''// Measure power mode transition latency
#include <stdio.h>
#include <stdint.h>

#define DWT_CYCCNT  (*((volatile uint32_t *)0xE0001004))
#define DWT_CONTROL (*((volatile uint32_t *)0xE0001000))
#define SCB_DEMCR   (*((volatile uint32_t *)0xE000EDFC))

#define SCB_SCR     (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPDEEP (1UL << 2)

void dwt_enable(void) {
    SCB_DEMCR |= (1UL << 24);
    DWT_CONTROL |= 1;
    DWT_CYCCNT = 0;
}

uint32_t measure_wfi_latency(void) {
    uint32_t start, end;

    start = DWT_CYCCNT;
    __asm volatile("WFI" ::: "memory");
    end = DWT_CYCCNT;

    return end - start;
}

uint32_t measure_deepsleep_latency(void) {
    uint32_t start, end;

    SCB_SCR |= SCB_SCR_SLEEPDEEP;

    start = DWT_CYCCNT;
    __asm volatile("WFI" ::: "memory");
    end = DWT_CYCCNT;

    SCB_SCR &= ~SCB_SCR_SLEEPDEEP;

    return end - start;
}

int main(void) {
    printf("Power Mode Transition Latency\\n\\n");

    dwt_enable();

    printf("Using DWT cycle counter for measurements\\n\\n");

    printf("Typical latencies:\\n");
    printf("  Sleep -> Active:    %u cycles\\n", measure_wfi_latency());
    printf("  DeepSleep -> Active (may be larger on real HW)\\n");

    printf("\\nExpected latencies (typical MCU):\\n");
    printf("  Sleep wakeup:       2-12 cycles (CPU clock on)\\n");
    printf("  Deep sleep wakeup:  5-100 us (regulator ramp)\\n");
    printf("  Standby wakeup:     100-1000 us (like reset)\\n\\n");

    printf("Factors affecting latency:\\n");
    printf("  - Flash wakeup time (if flash powered down)\\n");
    printf("  - PLL relock time (if PLL was disabled)\\n");
    printf("  - Regulator startup time\\n");
    printf("  - External oscillator startup\\n\\n");

    printf("Optimizing wakeup:\\n");
    printf("  - Keep memories powered in sleep\\n");
    printf("  - Use low-power oscillator for fast restart\\n");
    printf("  - Configure wakeup interrupt with highest priority\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that measures the transition latency between sleep modes and active mode using the DWT cycle counter. Measure the cycles required to wake from WFI sleep and from deep sleep. Present typical latency values and discuss factors that affect wakeup time.

## Theory and Concepts

- Sleep-to-active latency: typically 2-12 CPU cycles. The CPU clock is still running (only CPU gated).
- Deep-sleep-to-active: depends on the regulator and oscillator startup. Typically 5-100 μs.
- Standby-to-active: like a reset, the whole boot sequence runs. 100-1000 μs.
- Flash memory may need re-initialization after deep sleep (flash wakeup time).
- PLL may need to re-lock if the system clock source was disabled.
- The NVIC takes 12 cycles (M0) to 15 cycles (M3) to enter an exception handler after wakeup.
- Total wakeup latency = sleep exit + interrupt entry + handler execution.
- Some MCUs provide a low-power oscillator that starts faster than the main oscillator.

## Real World Application

Real-time systems must guarantee maximum wakeup latency for time-critical events. A motor controller waking from deep sleep must respond within microseconds. The choice of sleep mode depends on the acceptable wakeup latency vs. power savings.

