+++
date = '2026-07-06T18:29:00+05:30'
draft = false
title = 'Missing volatile in ISR-main Communication'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 2
initial_code = '''#include <stdio.h>

// BUG: missing volatile — compiler may optimise reads
int flag = 0;

// FIX: volatile int flag = 0;

void SysTick_Handler(void) {
    flag = 1;  // Set by interrupt
}

int main(void) {
    // Without volatile, the compiler may optimise this to:
    // if (0 != 0) — always false
    // Or load flag once into a register and never re-read
    while (flag == 0) {
        // Wait for interrupt
        // Without volatile, this may be infinite!
        break;  // Prevent infinite loop in simulation
    }

    printf("Flag detected!\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'volatile bug demonstrated'
+++

## Problem Statement

Demonstrate the bug caused by missing `volatile` on a shared variable between an interrupt handler and the main loop. Explain that without `volatile`, the compiler may optimise the read of `flag` into a register, never re-reading from memory, resulting in an infinite loop.

## Theory and Concepts

- The `volatile` keyword tells the compiler that a variable can change at any time, outside the normal program flow (e.g., by an interrupt handler).
- Without `volatile`, the compiler assumes the variable is only modified by the current thread of execution and may optimise repeated reads into a single register load.
- This optimisation can cause infinite loops in embedded code where a flag is set by an ISR and polled in the main loop.
- `volatile` should be used for: global variables shared between ISR and main, memory-mapped peripheral registers, and variables modified by DMA.
- `volatile` does NOT provide atomicity — use atomic types or critical sections for read-modify-write operations.

## Real World Application
Missing `volatile` is one of the most common embedded C bugs, especially for beginners. It causes intermittent failures that are difficult to reproduce — the code works in debug (where optimisation is off) but fails in release builds or when cache/prefetch is enabled.

===EXPLANATION===

The C standard's `volatile` keyword is arguably the most important qualifier in embedded programming. It tells the compiler that a variable may change at any time due to external factors — an interrupt handler, a DMA transfer, a memory‑mapped peripheral register, or another core. Without `volatile`, the compiler's alias analysis assumes the variable is modified only by the current thread of execution and may optimise away repeated reads or reorder accesses.

The classic failure mode: a global flag `int data_ready = 0;` is set to 1 in an ISR and polled in a `while (!data_ready);` loop. Without `volatile`, the compiler loads `data_ready` into a register before the loop, checks the register against 0, and never re‑reads from memory — an infinite loop, even though the ISR set the memory to 1. This works in debug builds (`-O0`) because the compiler does not cache memory values, but fails in release builds (`-O2` or higher).

Memory‑mapped peripheral registers are another volatile requirement. A register like `UART->DR` may change value due to hardware receiving a byte, independent of any software write. Without `volatile`, the compiler might coalesce two reads of the same register into one, losing the second byte.

A DMA buffer shared between a DMA controller and the CPU must be declared `volatile`. However, `volatile` does NOT provide atomicity — a volatile read‑modify‑write on a 32‑bit variable can still be interrupted mid‑operation. For atomicity, use the Cortex‑M's exclusive access instructions (`LDREX`/`STREX`) or disable interrupts.

Visualise `volatile` as a "no caching" sign on a mailbox. The mail carrier (interrupt/DMA) delivers letters directly to the box. Without the sign, the postal sorter (compiler) might pile all letters in a bin (register) and check the bin instead of the box, missing new deliveries.

Key points:
1. Always use `volatile` for flags shared between ISR and main code.
2. Always use `volatile` for memory‑mapped peripheral registers.
3. Always use `volatile` for buffers accessed by DMA.
4. `volatile` prevents read optimisation but does NOT prevent write merging — use barriers if needed.
5. Casting away `volatile` from a pointer is undefined behaviour.


The C standard (ISO/IEC 9899, Section 6.7.3) defines volatile semantics. The MISRA‑C guidelines (Rule 3.4) mandate volatile for shared and asynchronously‑modified variables. Embedded textbooks like Michael Barr's *Embedded C Coding Standard* dedicate sections to volatile usage patterns.
