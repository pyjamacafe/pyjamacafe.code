+++
date = '2026-07-06T10:56:00+05:30'
draft = false
title = 'Sleep-on-Exit Mode Configuration'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 13
weight = 1
initial_code = '''// Configure sleep-on-exit for interrupt-driven applications
#include <stdio.h>
#include <stdint.h>

#define SCB_SCR       (*((volatile uint32_t *)0xE000ED10))
#define SCB_SCR_SLEEPONEXIT (1UL << 1)
#define SCB_SCR_SLEEPDEEP   (1UL << 2)

volatile uint32_t event_counter = 0;

void SysTick_Handler(void) {
    event_counter++;
}

void enable_sleep_on_exit(void) {
    SCB_SCR |= SCB_SCR_SLEEPONEXIT;
    printf("Sleep-on-exit enabled\\n");
}

void disable_sleep_on_exit(void) {
    SCB_SCR &= ~SCB_SCR_SLEEPONEXIT;
    printf("Sleep-on-exit disabled\\n");
}

void setup_systick(void) {
    (*((volatile uint32_t *)0xE000E010 + 0x04)) = 1000000 - 1;
    (*((volatile uint32_t *)0xE000E010 + 0x08)) = 0;
    (*((volatile uint32_t *)0xE000E010 + 0x00)) = 7;
}

int main(void) {
    printf("Sleep-on-Exit Mode\\n\\n");

    printf("Normal mode: main() runs after each interrupt\\n");
    printf("Sleep-on-exit: CPU sleeps after ISR, skips main()\\n\\n");

    enable_sleep_on_exit();

    printf("SCB_SCR: 0x%08X\\n", SCB_SCR);

    printf("\\nBehavior:\\n");
    printf("  Interrupt occurs -> Handler executes\\n");
    printf("  -> Sleep-on-exit: CPU sleeps immediately\\n");
    printf("  (main loop never runs between interrupts)\\n\\n");

    printf("Power savings:\\n");
    printf("  Thread mode execution eliminated\\n");
    printf("  Only handler mode + sleep mode\\n");
    printf("  Ideal for purely interrupt-driven designs\\n\\n");

    disable_sleep_on_exit();

    printf("After disable: SCB_SCR = 0x%08X\\n", SCB_SCR);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that configures the Sleep-on-Exit mode for an interrupt-driven application. When Sleep-on-Exit is enabled (SCB_SCR bit 1), the processor enters sleep mode immediately after returning from an exception handler, without executing the main thread. This saves power in systems that are purely interrupt-driven.

## Theory and Concepts

- SLEEPONEXIT (SCB_SCR bit 1): when set, the processor sleeps on exception return if no other exceptions are pending.
- In normal operation: thread code executes between interrupts. In sleep-on-exit: thread code never executes.
- This is useful for: interrupt-only applications where the main loop is not needed.
- The main loop typically just goes to WFI; sleep-on-exit achieves the same with lower latency.
- Sleep mode (not deep sleep) is entered, so wakeup is fast (a few cycles).
- After SysTick or peripheral interrupt, the handler runs, then the CPU sleeps again.
- External interrupts (NMI, pin interrupts, etc.) can still wake the CPU.
- Combined with deep sleep and SLEEPDEEP for additional power savings.

## Real World Application

Bare-metal sensor nodes: the device sleeps, wakes on a timer interrupt, reads sensors, processes data, transmits, then sleeps again. Sleep-on-exit eliminates unnecessary thread-mode execution, reducing power consumption.

===EXPLANATION===

Sleep-on-Exit is a Cortex-M processor mode that automatically puts the CPU to sleep when returning from an exception handler, without ever executing the main thread between interrupts. It is one of the simplest and most effective power-saving features in the Cortex-M architecture, ideal for purely interrupt-driven designs where the main loop does nothing but wait.

The feature was introduced with the ARMv7-M architecture (Cortex-M3) as counterpart to the standard WFI-based sleep pattern. In a traditional interrupt-driven system, the main loop typically looks like this: `while(1) { __WFI(); }`. The CPU wakes on interrupt, runs the handler, returns to main, immediately executes WFI, and sleeps again. Sleep-on-Exit eliminates the middle step: after the handler completes, the processor goes directly back to sleep without returning to thread mode. This saves the few hundred cycles of WFI execution and reduces the switch from handler mode to thread mode and back.

The intuition is about minimizing unnecessary work. If the main thread has nothing to do between interrupts—no background processing, no idle computation, no polling—then why waste energy running it at all? Sleep-on-Exit treats the processor as a pure interrupt engine: it sleeps until an event occurs, handles it, and sleeps again. The main function effectively becomes a configuration routine that sets up interrupts and enables Sleep-on-Exit, then never runs again.

In professional use, Sleep-on-Exit is a common pattern in bare-metal sensor firmware. A temperature sensor node might: configure an RTC alarm to fire every 60 seconds, enable Sleep-on-Exit, then go to sleep. On each alarm, the RTC handler reads the sensor, stores the value in a buffer, and increments a counter. After several samples, a UART interrupt handler transmits the batch. The main thread never executes between these events. Some RTOS tickless idle implementations also leverage Sleep-on-Exit internally to minimize the overhead of returning to the idle task.

Visualize a timeline: without Sleep-on-Exit, the sequence is: SLEEP -> WAKE (interrupt) -> HANDLER -> RETURN TO MAIN -> WFI -> SLEEP. With Sleep-on-Exit: SLEEP -> WAKE -> HANDLER -> SLEEP. The handler's exception return (BX LR with EXC_RETURN) checks bit 1 of SCB_SCR; if SLEEPONEXIT is set, the processor enters sleep immediately after the unstacking completes—before fetching the next instruction from the thread.

Key points: (1) SLEEPONEXIT is a single bit in SCB_SCR (bit 1). Set it before entering the main loop or after initialization. (2) This mode is only useful when the main thread has no work to do; if any polling or background processing is needed, do not enable it. (3) The processor enters sleep (not deep sleep) by default; combine with SLEEPDEEP for additional power savings. (4) An interrupt that occurs while the CPU is already handling an exception will keep the CPU awake—sleep only happens when the nested return completes. (5) Any interrupt can wake the CPU, including SysTick, GPIO EXTI, UART RX, etc. Sleep-on-Exit does not restrict wakeup sources.

References: ARM Cortex-M3/M4/M7 Technical Reference Manual (SCB section), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" Chapter 13, STM32 Reference Manual (Power Control section), and ARM AN321 (Power Management for Cortex-M).

