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

