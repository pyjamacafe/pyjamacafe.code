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
