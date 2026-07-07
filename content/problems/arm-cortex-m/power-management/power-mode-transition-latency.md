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

===EXPLANATION===

Power mode transition latency is the time penalty for entering and exiting a low-power state. It is the fundamental trade-off in embedded power management: the deeper you sleep, the more power you save, but the longer you take to wake up. A system that sleeps too deeply may miss real-time deadlines; one that sleeps too shallowly wastes battery. Measuring and understanding these latencies is essential for making correct power management decisions.

The latency hierarchy has been refined across decades of processor design. In the original ARM7TDMI days, the only sleep mode was a simple WFI that stopped the CPU clock—wakeup took just 4–6 cycles. Modern Cortex-M devices offer graduated sleep states: normal sleep (CPU clock gated, ~2–12 cycle wakeup), deep sleep (main regulator powered down, ~5–100 µs wakeup), and standby (core power removed entirely, ~100–1000 µs, essentially a full boot sequence). Each jump in depth adds one or two orders of magnitude to wakeup time while reducing power by a similar factor.

The intuition is about what must be restarted. In normal sleep, the CPU clock stops but the PLL and oscillators keep running—flip the clock gate back on and you are running in a handful of cycles. In deep sleep, the main voltage regulator turns off; the CPU must wait for the regulator to ramp back up to a stable voltage before clocks can restart. This ramp time dominates deep sleep latency (typically 10–50 µs). In standby, the entire chip resets: the boot ROM runs, the PLL relocks, flash memory reinitializes, and the startup code executes—a process that takes hundreds of microseconds to a few milliseconds.

Professionally, wakeup latency is a critical specification in real-time systems. A BLDC motor controller must respond to a rotor position sensor within microseconds; if the microcontroller is in deep sleep, it may miss a commutation event. The engineer selects the sleep mode that meets the worst-case wakeup time for the application's fastest event. Automotive CAN controllers specify maximum bus recovery times—deep sleep may not be permissible. Medical devices (infusion pumps, ventilators) require worst-case response time guarantees verified during certification.

Picture the wakeup timeline as a waterfall of stages. At time T0, the interrupt arrives. For sleep: T0+2 cycles is clock stable, T0+12 cycles is first instruction fetch (NVIC entry latency). For deep sleep: T0+0.5 µs for voltage regulator ramp, T0+5 µs for oscillator startup, T0+12 cycles for NVIC. For standby: T0+100 µs for boot ROM, T0+200 µs for PLL lock, T0+300 µs for flash initialization, T0+500 µs for C runtime startup, then the ISR. The DWT cycle counter can measure these intervals precisely by reading CYCCNT before WFI and after wakeup—though in deep sleep the counter itself may stop, requiring a different measurement approach (e.g., an external timer).

Key points: (1) NVIC entry latency adds 12–15 cycles to wakeup on Cortex-M0/M3/M4 respectively. (2) Flash memory wakeup time can dominate deep sleep latency if the flash was powered down; keeping flash in low-power retention mode reduces this. (3) PLL relock time is typically 50–200 µs; if the CPU must respond faster, keep the PLL running. (4) The DWT cycle counter stops in deep sleep on most MCUs, so cycle-counting across deep sleep is not possible without an external counter or RTC. (5) Wakeup source priority matters—the highest priority interrupt wakes the CPU and its handler executes before lower priority handlers.

References: "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 13 (low-power), STM32 RM (Reference Manual) sections on power control, ARM AN321 (Power Management for Cortex-M), and application notes from NXP and Microchip on wakeup time measurement.

