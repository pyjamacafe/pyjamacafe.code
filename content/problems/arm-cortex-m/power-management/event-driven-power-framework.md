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

