+++
date = '2026-07-06T18:32:00+05:30'
draft = true
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
    printf("Memory barriers used\n");

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

===EXPLANATION===

Memory barriers synchronise the CPU pipeline and memory system. The Cortex‑M has three barrier instructions with distinct semantics, and misusing them — or omitting them — creates intermittent, timing‑dependent bugs that defy debugging.

DMB (Data Memory Barrier) orders memory accesses. All loads and stores before the DMB complete and are visible to other bus masters before any load/store after the DMB initiates. Use DMB when sharing data between the CPU and a DMA controller, or between two cores in a multi‑core system. Without DMB, the CPU might write a buffer descriptor, then start the DMA — but the write might still be in the write buffer, and the DMA reads stale data.

DSB (Data Synchronisation Barrier) is stronger: it stalls the pipeline until all prior memory accesses have completed. This is essential before WFI/WFE (to ensure pending writes finish before sleeping, preventing immediate wake), after MPU/SCB register modifications (to guarantee the new configuration is active), and when changing system clocks. DSB guarantees completion, not just ordering.

ISB (Instruction Synchronisation Barrier) flushes the prefetch pipeline and forces re‑fetching from memory. After writing VTOR, CPACR, MPU registers, or any system control register that affects instruction execution, ISB ensures subsequent instructions are fetched using the new configuration. Without ISB, the CPU may execute stale instructions from the prefetch buffer, causing mysterious crashes or configuration that seems to "not stick".

A typical bug scenario: an engineer writes `SCB->VTOR = 0x08004000;` and immediately calls a function that generates an exception. The exception handler's vector is fetched from the old VTOR location because the pipeline still holds the old vector table address. Adding `__DSB(); __ISB();` after the VTOR write fixes it.

Visualise the barriers as traffic control at a busy intersection. DMB is a yield sign — traffic from the previous street must clear before new traffic enters. DSB is a red light — all traffic must come to a complete stop before proceeding. ISB is a road closure sign — all drivers must recalculate their GPS routes (re‑fetch instructions) before driving on.

Key points:
1. Always use ISB after system control register modifications.
2. Always use DSB before WFI/WFE.
3. Use DMB for DMA buffer ownership transfer.
4. CMSIS provides `__DMB()`, `__DSB()`, `__ISB()` intrinsics.
5. Compiler barriers (`asm volatile("" ::: "memory")`) prevent compiler reordering but are NOT hardware barriers.


ARM Architecture Reference Manual, "Memory System" chapter, defines barrier instruction semantics. ARM's *Barrier Litmus Tests* application note provides practical test cases. CMSIS‑Core documentation lists each barrier's recommended usage.
