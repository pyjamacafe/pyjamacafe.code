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

===EXPLANATION===

The Cortex‑M4 and Cortex‑M33 single‑precision FPU (VFPv5‑D16) provides 32 single‑precision registers (S0‑S31) that can be viewed as 16 double‑precision registers (D0‑D15). The mapping is fixed: D0 overlays S0:S1, D1 overlays S2:S3, and so on. This overlay allows the FPU to execute both single and double‑precision operations on the same physical register file, though double‑precision operations on Cortex‑M33 are implemented as two single‑precision operations.

The register file is separate from the core ARM register bank (R0‑R15). FPU instructions like VMOV, VLDR, VSTR, VADD, and VMUL operate exclusively on S/D registers. Moving data between the ARM core and the FPU requires VMOV — a 32‑bit instruction with interlock that takes 1‑2 cycles. Because the register files are independent, context switching an FPU‑using task requires saving and restoring up to 132 bytes (32 S registers × 4 bytes + FPSCR).

Historically, ARM's FPU originated in the ARM7‑based FPA (Floating‑Point Accelerator) coprocessor, which had a completely different register model (eight 80‑bit extended‑precision registers). The VFP architecture simplified and standardised the register file to IEEE 754 single/double precision, and the Cortex‑M implementation removed the full double‑precision capability to save silicon area.

An RTOS context‑switch routine uses `VPUSH {S0‑S31}` and `VPOP {S0‑S31}` to save and restore the FPU register file. The FPCA bit in CONTROL tells the RTOS whether the current task used the FPU — if not, the VPUSH/VPOP pair is skipped entirely, saving ~100 cycles per context switch.

Visualise a painter's palette (FPU registers) separate from the painter's brush hand (core registers). The palette holds the colours (floating‑point values); the hand holds the brush (integer values and addresses). To change painters (context switch), you need to save both — but if a painter never mixes colours (didn't use FPU), you only save the brush position.

Key points: (1) S registers are 32‑bit; D registers overlay them in pairs. (2) VMOV is the bridge between core and FPU registers. (3) FPU context save uses VPUSH/VPOP (or VSTM/VLDM). (4) The register file width (D16 vs D32) varies by Cortex‑M implementation. (5) FPSCR is saved separately from S/D registers.

ARM's *Cortex‑M4 Technical Reference Manual*, "VFP" chapter, and the *ARMv7‑M Architecture Reference Manual* define the register layout and instruction set. CMSIS‑Core intrinsics like `__get_FPSCR()` provide C‑level access.
