+++
date = '2026-07-06T18:10:00+05:30'
draft = true
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
    printf("Initialized: %d\n", initialized_data);  // Must be 42
    printf("Uninitialized: %d\n", uninitialized_data);  // Must be 0
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

===EXPLANATION===

The C standard mandates that global and static variables have a known value before main() executes — initialised variables must hold their designated values, and uninitialised ones must be zero. On a Cortex‑M, RAM is volatile and undefined at power‑on, so this initialisation must happen in software via the startup sequence. The linker script plays a secret but critical role: it generates symbols like _sdata, _edata, and _sidata that tell the startup code exactly where everything lives.

Historically, mainframe FORTRAN compilers offered runtime initialisation, and C adopted the pattern. In embedded systems the need is more acute because there is no OS to set up segments. The toolchain's crt0 (C runtime zero) assembly file performs this dance on every reset. On ARM, the CMSIS startup files provide a C‑language implementation that calls SystemInit() then __main() (ARM Compiler) or _start() (GCC).

A professional example: a production IoT sensor stores calibration coefficients as initialised global structures. If the .data copy fails, the device operates with garbage coefficients, silently producing wrong measurements. Field engineers trace such defects to a corrupted startup sequence, often caused by a misconfigured linker script that places .data at the wrong address or omits the copy loop entirely.

Visualise the address space: flash holds both code and the initial values of .data in a contiguous region called the load memory address (LMA). RAM holds the runtime virtual memory address (VMA) of .data and .bss. The startup code is a `memcpy` of _sidata → _sdata for _edata - _sdata bytes, followed by a zero‑fill of _sbss to _ebss. A debugger showing memory before and after startup makes this concrete.

Key points:
1. _sidata (flash) and _sdata (RAM) are often different — the copy is mandatory.
2. .bss takes no space in the binary; only the start and end addresses are stored.
3. C++ global constructors run after data/bss init.
4. The startup code must not use global variables until after init.


ARM Compiler's `__main` and GCC's `_start` implementations are documented in their respective manuals. The ELF standard's section definitions and the System V ABI specify the expected behaviour of .data and .bss.
