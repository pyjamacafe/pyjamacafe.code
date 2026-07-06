+++
date = '2026-07-06T18:07:00+05:30'
draft = false
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
    printf("Result: %.1f\\n", result);

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
