+++
date = '2026-07-06T18:18:00+05:30'
draft = false
title = 'FPU Register Set and Access'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    // FPU registers (S0-S31 single-precision, D0-D15 double-precision)
    float s0_value;
    double d0_value;

    // Write and read FPU registers via inline assembly
    __asm("VMOV.F32 %0, S0" : "=t" (s0_value));

    __asm("VMOV.F64 %0, D0" : "=w" (d0_value));

    printf("S0 = %f\\n", s0_value);
    printf("D0 = %lf\\n", d0_value);

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'FPU registers accessed'
+++

## Problem Statement

Access the FPU register bank (S0–S31, D0–D16 on Cortex-M33) using inline assembly. Write values to FPU registers and read them back. Print the register contents to verify the VFP data transfer instructions (VMOV).

## Theory and Concepts

- The FPU in Cortex-M33 (VFPv5-D16) has 32 single-precision registers (S0–S31) or 16 double-precision registers (D0–D15).
- S-registers and D-registers overlap: D0 = {S0, S1}, D1 = {S2, S3}, etc.
- FPU registers are accessed using VMOV, VLDR, VSTR, and VMLA instructions.
- The FPSCR (Floating-Point Status and Control Register) controls rounding mode, exception flags, and default NaN behaviour.
- The FPCAR (Floating-Point Context Address Register) holds the address where FPU registers are saved on exception entry.
- The FPCCR (Floating-Point Context Control Register) controls automatic and lazy context saving.

## Real World Application

Understanding the FPU register layout is essential for low-level FPU context management — writing context-switching code for RTOSes that support floating-point tasks, handling FPU exceptions, and optimising performance-critical floating-point code by minimising register pressure.
