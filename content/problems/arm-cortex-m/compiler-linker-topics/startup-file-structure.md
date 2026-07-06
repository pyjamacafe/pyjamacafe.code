+++
date = '2026-07-06T18:26:00+05:30'
draft = false
title = 'Startup File Structure'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 19
weight = 4
initial_code = '''#include <stdio.h>

// Weak default handlers — can be overridden
__attribute__((weak)) void NMI_Handler(void)        { while (1); }
__attribute__((weak)) void HardFault_Handler(void)  { while (1); }
__attribute__((weak)) void SVC_Handler(void)        { while (1); }
__attribute__((weak)) void PendSV_Handler(void)     { while (1); }
__attribute__((weak)) void SysTick_Handler(void)    { while (1); }

// Vector table
__attribute__((section(".isr_vector"), used))
void (* const g_pfnVectors[])(void) = {
    (void (*)(void))0x20010000, // Initial SP
    main,                       // Reset handler
    NMI_Handler,
    HardFault_Handler,
    0, 0, 0, 0,                 // Reserved
    SVC_Handler,
    0, 0,                       // Reserved
    PendSV_Handler,
    SysTick_Handler,
    // External interrupts follow...
};

int main(void) {
    printf("Startup file structure demonstrated\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Startup file structure shown'
+++

## Problem Statement

Write a simplified startup file containing the vector table and weak default exception handlers. Show the vector table structure with the initial stack pointer, reset handler, and the system exception handlers (NMI, HardFault, SVC, PendSV, SysTick). Explain that external interrupt handlers follow after SysTick.

## Theory and Concepts

- The startup file (typically `startup_<device>.s` or `startup_<device>.c`) contains the vector table and default handler implementations.
- The vector table must be placed at the base of flash (or the VTOR address) and starts with the initial SP, followed by the reset handler, then all exception and interrupt handlers in order.
- Default handlers are declared `__attribute__((weak))` so that user-defined handlers in application code override them.
- If the user defines `void HardFault_Handler(void)`, their definition replaces the weak default.
- The CMSIS startup file also includes `SystemInit` call before `main()`, and C runtime initialisation.

## Real World Application

Every Cortex-M project needs a startup file — MCU vendors provide startup files in their SDKs (STM32Cube, NXP MCUXpresso, etc.). Understanding the structure is essential for custom vector table layout, bootloaders, and debugging startup crashes.
