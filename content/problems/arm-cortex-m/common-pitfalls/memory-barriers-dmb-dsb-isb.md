+++
date = '2026-07-06T18:32:00+05:30'
draft = false
title = 'Memory Barriers: DMB, DSB, ISB'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 5
initial_code = '''#include <stdio.h>

#define SCB_CCR    (*(volatile unsigned int *)0xE000ED14)
#define SCB_SHCSR  (*(volatile unsigned int *)0xE000ED24)

void configure_system(void) {
    // Modify System Control Register
    SCB_CCR |= (1 << 9);  // STKALIGN: align exception stacking to 8-byte

    // Data Synchronisation Barrier — ensures preceding memory accesses complete
    __asm("DSB");

    // Instruction Synchronisation Barrier — flushes pipeline
    __asm("ISB");
}

void perform_dma_transfer(void) {
    // Start DMA
    // ... DMA register writes ...

    // Data Memory Barrier — ensures all memory accesses are observed
    __asm("DMB");

    // Now the DMA controller sees coherent memory
}

int main(void) {
    configure_system();
    printf("Memory barriers used\\n");

    // DMB: ensures all memory accesses before the barrier are observed before those after
    // DSB: waits until all memory accesses complete (used before WFI/WFE)
    // ISB: flushes pipeline (used after system register changes)
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Memory barriers demonstrated'
+++

## Problem Statement

Use the three ARM Cortex-M memory barrier instructions — DMB (Data Memory Barrier), DSB (Data Synchronisation Barrier), and ISB (Instruction Synchronisation Barrier) — in appropriate scenarios. Show where each barrier is required: DMB for memory ordering (DMA coherence), DSB before WFI/WFE, and ISB after system register modifications.

## Theory and Concepts

- **DMB**: ensures that all memory accesses (loads/stores) before the barrier are observed by all bus masters before any after the barrier. Used for memory ordering between CPU and DMA/peripherals.
- **DSB**: waits until all memory accesses before the barrier have completed. Used before WFI/WFE (to ensure pending operations finish before sleeping), after MPU/SCB register writes, and before changing system clocks.
- **ISB**: flushes the instruction pipeline and re-fetches instructions from memory. Used after modifying system control registers (VTOR, MPU, CPACR, SCB_CCR) to ensure subsequent instructions use the new configuration.
- Without appropriate barriers, the CPU may execute stale data or instructions, leading to subtle, intermittent bugs.
- CMSIS provides `__DMB()`, `__DSB()`, `__ISB()` intrinsics for all Cortex-M processors.

## Real World Application

Missing memory barriers cause some of the hardest-to-debug bugs in embedded systems — DMA transfers that read stale cache data, MPU configuration that doesn't take effect, WFI that wakes immediately due to pending bus transactions, and hardware initialisation sequences that behave inconsistently.
