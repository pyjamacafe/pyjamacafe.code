+++
date = '2026-07-06T18:09:00+05:30'
draft = true
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

    printf("SystemInit complete\n");
}

int main(void) {
    SystemInit();
    printf("Main running\n");
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

===EXPLANATION===

SystemInit occupies a unique position in the startup chain: it runs after the stack pointer and vector table are live but before any C runtime initialisation or main(). This early timing lets it configure the very fabric of the system — clocks, voltage regulators, flash timing, memory protection, and security attribution — before any variable is touched or any function is called.

The historical precedent comes from ARM's reference startup code for the original Cortex‑M3. ARM recognised that most systems need some hardware configuration before they can even run C code reliably. Rather than baking vendor‑specific magic into the toolchain, they defined a weak `SystemInit` symbol in the CMSIS startup file. Silicon vendors override it with device‑specific configuration; if the application provides its own definition, that takes precedence.

Consider an STM32G4 operating at 170 MHz: before SystemInit, the CPU runs from the internal 16 MHz HSI oscillator with zero flash wait states. SystemInit must configure the PLL for the target frequency, set the correct number of flash wait states (typically 4 for 170 MHz), and switch the system clock source to the PLL output. Running code at 170 MHz with only one wait state causes flash read errors and unpredictable crashes — a classic boot failure that sends developers directly to SystemInit.

Visualise the startup as a spacecraft launch sequence: the vector fetch is the ignition, SystemInit is the trajectory correction that ensures the rocket points at the right star, and main() is the scientific mission. Without trajectory correction, the mission fails before it begins.

Key points:
1. SystemInit is called from the Reset_Handler, typically before .data/.bss init.
2. VTOR must be configured here if the vector table is not at the default address.
3. CPACR bits 20‑23 enable the FPU coprocessor.
4. After writing to SCB registers, always execute DSB and ISB.
5. SystemInit should not rely on global variables (they are not yet initialised).
6. On TrustZone devices, SystemInit also configures SAU regions and the secure VTOR.


CMSIS‑Core documentation (ARM.CMSIS.5) specifies the SystemInit contract. MCU vendor reference manuals (e.g., ST RM0440 for STM32G4) detail the clock tree and register configuration needed in SystemInit.
