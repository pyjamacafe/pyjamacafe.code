+++
date = '2026-07-06T15:02:00+05:30'
draft = false
title = 'ARMv6-M vs v7-M vs v8-M Differences'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 3
initial_code = '''// Compare ARMv6-M, ARMv7-M, ARMv8-M features
#include <stdio.h>

int main(void) {
    printf("ARM architecture version comparison:\\n\\n");
    printf("Feature          v6-M      v7-M      v8-M\\n");
    printf("------------------------------------------\\n");
    printf("Thumb-2          No        Yes       Yes\\n");
    printf("Hardware divide  No        Yes       Yes\\n");
    printf("MPU              No        Opt       Yes\\n");
    printf("FPU              No        Opt       Opt\\n");
    printf("TrustZone        No        No        Opt\\n");
    printf("Bit-banding      No        Opt       No\\n");
    printf("IT blocks        Limited   Full      Full\\n");
    printf("Saturation insns No        Yes       Yes\\n");

    // Write a table and determine which arch this core is
    // Provide advice on migration from v7-M to v8-M

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Architecture comparison table printed'
+++

## Problem Statement

Research and document the key differences between ARMv6-M (Cortex-M0/M0+/M1), ARMv7-M (Cortex-M3/M4/M7), and ARMv8-M (Cortex-M23/M33/M55) architectures. Write a program that prints a comparison table and then identifies which architecture the current core belongs to by reading the CPUID register.

## Theory and Concepts

- ARMv6-M: limited Thumb ISA (no Thumb-2), 16-bit instructions mostly, no hardware divide, no MPU, no FPU.
- ARMv7-M: full Thumb-2, hardware divide, MPU, optional FPU (M4/M7), bit-banding, saturation instructions, IT blocks for conditional execution.
- ARMv8-M: adds TrustZone security, removes bit-banding, adds new instructions (SG, TT), improved MPU with secure/non-secure regions.
- Migration from v7-M to v8-M: remove bit-banding code, adapt MPU configuration, add TrustZone support if needed.
- The ISA is backward-compatible at the source level but may require linker script and startup changes.

## Real World Application

Understanding architecture differences is essential when porting firmware between different ARM Cortex-M families. A project moving from Cortex-M4 to Cortex-M33 (v7-M to v8-M) must account for TrustZone, MPU changes, and the removal of bit-banding.
