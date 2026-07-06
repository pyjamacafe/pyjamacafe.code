+++
date = '2026-07-06T18:12:00+05:30'
draft = false
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
    printf(".data copy complete\\n");
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
