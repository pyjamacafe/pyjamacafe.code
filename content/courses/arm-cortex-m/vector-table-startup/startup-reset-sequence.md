+++
date = '2026-07-06T10:43:00+05:30'
draft = false
title = 'Startup Reset Sequence Implementation'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 10
weight = 3
initial_code = '''// Implement the startup reset sequence
#include <stdio.h>
#include <stdint.h>

extern uint32_t _sidata;
extern uint32_t _sdata;
extern uint32_t _edata;
extern uint32_t _sbss;
extern uint32_t _ebss;

void __attribute__((section(".after_vectors")))
SystemInit(void) {
    printf("SystemInit: Configure system clock, PLL, etc.\\n");
}

void __attribute__((section(".after_vectors")))
__data_init(void) {
    uint32_t *src = &_sidata;
    uint32_t *dst = &_sdata;

    while (dst < &_edata) {
        *dst++ = *src++;
    }
    printf("Data section initialized: .data copied from flash to SRAM\\n");
}

void __attribute__((section(".after_vectors")))
__bss_init(void) {
    uint32_t *dst = &_sbss;

    while (dst < &_ebss) {
        *dst++ = 0;
    }
    printf("BSS section zeroed\\n");
}

typedef void (*init_func_t)(void);
extern init_func_t __init_array_start;
extern init_func_t __init_array_end;

void __libc_init_array(void) {
    init_func_t *p;
    for (p = &__init_array_start; p < &__init_array_end; p++) {
        (*p)();
    }
}

void Reset_Handler(void) {
    SystemInit();
    __data_init();
    __bss_init();
    __libc_init_array();
    printf("\\nStartup complete, calling main()\\n");
}

int main(void) {
    printf("Main application running\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Implement the startup reset sequence for a Cortex-M processor. Write Reset_Handler that: (1) calls SystemInit to configure clocks and system hardware, (2) initializes the .data section by copying from flash to SRAM, (3) zeros the .bss section, (4) calls the C++ static constructors (__libc_init_array), and (5) calls main().

## Theory and Concepts

- Reset_Handler is the first code executed after reset (entry 1 in vector table).
- The startup sequence must initialize the C runtime environment before main() can execute.
- .data section: initialized global/static variables. Stored in flash (LMA) and copied to SRAM (VMA) at startup.
- .bss section: zero-initialized global/static variables. Must be cleared to zero before use.
- Linker symbols (_sdata, _edata, _sbss, _ebss, _sidata) define the boundaries of these sections.
- SystemInit typically configures the system clock, PLL, flash wait states, and FPU.
- __libc_init_array calls C++ static constructors and C init functions.
- The stack pointer is initialized from vector table entry 0 before Reset_Handler runs.

## Real World Application

Every Cortex-M C/C++ project uses this startup sequence, either from CMSIS startup files, the vendor SDK, or custom startup code. Understanding the sequence is essential for debugging startup crashes and porting code to new MCUs.

===EXPLANATION===

When the Cortex-M processor exits reset, it does two hardware actions: it loads the Main Stack Pointer from vector table entry 0, then loads the Program Counter from entry 1 (Reset_Handler). From that moment, everything that happens before main() is a carefully orchestrated dance to prepare the C runtime environment. Think of it like a stage crew setting up before a play: the curtain (reset) rises, the crew must arrange the props (initialize .data), clear the stage (zero .bss), and light the set (configure clocks and PLL) before the actors (application code) can perform.

The ARM tradition of a startup sequence dates back to the ARM7 era, where the reset handler was typically a short assembly routine that did little more than set up the stack and jump to main(). As embedded systems grew more complex — larger memories, multiple clock domains, floating-point units, cache controllers — the startup sequence became more elaborate. Cortex-M standardized this through CMSIS, providing a consistent template across vendors.

The professional startup sequence follows a strict order: (1) SystemInit() configures the system clock, PLL, flash wait states, FPU, and any vendor-specific hardware. (2) The .data section is copied from its load memory address (LMA) in flash to its virtual memory address (VMA) in SRAM using linker symbols like _sidata, _sdata, _edata. (3) The .bss section is zeroed from _sbss to _ebss. (4) __libc_init_array calls all C++ static constructors and C init functions designated with __attribute__((constructor)). (5) Finally, main() is invoked.

A common failure mode: the application crashes on reset because SystemInit() was not called before .data initialization. On some MCUs, the flash controller needs configured wait states before any flash access — if the .data copy happens before SystemInit sets the correct wait states, the copy reads garbage and the system hard-faults. Another subtle issue: the linker symbols _sidata, _sdata, etc. are defined in the linker script, and their addresses must match the actual section layout. A mismatch causes .data to copy from the wrong source address, silently corrupting initialized variables.

Visualize the memory at reset: flash contains the vector table, all code, read-only data, and the initial values of .data. SRAM is uninitialized. The startup sequence copies the .data initial values from flash into SRAM, zeros the .bss area in SRAM, then hands control to the C++ runtime and finally to main(). Without this sequence, global variables would have garbage values, and the program would behave unpredictably.

Key points:
1. Reset_Handler is the first C code executed (not main()).
2. SystemInit runs first — do not access flash-dependent features before it.
3. .data copy source is LMA (flash), destination is VMA (SRAM).
4. .bss must be zeroed before any code relies on zero-initialized globals.
5. Static constructors run after data/bss init but before main(). Reference: CMSIS-Core startup template files and the ARM Compiler guide on runtime initialization.
