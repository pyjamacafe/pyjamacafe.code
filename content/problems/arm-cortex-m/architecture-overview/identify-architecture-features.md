+++
date = '2026-07-06T15:00:00+05:30'
draft = false
title = 'Identify ARMv8-M Architecture Features'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 1
initial_code = '''// Use CMSIS-Core macros to identify CPU features
#include <stdio.h>
#include "CMSIS/core_cm33.h"  // Simulated

int main(void) {
    // Print CPU ID register
    // Check if FPU is present
    // Check if MPU is present
    // Print revision and part number

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'ARMv8-M architecture features identified'
+++

## Problem Statement

Write a program that reads the CPU ID register (CPUID) and System Control Block ID registers to identify the ARMv8-M architecture version, part number, revision, and optional features (FPU, MPU, TrustZone). Use the appropriate CMSIS-Core macros or direct register reads.

## Theory and Concepts

- The CPUID register (SCB->CPUID) contains implementer, variant, architecture, part number, and revision fields.
- The System Control Block contains ID registers that indicate optional features: FPU, MPU, TrustZone, and debug capabilities.
- ARMv8-M Baseline (Cortex-M23) lacks many features present in Mainline (Cortex-M33/M55).
- CMSIS-Core provides standardized macros and functions to access these registers portably.
- Reading these registers at startup can help configure runtime behaviour conditionally based on features.

## Real World Application

Production firmware often reads CPU feature registers to enable or disable code paths — for example, enabling FPU context switching only when an FPU is present, or configuring MPU regions only when the MPU is implemented. This makes a single firmware binary run across multiple silicon revisions.
