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
