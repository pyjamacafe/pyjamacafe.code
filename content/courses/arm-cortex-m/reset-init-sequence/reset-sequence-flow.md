+++
date = '2026-07-06T18:08:00+05:30'
draft = true
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
    printf("Reset sequence complete\n");
}

int main(void) {
    printf("Hello from main!\n");
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

===EXPLANATION===

Every ARM Cortex-M processor wakes from reset with a two‑word handshake etched into hardware. At the instant power stabilises, the CPU reads address 0x00000000 (or VTOR base) to load the initial Main Stack Pointer, then address 0x00000004 to load the Reset_Handler address, with bit 0 set to confirm Thumb mode. This "vector fetch" is the only architectural reset mechanism — there is no implicit jump to a fixed entry point like in older architectures.

The design stems from ARM's desire to support multiple boot scenarios. By placing the vector table in flash, the system boots directly from non‑volatile memory. But by reprogramming VTOR, a bootloader can redirect the table to RAM, enabling runtime reconfiguration or firmware update fallback paths. This flexibility is why the vector table is not hardwired but software‑defined.

In a professional RTOS, the reset handler rarely jumps straight to main(). It first calls SystemInit() for clock and PLL configuration, then runs the C runtime init (copy .data, zero .bss), optionally calls constructors for C++ globals, and only then reaches main(). Debugging a bricked board often starts at the reset handler — a missing vector table or wrong VTOR causes the CPU to fetch garbage and lock up immediately.

Visualise the process: picture a train leaving a station. The first word is the track gauge (stack pointer), the second word is the engine's destination (reset handler). If either is wrong, the train derails before it leaves the yard. Tools like a debugger's vector catch or a logic analyser on the boot pins help confirm the sequence.

Key points:
1. The vector table must have bit 0 of every handler address set to 1 (Thumb).
2. On multi‑core devices, each core has its own reset sequence.
3. A watchdog timeout forces a reset, re‑running the full sequence.
4. The initial SP must point to valid RAM — an invalid SP causes an immediate HardFault on the first instruction.


ARM Architecture Reference Manual ARMv7‑M and ARMv8‑M, Section B1.5 (“Reset and Initialization”) and the CMSIS‑Core documentation provide the authoritative specification. Joseph Yiu's *The Definitive Guide to ARM Cortex‑M3 and Cortex‑M4 Processors* offers an excellent practitioner's walkthrough.
