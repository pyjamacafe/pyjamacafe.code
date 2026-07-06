+++
date = '2026-07-06T15:01:00+05:30'
draft = false
title = 'Baseline vs Mainline Feature Detection'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 2
initial_code = '''// Detect whether the core is Baseline or Mainline
#include <stdio.h>

#define SCB_CPUID  (*((volatile unsigned int *)0xE000ED00))

int main(void) {
    unsigned int cpuid = SCB_CPUID;
    unsigned int arch  = (cpuid >> 4) & 0xF;
    unsigned int part  = (cpuid >> 4) & 0xFFF;

    // Architecture: 0x2 = ARMv6-M, 0x3 = ARMv7-M, 0x4 = ARMv8-M
    // Part number: 0xC20 = M0, 0xC60 = M0+, 0xD20 = M3, 0xD24 = M4,
    //              0xD21 = M33, 0xD22 = M23, 0xD23 = M55

    printf("Architecture: 0x%X\\n", arch);
    printf("Part number: 0x%X\\n", part);

    // Determine Baseline vs Mainline based on features
    // (Baseline has no MPU, no FPU, limited instruction set)

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Baseline vs Mainline detected'
+++

## Problem Statement

Read the CPUID register and decode the architecture version and part number to distinguish between ARMv8-M Baseline (Cortex-M23) and Mainline (Cortex-M33/M55) cores. Compare the features each supports: MPU, FPU, DSP extension, TrustZone, and instruction set.

## Theory and Concepts

- ARMv8-M Baseline (Cortex-M23): thumb-only, no MPU, no FPU, no DSP extensions, no bit-banding, TrustZone optional.
- ARMv8-M Mainline (Cortex-M33/M35P/M55): full Thumb-2, MPU, optional FPU and DSP, TrustZone, security extensions.
- Baseline is designed for ultra-low-power, cost-sensitive applications; Mainline for higher-performance embedded.
- The part number in CPUID identifies the exact core.
- Some chips implement ARMv8-M Mainline without all optional features — always detect at runtime.

## Real World Application

Feature detection enables a single firmware image to run on different MCU variants (e.g., Cortex-M33 with and without FPU). Automotive and industrial applications often require this to support multiple chip grades with different feature sets.
