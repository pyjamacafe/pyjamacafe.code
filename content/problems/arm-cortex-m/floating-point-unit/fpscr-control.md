+++
date = '2026-07-06T18:19:00+05:30'
draft = false
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
    printf("FPSCR = 0x%08X\\n", fpscr);

    // Set rounding mode to round towards zero (bits 23-22 = 01)
    fpscr = (fpscr & ~(3 << 22)) | (1 << 22);
    write_fpscr(fpscr);

    // Trigger an inexact exception
    float result = 1.0f / 3.0f;
    printf("Result = %f\\n", result);

    // Check cumulative exception flags (bits 0-4)
    fpscr = read_fpscr();
    if (fpscr & (1 << 3)) {
        printf("Inexact exception flag set\\n");
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
