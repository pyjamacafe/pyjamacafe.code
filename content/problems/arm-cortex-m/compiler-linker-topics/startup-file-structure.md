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

===EXPLANATION===

The startup file is the first piece of code the CPU executes after the reset vector fetch. It contains the vector table — a contiguous array of function pointers indexed by exception number — and weak default handler implementations. The vector table must be placed at the base of the flash region (or the address programmed into VTOR), and the linker script must ensure the `.isr_vector` output section appears first.

The vector table layout is defined by ARM, not by the chip vendor. Entry 0 is the initial Main Stack Pointer value. Entry 1 is the Reset_Handler. Entries 2‑15 cover system exceptions: NMI (2), HardFault (3), MemManage (4), BusFault (5), UsageFault (6), with entries 7‑10 reserved in ARMv7‑M, then SVC (11), DebugMon (12), reserved (13), PendSV (14), SysTick (15). External peripheral interrupts start at entry 16.

Each handler entry is declared with `__attribute__((weak))` so a user‑defined function with the same name overrides the default. The weak default typically is an infinite loop (for HardFault) or a simple return. This pattern lets the startup file provide working defaults while letting the application override only the handlers it needs.

A production STM32 startup file is typically ~300 lines of assembly or C. It calls `SystemInit()`, then `__main()` (ARM Compiler) or `_start()` (GCC) for C runtime initialisation, then `main()`. The CMSIS startup files use a C implementation with a `__attribute__((section(".isr_vector")))` array, making the startup file portable across toolchains.

Visualise the vector table as a theatre programme: each page lists an actor (exception) and the page number where their entrance happens (handler address). The stage manager (CPU) reads the programme at the top of the show (reset) and calls each actor when their cue arrives.

Key points:
1. The vector table must be 256‑ or 512‑byte aligned (depending on implementation).
2. Bit 0 of every handler address must be 1 (Thumb bit).
3. External interrupt count and order are device‑specific — check the MCU's reference manual.
4. The initial SP value is typically `_estack` from the linker script.
5. Startup files can be written in C (CMSIS style) or assembly — C is more portable.


The CMSIS‑Core startup template (ARM.CMSIS.5) provides a reference C startup file. MCU vendor SDKs contain device‑specific startup files with correct vector ordering for each MCU.