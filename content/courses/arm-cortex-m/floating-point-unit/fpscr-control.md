+++
date = '2026-07-06T18:19:00+05:30'
draft = true
title = 'FPSCR Control and Status'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 18
weight = 2
initial_code = '''#include <stdio.h>

unsigned int read_fpscr(void) {
    unsigned int result;
    __asm("VMRS %0, FPSCR" : "=r" (result));
    return result;
}

void write_fpscr(unsigned int value) {
    __asm("VMSR FPSCR, %0" : : "r" (value));
}

int main(void) {
    // Default FPSCR
    unsigned int fpscr = read_fpscr();
    printf("FPSCR = 0x%08X\n", fpscr);

    // Set rounding mode to round towards zero (bits 23-22 = 01)
    fpscr = (fpscr & ~(3 << 22)) | (1 << 22);
    write_fpscr(fpscr);

    // Trigger an inexact exception
    float result = 1.0f / 3.0f;
    printf("Result = %f\n", result);

    // Check cumulative exception flags (bits 0-4)
    fpscr = read_fpscr();
    if (fpscr & (1 << 3)) {
        printf("Inexact exception flag set\n");
    }

    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'FPSCR read, modified, and flags checked'
+++

## Problem Statement

Read and modify the FPSCR (Floating-Point Status and Control Register). Change the rounding mode, then perform a floating-point operation that triggers an inexact result. After the operation, check the cumulative exception flags in the FPSCR to detect the inexact exception.

## Theory and Concepts

- The FPSCR contains control bits (rounding mode, flush-to-zero) and status bits (cumulative exception flags).
- Rounding mode bits (bits 23–22): 00 = Round nearest (RN), 01 = Round towards plus infinity (RP), 10 = Round towards minus infinity (RM), 11 = Round towards zero (RZ).
- Cumulative exception flags (bits 0–4): IOC (Invalid Operation), DZC (Division by Zero), OFC (Overflow), UFC (Underflow), IXC (Inexact).
- The flush-to-zero (FZ) bit enables denormal flushing for faster processing.
- The default NaN (DN) bit controls whether NaN propagation uses the default NaN.

## Real World Application

FPSCR control is essential in safety-critical applications (automotive, aerospace) where floating-point exceptions must be detected and handled. Changing rounding modes is used in numerical algorithms that require specific rounding behaviour (financial calculations, signal processing).

===EXPLANATION===

The Floating‑Point Status and Control Register (FPSCR) is the FPU's central control panel. It sits at a dedicated system register address (accessed via VMRS/VMSR) and governs three categories of behaviour: rounding mode, exception configuration, and cumulative status. Understanding FPSCR is essential for writing numerically reliable embedded software.

Rounding mode selection (bits 23‑22) controls how the FPU resolves results that cannot be exactly represented. The four IEEE 754 modes are: Round to Nearest (RN, 00) — the default, used by most algorithms for best accuracy; Round towards Plus Infinity (RP, 01) — used in interval arithmetic; Round towards Minus Infinity (RM, 10) — the complementary interval bound; and Round towards Zero (RZ, 11) — used in DSP applications where truncation is acceptable. Changing rounding mode is a single FPSCR write, but requires an ISB to take effect.

The flush‑to‑zero (FZ) bit and default NaN (DN) bit provide additional control. FZ (bit 24) replaces denormalised numbers with zero, dramatically improving performance on Cortex‑M FPUs where denormal handling takes up to 30 extra cycles per operation. DN (bit 25) forces all NaN results to a canonical "default NaN", simplifying comparison logic in control systems.

A signal processing pipeline illustrates practical FPSCR use: the decimator uses RN mode for best filter accuracy, while the FFT stage uses RZ mode for consistent bit‑exact results across platforms. The AHP (AHP bit, bit 26) selects alternative half‑precision behaviour. After each processing stage, the application reads FPSCR's cumulative flags to check for numerical anomalies.

Visualise the FPSCR as a mixing board in a recording studio. Each slider (bit field) controls a different aspect of the sound: the rounding knob selects the mastering curve, the FZ switch eliminates background hiss (denormals), the DN switch normalises how distorted sounds (NaNs) are handled, and the status LEDs (cumulative flags) light up when a channel is clipping.

Key points:
1. FPSCR is read via VMRS and written via VMSR — these are coprocessor register transfers.
2. Rounding mode affects all subsequent FPU operations until changed.
3. The cumulative exception flags are sticky across multiple operations.
4. AHP (Alternate Half‑Precision) selects IEEE 754 vs ARM alternative format for 16‑bit floats.
5. FPSCR must be saved and restored during context switches for FPU‑using tasks.


The ARM Architecture Reference Manual, "FPSCR" register description, documents all bit fields. The IEEE 754‑2008 standard specifies the rounding modes and exception semantics. CMSIS‑Core provides `__get_FPSCR()` and `__set_FPSCR()` access functions.
