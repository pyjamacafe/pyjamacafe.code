+++
date = '2026-07-06T18:11:00+05:30'
draft = false
title = '.bss Zero-initialisation'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 15
weight = 4
initial_code = '''#include <stdio.h>

// Simulate .bss region
#define BSS_START ((unsigned int *)0x20000000)
#define BSS_END   ((unsigned int *)0x20001000)

void zero_bss(void) {
    unsigned int *p = BSS_START;
    while (p < BSS_END) {
        *p++ = 0;
    }
}

int main(void) {
    zero_bss();

    // Now any uninitialised global would be zero
    volatile int *test = (volatile int *)0x20000000;
    printf("First BSS word: %d\\n", *test);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'BSS zero-initialised'
+++

## Problem Statement

Write a function that zero-initialises a memory region (simulating `.bss`). Given a start and end address, set every word to 0. Verify by reading one of the addresses after the function completes.

## Theory and Concepts

- The `.bss` section contains uninitialised global and static variables.
- The C standard requires that all global and static variables are zero-initialised before program startup.
- The linker script defines `_sbss` (start of BSS) and `_ebss` (end of BSS) symbols.
- The startup code loops through this range setting each word to zero.
- BSS is not stored in the binary — only the start/end addresses are recorded, saving flash space.
- Some toolchains use `memset` to zero BSS, others use a simple loop.

## Real World Application

Zero-initialisation is a fundamental step in the C startup sequence — any static or global variable not explicitly initialised is guaranteed to be zero. This is relied upon for flag variables, counters, and resident data structures that must start in a known state.

===EXPLANATION===

The .bss section is a clever space‑saving invention from the early days of Unix assemblers (the name stands for "Block Started by Symbol"). Instead of storing zeros for every uninitialised global in the binary — which would waste flash — the linker records only the start and end addresses of the region. At startup, the code fills that range with zeros in a tight loop.

Intuitively, this works because RAM is volatile: writing zeros at boot costs time but no extra flash, which is the scarcer resource on many microcontrollers. A 16 KB .bss region would consume 16 KB of flash if stored literally. With zero‑init, it takes only 8 bytes (two linker symbols) in the binary. The trade‑off is startup time: zeroing 64 KB on a 48 MHz Cortex‑M takes roughly 0.5 ms, acceptable for most applications.

In a professional RTOS, the idle task stack, message queue buffers, and task control blocks often reside in .bss. A communications gateway might declare a 4 KB Ethernet frame buffer as `static uint8_t rx_buffer[4096];` — this lands in .bss and is zeroed at startup, ensuring no stale data leaks between packets.

Visualise a row of unlit LEDs before a performance. The .bss loop is the stagehand who walks down the row, turning each one off to guarantee darkness. Without this step, each LED could be in an unknown state from the previous show (a system crash or power glitch leaves random values in RAM).

Key points: (1) .bss includes global and static variables without explicit initialisers. (2) The startup code must zero .bss before any C code accesses those variables. (3) Some toolchains optimise the zero loop using `memset` or 16‑byte SIMD stores. (4) Variables placed in `.noinit` sections explicitly bypass zero‑init for data that must survive a warm reset. (5) The linker script symbol `_sbss` points to the start, `_ebss` to the end of the section.

The C standard (ISO/IEC 9899, Section 6.7.9) mandates zero‑initialisation of static storage duration objects. The GNU ld documentation and ARM Compiler armlink user guide describe how linker symbols for .bss are generated.
