+++
date = '2026-07-06T18:12:00+05:30'
draft = true
title = '.data Copy from Flash to RAM'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 15
weight = 5
initial_code = '''#include <stdio.h>

// Simulated linker symbols
extern unsigned int _sdata;
extern unsigned int _edata;
extern unsigned int _sidata;

void copy_data(void) {
    unsigned int *src = &_sidata;   // Flash origin
    unsigned int *dst = &_sdata;    // RAM destination
    while (dst < &_edata) {
        *dst++ = *src++;
    }
}

int main(void) {
    copy_data();
    printf(".data copy complete\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = '.data copy complete'
+++

## Problem Statement

Implement the `.data` section copy from flash to RAM. The `.data` section contains initialised global variables — their initial values are stored in flash and must be copied to their runtime RAM addresses before `main()` runs. Use the linker symbols to determine the regions.

## Theory and Concepts

- The `.data` section has two addresses: the load address (LMA) in flash (`_sidata`) and the virtual address (VMA) in RAM (`_sdata` to `_edata`).
- The startup code copies `(edata - sdata)` words from `_sidata` to `_sdata`.
- On a Harvard architecture (code in flash, data in RAM), this copy is mandatory.
- Without this copy, initialised global variables would retain their power-on values (undefined) instead of their initialisers.
- The `.data` section in RAM consumes space equal to the initialised variables; the flash stores only the initial values.

## Real World Application

All embedded C projects that use initialised global variables need the `.data` copy. It is a standard part of the C startup sequence in every linker script provided by MCU vendors (STM32, NXP, Microchip, etc.).

===EXPLANATION===

Why must .data be copied? On a Cortex‑M, code executes directly from flash, but data lives in RAM for read‑write access. An initialised global like `int counter = 100;` needs its starting value (100) stored somewhere non‑volatile — that somewhere is flash, adjacent to the code. The linker places these initial values in a load section with LMA in flash and VMA in RAM. The startup code copies from LMA to VMA before main().

This separation is a legacy of Harvard architectures (separate code and data buses) and persists even in modern unified‑bus Cortex‑M designs because flash is slower for writes and wears out. Keeping .data in RAM is also necessary for variables modified at runtime — they must be in read‑write memory.

A real‑world scenario: an automotive ECU stores DTC (Diagnostic Trouble Code) counters as initialised globals. The startup code copies the initial zero counts to RAM, and during operation the firmware increments them. On the next reset, the copy reinitialises them — unless the application uses a `.noinit` section to preserve fault history across reboots.

Visualise two buckets: one in flash (the original water) and one in RAM (the working bucket). Before you start using the water, you must pour it from the flash bucket into the RAM bucket. The linker symbols label both buckets' locations and sizes.

Key points:
1. The .data region in flash occupies space in the binary; it is not free like .bss.
2. On devices with tight RAM, minimise initialised globals to reduce the copy time and RAM footprint.
3. The copy direction is always flash → RAM; never the reverse.
4. LDR/STR word‑wide copies are faster than byte‑wise memcpy — most startup code uses word copies.
5. For bootloaders that relocate, the VMA may differ between bootloader and application; the application's startup code must still run its own .data copy.


ARM's RealView Linker and GNU ld both document the distinction between AT (LMA) and ADDR (VMA) in their linker script language. Joseph Yiu's books on Cortex‑M processors devote a chapter to the startup sequence and memory layout.
