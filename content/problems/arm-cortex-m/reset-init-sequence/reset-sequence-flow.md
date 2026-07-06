+++
date = '2026-07-06T18:08:00+05:30'
draft = false
title = 'Reset Sequence and Vector Fetch'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 15
weight = 1
initial_code = '''#include <stdio.h>

// Simulated vector table (at start of flash)
extern unsigned int _estack;   // End of stack (top of RAM)
extern void Reset_Handler(void);  // Entry point

// Vector table structure
unsigned int __attribute__((section(".isr_vector"))) vector_table[] = {
    (unsigned int)&_estack,      // Initial SP
    (unsigned int)Reset_Handler, // Reset handler
    (unsigned int)0,             // NMI
    (unsigned int)0,             // HardFault
    // ... more entries
};

void Reset_Handler(void) {
    // C runtime initialization
    // Copy .data from flash to RAM
    // Zero-initialize .bss
    // Call constructors (if any)
    // Call main()
    printf("Reset sequence complete\\n");
}

int main(void) {
    printf("Hello from main!\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Reset sequence simulated'
+++

## Problem Statement

Write a program that simulates the ARM Cortex-M reset sequence. Show how the processor reads the initial stack pointer from the first word of the vector table, loads the reset handler address from the second word, and begins execution. Explain the role of each step: vector fetch, SP load, PC load, and entry to Reset_Handler.

## Theory and Concepts

- On reset, the Cortex-M reads the first two words from the vector table (starting at address 0x00000000, or VTOR base).
- Word 0: initial Main Stack Pointer (MSP) value — typically the top of RAM.
- Word 1: Reset_Handler address — the PC is set to this address (with bit 0 set to indicate Thumb state).
- After the vector fetch, the CPU executes Reset_Handler, which performs C runtime initialisation before calling main().
- The Cortex-M always starts in Thread mode with privileged access, using MSP.
- The VTOR register can relocate the vector table to a different address (e.g., for bootloaders).

## Real World Application

Understanding the reset sequence is essential for bootloader development, firmware startup debugging, linker script configuration, and performing early hardware initialisation (clock config, MPU setup, watchdog disable) before main().
