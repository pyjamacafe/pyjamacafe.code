+++
date = '2026-07-06T18:09:00+05:30'
draft = false
title = 'SystemInit and Early Configuration'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 15
weight = 2
initial_code = '''#include <stdio.h>

#define SCB_VTOR     (*(volatile unsigned int *)0xE000ED08)
#define SCB_CPACR    (*(volatile unsigned int *)0xE000ED88)

void SystemInit(void) {
    // Set vector table offset register
    SCB_VTOR = 0x00000000;  // Vector table at start of flash

    // Enable FPU if present (CPACR bits 20-23)
    SCB_CPACR |= (0xF << 20);
    __asm("DSB");
    __asm("ISB");

    // Configure SysTick (optional)
    // Configure MPU (optional)
    // Configure SAU for TrustZone (optional)

    printf("SystemInit complete\\n");
}

int main(void) {
    SystemInit();
    printf("Main running\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'SystemInit executed'
+++

## Problem Statement

Implement a `SystemInit` function that performs early hardware configuration before `main()`. Configure the Vector Table Offset Register (VTOR), enable the FPU coprocessor via CPACR, and optionally configure the SysTick timer. This function is typically called from the reset handler's startup code.

## Theory and Concepts

- `SystemInit` is called by the CMSIS startup code before `main()`.
- Critical tasks: VTOR configuration (if the vector table is not at the default address), FPU enable (CPACR), clock configuration, and MPU/SAU setup.
- The SCB->CPACR register controls coprocessor access — bits 20–23 enable full access to CP10 and CP11 (the FPU).
- After modifying system control registers, use DSB (Data Synchronisation Barrier) and ISB (Instruction Synchronisation Barrier) to ensure changes take effect before subsequent instructions.
- Some toolchains provide a weak `SystemInit` that the user can override.

## Real World Application

Every Cortex-M project needs SystemInit for clock configuration — setting PLLs, configuring flash wait states, and enabling peripherals. Silicon vendors provide SystemInit in their CMSIS pack, customised for their specific device.
