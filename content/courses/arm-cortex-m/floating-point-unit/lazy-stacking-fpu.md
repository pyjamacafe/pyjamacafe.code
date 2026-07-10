+++
date = '2026-07-06T18:20:00+05:30'
draft = false
title = 'FPU Lazy Stacking Configuration'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 3
initial_code = '''#include <stdio.h>

#define FPCCR (*(volatile unsigned int *)0xE000EF34)
#define FPCAR (*(volatile unsigned int *)0xE000EF38)

void configure_fpu_stacking(void) {
    // ASPEN = 1: automatic state preservation
    // LSPEN = 1: lazy state preservation
    // Set bits 31 (ASPEN) and 30 (LSPEN) in FPCCR
    FPCCR |= (1 << 31) | (1 << 30);
    __asm("DSB");
    __asm("ISB");
}

int main(void) {
    configure_fpu_stacking();
    printf("FPU lazy stacking configured\n");

    // Perform some FPU operations
    float a = 3.0f, b = 4.0f;
    float c = a * a + b * b;
    printf("Result: %f\n", c);

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'Lazy stacking configured and FPU used'
+++

## Problem Statement

Configure the FPU's automatic and lazy stacking mechanisms by setting the ASPEN and LSPEN bits in the FPCCR register. Explain when each mode is used and how lazy stacking reduces interrupt latency when the FPU is not actively used by the interrupted context.

## Theory and Concepts

- FPCCR.ASPEN (bit 31): Automatic State Preservation — enables hardware to automatically save/restore FPU state on exception entry/exit.
- FPCCR.LSPEN (bit 30): Lazy State Preservation — FPU registers are marked as invalid on exception entry but only actually saved when the handler uses an FPU instruction.
- When lazy stacking is enabled, the CPU sets the FPCA (Floating-Point Context Active) flag in the CONTROL register when an FPU instruction executes.
- On exception entry, if LSPEN=1, the CPU writes a flag value to FPCAR instead of saving all 32 FPU registers (saving ~100 cycles).
- If the handler uses the FPU, the lazy preservation mechanism triggers a synchronous save before the FPU instruction executes.
- If the handler does not use the FPU, the save is skipped entirely — the FPU state remains in the interrupted context.

## Real World Application

Lazy FPU stacking is essential in RTOS environments where multiple tasks share the FPU but most interrupt handlers do not use floating-point. It can reduce worst-case interrupt latency by over 100 cycles compared to eager stacking.

===EXPLANATION===

Lazy FPU stacking is the Cortex‑M mechanism that converts an eager save (always save FPU registers on exception entry) into an on‑demand save (save only when the handler actually uses the FPU). The control bits live in FPCCR: ASPEN (bit 31) enables automatic state preservation, and LSPEN (bit 30) enables lazy state preservation. When both are set, the hardware takes a "trust but verify" approach.

On exception entry with LSPEN=1 and FPCA=1 (the interrupted context used the FPU), the CPU writes the current FPCAR to point to the stack location where FPU registers *would* be saved, then clears FPCA and sets the LSPACT bit in FPCCR to indicate a lazy save is pending. The 32 FPU registers are NOT written to the stack at this point — only the FPCAR pointer is recorded. If the handler never executes an FPU instruction, the exception return clears LSPACT, and the original FPU context remains intact in the registers.

If the handler does use an FPU instruction, the CPU detects LSPACT=1, automatically saves the FPU registers to the address in FPCAR, clears LSPACT, and then executes the instruction. This "lazy preservation fault" is transparent to the programmer but adds ~50 cycles on the first FPU instruction in the handler. After that, the FPU is fully accessible with normal performance.

The benefit is dramatic: consider a system where a 10 kHz timer interrupt runs a non‑FPU housekeeping task. With eager stacking, each interrupt saves and restores 16‑32 FPU registers (64‑128 bytes of stack traffic), adding 100‑200 cycles of latency. With lazy stacking, the interrupt latency sees zero FPU overhead — the save never happens.

Visualise a library where every patron checks in their backpack at the entrance. With eager stacking, security opens every backpack and inspects the contents regardless of whether the patron opens a book inside. With lazy stacking, security just records that a backpack was checked in. Only if a patron actually opens a book (uses the FPU) does security inspect the contents.

Key points:
1. LSPEN and ASPEN must both be set for lazy stacking.
2. The first FPU instruction in a lazy‑stacked handler is slower due to the deferred save.
3. FPCAR indicates the save location — it is updated on each exception entry.
4. LSPACT is read‑only and indicates a lazy save is pending — do not clear it manually.
5. Lazy stacking works with nested exceptions: the outer context's FPU state is preserved through the inner handler.


ARM's *Cortex‑M4 Technical Reference Manual*, "Floating‑Point Unit" chapter, and the *ARMv7‑M Architecture Reference Manual* describe the lazy stacking state machine. FreeRTOS `port.c` for Cortex‑M4F demonstrates production startup configuration of FPCCR.
