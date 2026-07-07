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

===EXPLANATION===

Deep sleep and standby modes are where the greatest power savings in embedded systems are realized. While normal sleep (WFI) reduces current to perhaps 10% of active, deep sleep drops it to 1% or less, and standby approaches leakage-only levels. These modes achieve such dramatic savings by physically powering down major blocks of the microcontroller—the CPU core, memories, peripherals, and even the main voltage regulator.

The evolution of low-power modes tracks the history of battery-operated electronics. Early microcontrollers had only a single "halt" or "idle" mode. As portable devices proliferated, designers demanded more granularity. ARM's SLEEPDEEP mechanism (SCB_SCR bit 2) provides a generic signal to the chip's power management unit (PMU), and each silicon vendor implements the actual power-down behavior. STMicroelectronics offers Stop, Standby, and Shutdown modes on STM32. Nordic nRF52 has System ON and System OFF. NXP i.MX RT has Suspend and Deep Sleep. All share the same Cortex-M SLEEPDEEP trigger.

The intuition is that different power domains can be independently switched off. In normal sleep, only the CPU clock gate closes—the core's registers and memory retain state. In deep sleep, the main voltage regulator is turned off or put in low-power mode. The CPU core loses its state (registers must be saved or reinitialized), but SRAM may be retained in a low-leakage state. In standby, the entire core power domain is shut down, and only a tiny backup domain (RTC, backup registers, tamper detection) remains powered. Each deeper level trades retained state for lower current.

In professional practice, deep sleep is the cornerstone of battery-powered IoT product firmware. A BLE sensor tag from Nordic Semiconductor spends most of its life in System OFF (standby) at 0.7 µA, waking every few seconds to take a sensor reading and transmit a Bluetooth advertisement packet. The wakeup sequence must reinitialize the CPU, restore context, configure the radio, send the packet, and return to sleep—all within a few milliseconds. Texas Instruments' SimpleLink SDK and ARM mbed OS both provide power management APIs that abstract these chip-specific deep sleep entry and exit sequences.

Visualize the power domains as concentric circles. The outermost circle is the backup domain (RTC, tamper, a few GPIO wakeup pins)—always powered. Inside is the standby domain (CPU, SRAM, most peripherals). Inside that is the active domain (PLL, main regulator, flash). Deep sleep turns off the active domain; standby turns off the standby domain too. Waking from deep sleep requires the PMU to ramp the regulator, enable the oscillator, and release the CPU reset. The CPU then runs the startup code—but can check a "wakeup flag" to skip full initialization and resume quickly.

Key points: (1) SLEEPDEEP behavior is implementation-defined—always consult the vendor reference manual for exact current consumption and wakeup sources. (2) In deep sleep, the SysTick timer stops; use RTC or LPTIM for timed wakeup. (3) Wakeup from deep sleep is similar to reset: the CPU reboots, but backup registers and some SRAM are retained. (4) GPIO states during deep sleep can be configured (pull-up, analog, floating) to avoid extra leakage. (5) Debug connections (SWD) may prevent deep sleep entry on some MCUs—the debugger holds the core in a powered state.

References: "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 13, STM32F4 Reference Manual (RM0090, Power Control section), Nordic nRF52 Reference Manual, ARM AN321, and application notes on "Ultra-Low Power Design" from NXP and Microchip.

