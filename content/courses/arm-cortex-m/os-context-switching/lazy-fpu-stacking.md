+++
date = '2026-07-06T18:07:00+05:30'
draft = true
title = 'Lazy Floating-Point Stacking'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 16
weight = 5
initial_code = '''#include <stdio.h>

#define FPCCR (*(volatile unsigned int *)0xE000EF34)
#define FPCAR (*(volatile unsigned int *)0xE000EF38)

void enable_lazy_stacking(void) {
    // Set LSPEN bit (bit 30) in FPCCR to enable lazy stacking
    FPCCR |= (1 << 30);
    __asm("DSB");
    __asm("ISB");
}

float compute_heavy(float a, float b) {
    // This function uses the FPU
    return a * a + b * b;
}

int main(void) {
    enable_lazy_stacking();

    float result = compute_heavy(3.0f, 4.0f);
    printf("Result: %.1f\n", result);

    // FPU context is only saved on exception entry if FPU was actually used
    // This reduces interrupt latency when FPU is not in use

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Lazy stacking configured'
+++

## Problem Statement

Configure the lazy stacking feature for the FPU on a Cortex-M33 or M55 processor. Enable the LSPEN bit in the FPCCR register and verify that floating-point context is automatically saved on exception entry only when the FPU has been used since the last exception.

## Theory and Concepts

- Lazy stacking delays the saving of floating-point registers (S0–S31, FPSCR) on exception entry until the first FPU instruction in the handler.
- If no floating-point instructions are used between the current exception and the next, the FPU context is never saved or restored — reducing interrupt latency.
- The LSPEN bit in FPCCR enables lazy stacking; the ASPEN bit enables automatic state preservation.
- The CONTROL.FPCA bit tracks whether the FPU is active in the current context.
- Without lazy stacking, the CPU always saves 16 or 32 FPU registers on exception entry, adding ~100–200 cycles to interrupt latency.

## Real World Application

Lazy FPU stacking is critical for real-time systems using floating-point — it reduces worst-case interrupt latency when FPU-intensive tasks are interrupted by high-priority events. RTOSes like FreeRTOS and Zephyr configure lazy stacking automatically when an FPU is present.

===EXPLANATION===

When the Cortex‑M4 introduced the single‑precision FPU, ARM faced a dilemma: saving 32 FPU registers (S0‑S31, plus FPSCR, a total of 132 bytes) on every exception entry added 100‑200 cycles of latency even if the handler never touched the FPU. The solution, inherited from the ARM11 architecture, is lazy stacking — a mechanism that delays the actual save until the moment an FPU instruction executes in the handler.

The hardware tracks FPU activity using two bits: FPCCR.LSPEN (lazy stacking enable) and CONTROL.FPCA (floating‑point context active). When lazy stacking is enabled and an exception occurs while FPCA is set, the CPU does NOT push FPU registers to the stack immediately. Instead, it records the location in FPCAR where the save should happen and marks the FPU state as "invalid". The first FPU instruction in the handler triggers a synchronous lazy preservation fault — the CPU saves the FPU context to FPCAR's address and then retries the instruction. If the handler never touches the FPU, the save never happens.

A motor control application on a Cortex‑M4 illustrates the benefit: the high‑priority PWM interrupt runs every 10 µs and never uses floating‑point. A lower‑priority FOC (Field‑Oriented Control) task does heavy FPU computation. Without lazy stacking, every PWM interrupt incurs the full FPU save/restore overhead, consuming 10‑20% of CPU time. With lazy stacking, the PWM handler sees no FPU‑related overhead.

Visualise a backpack you carry "just in case". With eager stacking, you unpack and repack the entire bag at every security checkpoint. With lazy stacking, you only open the bag when security asks to see inside — if they never ask, you keep walking.

Key points:
1. LSPEN must be set once at startup; it affects all subsequent exceptions.
2. The first FPU instruction in a lazy‑stacked handler is slower (save + retry).
3. Lazy stacking works correctly with nested exceptions and multiple FPU‑active contexts.
4. The FPCCR provides status bits (LSPACT, USER, TS) for debugging the lazy state machine.


ARM's *Cortex‑M4 Technical Reference Manual* Section 8.3 describes lazy stacking in detail. The CMSIS‑Core header `core_cm4.h` defines the FPCCR register layout, and FreeRTOS's `port.c` demonstrates production lazy‑stacking configuration.
