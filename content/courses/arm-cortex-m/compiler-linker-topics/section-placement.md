+++
date = '2026-07-06T18:24:00+05:30'
draft = false
title = 'Section Placement with Attributes'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 19
weight = 2
initial_code = '''#include <stdio.h>

// Place variables in specific sections
__attribute__((section(".noinit"))) int retained_data;
__attribute__((section(".ram_func"))) void fast_function(void) {
    printf("Running from RAM\\n");
}

// Vector table placed at a specific address
__attribute__((section(".isr_vector"), used))
const unsigned int vector_table[] = {
    (unsigned int)0x20010000,  // Initial SP
    (unsigned int)main         // Reset handler
};

int main(void) {
    retained_data = 42;
    printf("Section placement demonstrated\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Section attributes demonstrated'
+++

## Problem Statement

Use `__attribute__((section("name")))` to place variables and functions in custom memory sections. Show examples: `.noinit` for data retained across reset (not initialised), `.ram_func` for functions executed from RAM (for flash wait-state optimisation), and `.isr_vector` for the vector table.

## Theory and Concepts

- The `section` attribute overrides the default section (`.text`, `.data`, `.bss`) and places the symbol in a custom section.
- `.noinit` variables are not zero-initialised at startup — they retain their value across software resets (battery-backed RAM or not cleared).
- `.ram_func` functions are copied to RAM at startup and executed from RAM for zero-wait-state performance.
- The linker script must define the corresponding output sections and provide the copy logic for loadable sections.
- The `used` attribute prevents the linker from discarding a symbol even if it appears unused.

## Real World Application

Custom sections are essential in embedded systems — placing critical functions in RAM for fast execution (flash prefetch disabled), defining no-init data regions for system state that survives warm resets, and creating custom linker sections for memory-mapped I/O buffers.

===EXPLANATION===

The `__attribute__((section("name")))` extension lets the programmer override the default section assignment for any variable or function. By default, GCC places code in `.text`, initialised data in `.data`, and uninitialised data in `.bss`. Custom sections break out of this mould for specific use cases that embedded systems demand.

The `.noinit` section is perhaps the most common custom section. Variables placed here survive a software reset (warm boot) because the startup code skips both the .data copy and .bss zero‑init for this section. Use cases include: reset counters that increment on each reboot, fault status registers that must be preserved for post‑mortem analysis, and calibration data loaded by a bootloader. The linker script must define `.noinit` (usually in RAM with `(NOLOAD)` in GNU ld), and the startup code must skip it.

The `.ram_func` section is used to execute critical functions from RAM instead of flash. On high‑speed Cortex‑M7 parts with flash prefetch enabled, flash reads may stall the pipeline; placing time‑sensitive ISRs in RAM eliminates this penalty. The startup code must copy `.ram_func` from flash LMA to RAM VMA, just like `.data`. This is commonly done alongside the `.data` copy in the Reset_Handler.

The `.isr_vector` section ensures the vector table lands at the correct flash origin. The `KEEP()` linker directive prevents garbage collection from removing unused vector entries (which would shift the table and break exception handling). The `used` attribute on the C declaration similarly prevents the compiler from discarding the symbol.

Visualise custom sections as specialty rooms in a house. `.text` is the living room (everyday code). `.data` is the kitchen (cookware — initialised data). `.bss` is the storage closet (unused space). `.noinit` is a whiteboard in the garage (survives cleaning). `.ram_func` is a fast‑charging station installed in the living room for devices that need immediate power.

Key points:
1. Custom sections require corresponding linker script output sections — otherwise they map to default regions.
2. `.noinit` must use `(NOLOAD)` in GNU ld to prevent zero‑fill.
3. Functions in `.ram_func` must be copied from LMA to VMA in the startup code.
4. Use `__attribute__((section(".name"), used))` for vector tables.
5. The `KEEP()` linker command prevents section garbage collection.


GNU ld documentation, "Output Section Description", explains how to define custom output sections. ARM Compiler's armlink User Guide describes equivalent `AREA` directives for scatter‑loading. CMSIS startup files and MCU vendor linker scripts provide real‑world custom‑section examples.