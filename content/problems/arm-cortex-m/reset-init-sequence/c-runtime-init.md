+++
date = '2026-07-06T18:10:00+05:30'
draft = false
title = 'C Runtime Initialization'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 15
weight = 3
initial_code = '''#include <stdio.h>

extern unsigned int _sdata;    // Start of .data in RAM
extern unsigned int _edata;    // End of .data in RAM
extern unsigned int _sidata;   // Start of .data in flash (load address)
extern unsigned int _sbss;     // Start of .bss in RAM
extern unsigned int _ebss;     // End of .bss in RAM

void _start(void) {
    // Copy .data from flash to RAM
    unsigned int *src = &_sidata;
    unsigned int *dst = &_sdata;
    while (dst < &_edata) {
        *dst++ = *src++;
    }

    // Zero-initialize .bss
    for (dst = &_sbss; dst < &_ebss; dst++) {
        *dst = 0;
    }

    // Call main
    main();

    while (1);
}

int initialized_data = 42;
int uninitialized_data;

int main(void) {
    printf("Initialized: %d\\n", initialized_data);  // Must be 42
    printf("Uninitialized: %d\\n", uninitialized_data);  // Must be 0
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'C runtime init: data=42, bss=0'
+++

## Problem Statement

Implement the C runtime initialisation sequence that runs before `main()`. Copy the `.data` section from flash to RAM, zero-initialise the `.bss` section, and then call `main()`. Use the linker symbols `_sdata`, `_edata`, `_sidata`, `_sbss`, `_ebss` provided by the linker script.

## Theory and Concepts

- In embedded systems, initialised global variables (`.data`) are stored in non-volatile flash with initial values and copied to RAM at startup.
- Uninitialised global variables (`.bss`) are zero-initialised at startup.
- The linker script provides symbols indicating the start and end addresses of these sections.
- The startup code in `_start` (or `Reset_Handler`) performs these steps before calling `main()`.
- Without this initialisation, global variables would have unpredictable values (RAM content is undefined at power-on).

## Real World Application

Every C/C++ embedded project requires C runtime initialisation — the startup code is typically provided by the toolchain (GCC's `_start`, ARM Compiler's `__main`), but understanding it is essential for bare-metal development, bootloader creation, and debugging startup issues.
