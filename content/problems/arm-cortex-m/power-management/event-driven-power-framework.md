+++
date = '2026-07-06T11:00:00+05:30'
draft = false
title = 'Event-Driven Power Management Framework'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 5
initial_code = '''// Build an event-driven power management framework
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR       (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPDEEP   (1UL << 2)
#define SCB_SCR_SEVONPEND   (1UL << 4)

typedef enum {
    PM_ACTIVE,
    PM_IDLE_SLEEP,
    PM_IDLE_DEEPSLEEP,
    PM_STOP,
    PM_STANDBY
} pm_state_t;

typedef struct {
    uint32_t (*pre_sleep)(void *arg);
    void (*post_wake)(void *arg);
    void *arg;
} pm_hook_t;

pm_state_t current_state = PM_ACTIVE;
pm_hook_t pre_sleep_hook = {NULL, NULL, NULL};

void pm_register_hook(pm_hook_t hook) {
    pre_sleep_hook = hook;
}

void pm_transition(pm_state_t new_state) {
    printf("Power transition: %d -> %d\\n", current_state, new_state);

    current_state = new_state;

    if (pre_sleep_hook.pre_sleep) {
        pre_sleep_hook.pre_sleep(pre_sleep_hook.arg);
    }

    switch (new_state) {
        case PM_IDLE_SLEEP:
            SCB_SCR &= ~SCB_SCR_SLEEPDEEP;
            __asm volatile("DSB \\n\\t WFI \\n\\t ISB" ::: "memory");
            break;

        case PM_IDLE_DEEPSLEEP:
            SCB_SCR |= SCB_SCR_SLEEPDEEP;
            __asm volatile("DSB \\n\\t WFI \\n\\t ISB" ::: "memory");
            break;

        case PM_STOP:
        case PM_STANDBY:
            SCB_SCR |= SCB_SCR_SLEEPDEEP;
            __asm volatile("DSB \\n\\t WFI \\n\\t ISB" ::: "memory");
            break;

        default:
            break;
    }

    if (pre_sleep_hook.post_wake) {
        pre_sleep_hook.post_wake(pre_sleep_hook.arg);
    }

    current_state = PM_ACTIVE;
}

uint32_t uart_pre_sleep(void *arg) {
    printf("  Pre-sleep: UART TX complete check\\n");
    return 0;
}

void uart_post_wake(void *arg) {
    printf("  Post-wake: UART clocks restored\\n");
}

int main(void) {
    printf("Event-Driven Power Management Framework\\n\\n");

    pm_hook_t uart_hook = {
        .pre_sleep = uart_pre_sleep,
        .post_wake = uart_post_wake,
        .arg = NULL
    };
    pm_register_hook(uart_hook);

    printf("Transition to idle sleep:\\n");
    pm_transition(PM_IDLE_SLEEP);
    printf("\\n");

    printf("Transition to deep sleep:\\n");
    pm_transition(PM_IDLE_DEEPSLEEP);

    printf("\\nFramework features:\\n");
    printf("  - State machine with pre/post sleep hooks\\n");
    printf("  - Peripheral-specific power callbacks\\n");
    printf("  - Automatic WFI with mode selection\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Build an event-driven power management framework for a Cortex-M system. Implement a state machine with power states (ACTIVE, IDLE_SLEEP, DEEP_SLEEP, STOP, STANDBY). Support pre-sleep and post-wake hooks that allow peripherals to prepare for power transitions (e.g., UART waiting for TX complete before sleep).

## Theory and Concepts

- Power management framework: coordinates transitions between power states across all system components.
- Pre-sleep hooks: peripherals save state, wait for pending operations, disable clocks.
- Post-wake hooks: peripherals restore state, re-enable clocks, reinitialize if needed.
- State machine ensures valid transitions (e.g., standby requires deep sleep capability).
- Hook chain: multiple peripherals registered in priority order.
- Critical section around state transitions to prevent interrupts during mode change.
- SEVONPEND allows WFE to wake on interrupt pending without the interrupt firing.
- The framework can also manage clock scaling (PLL frequency reduction) between active and sleep.

## Real World Application

Complex embedded systems (smartphones, IoT gateways) use power management frameworks like this. FreeRTOS Tickless Idle mode is similar: it calculates the time until the next task, enters the appropriate sleep mode, and sets a wakeup alarm.

===EXPLANATION===

An event-driven power management framework coordinates transitions between active and sleep states in a structured, deterministic way. Without a framework, power management quickly becomes tangled: one module enters sleep while another is still processing, peripherals lose state, and the system wakes up in an inconsistent configuration. A well-designed framework solves this by providing hooks—pre-sleep and post-wake callbacks—that allow every peripheral and subsystem to prepare for and recover from power transitions.

The concept of structured power management emerged in the late 1990s as mobile and embedded devices demanded longer battery life. Advanced Configuration and Power Interface (ACPI) brought this to PCs, while embedded systems developed lighter-weight approaches tailored to microcontrollers. The ARM Cortex-M System Control Block (SCB_SCR) provides the basic sleep controls, but chip vendors like STMicroelectronics, NXP, and Nordic add deep-sleep, stop, and standby modes with their own power control registers. A framework abstracts these hardware details behind a consistent API.

The intuition is simple: imagine a factory that needs to shut down for the night. You would not just flip the main breaker—each department must prepare: save work in progress, complete safety checks, lock doors, and archive data. When power is restored, each area must reinitialize, verify safety, and resume operations. A power management framework does exactly this for firmware. Peripherals register callbacks: the UART module ensures pending transmissions finish before sleep (pre_sleep), then reinitializes the baud rate generator after wake (post_wake). The ADC module saves its configuration registers and restores them.

In professional practice, FreeRTOS Tickless Idle mode is the most widely deployed power management framework in the embedded world. When no tasks are ready to run, the idle task calculates how long the system can sleep before the next timer event, configures a wake-up alarm (typically a low-power timer or RTC), and enters the deepest allowable sleep mode. The framework ensures that any peripheral callback—like flushing a UART TX buffer—executes before the WFI instruction. After wakeup, the first step is restoring the system tick counter (SysTick or dedicated timer), then resuming task scheduling. Zephyr RTOS has a similar power management subsystem with device power management (PM) states.

Picture the framework as a layered architecture: at the top, an application calls `pm_transition(PM_IDLE_DEEPSLEEP)`. The framework checks current state, invokes pre-sleep hooks in priority order (e.g., DMA must complete transfers before UART can finish TX), writes SLEEPDEEP in SCB_SCR, executes DSB + WFI, and the CPU halts. On wakeup (interrupt or event), the ISR runs, the framework invokes post-wake hooks in reverse order, restores clocks, reinstates PLL settings, and returns the state to ACTIVE. The whole sequence is executed atomically within a critical section to prevent race conditions.

Key points: (1) Pre-sleep hooks must be non-blocking or have bounded execution time—sleep latency depends on the slowest hook. (2) Post-wake hooks run with interrupts still disabled; only minimal reinitialization should happen here. (3) The framework should reject invalid transitions (e.g., going from ACTIVE directly to STANDBY without saving state). (4) RTC or LPTIM is the preferred wake-up source for time-based sleep because SysTick is disabled in deep sleep. (5) SEVONPEND (SCB_SCR bit 4) enables WFE to wake on interrupt pending without the interrupt actually firing—useful for avoiding ISR overhead in power-sensitive event loops.

References: FreeRTOS Tickless Idle Mode documentation, Zephyr RTOS Power Management subsystem, ARM AN398 (Cortex-M3 Power Management), STM32 microprocessor PM0214 (Power control), and "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 13 on low-power design.

