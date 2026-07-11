+++
date = '2026-07-06T15:00:00+05:30'
draft = true
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

===EXPLANATION===

The CPUID register at `0xE000ED00` has been part of the Cortex-M System Control Block since the M0. Its layout is constant across all revisions: bits [31:24] = implementer (0x41 for ARM), [23:20] = variant, [19:16] = architecture, [15:4] = part number, [3:0] = revision. The architecture field is the cleanest discriminator: 0x2 = ARMv6-M (M0/M0+/M1), 0x3 = ARMv7-M (M3/M4/M7), 0x4 = ARMv8-M (M23/M33/M55), 0x5 = ARMv8.1-M (M55/M85). The part number narrows it to the exact core — 0xD21 is M33, 0xD22 is M23, 0xD23 is M55, etc. Reading CPUID takes one instruction (`MRC` or `LDR` from the alias address).

The intuition: your MCU is a black box at power-on. The CPUID is its identity card — before you touch any peripheral, you read it to learn what hardware is actually present. Silicon vendors frequently ship multiple part numbers from the same die with different feature fuses. A single firmware image can detect `CPUID` at cold boot and branch accordingly. This is exactly what CMSIS-Core's `__get_CPUID()` and `SCB->CPUID` abstraction provides, along with `__FPU_PRESENT`, `__MPU_PRESENT`, `__DSP_PRESENT`, and `__TZ_PRESENT` macros that vendors set in device header files.

In professional practice, Zephyr's `arch/arm/core/cortex_m/arm_cortexm_cpu_id.c` decodes CPUID at boot to populate the `arm_cortexm_cpu_id` struct used by the kernel for feature-based code paths. FreeRTOS `port.c` for Cortex-M33 reads `SCB->CPUID` to decide whether to configure floating-point context save. The Linux kernel's `arch/arm/mm/init.c` calls `cpu_architecture()` which reads MMFR0/MMFR1 (not CPUID, but the concept is identical) to determine cache line sizes and TLB organisation. Mbed OS uses `SYS_INFO_CPU_ID()` in its boot sequence to select the correct startup assembly. CMSIS-Pack flash algorithms read CPUID to validate that the connected target matches the image.

Visualize the register as a bitfield diagram: the top byte is ARM's vendor code (0x41), next nibble is the chip stepping (revision), then architecture version, then a 12-bit part number, then minor revision. This is the same format used across all Cortex-A/R/M processors since ARMv7 — it is the universal CPU identifier in the ARM ecosystem.

Key points:
1. CPUID is read-only and architecturally defined; you cannot fake it.
2. Architecture field 0x4 does not tell you Baseline vs Mainline — check the part number for that.
3. System Control Block ID registers at `0xE000EDE0-0xE000EDFC` provide optional feature presence (FPU, MPU, TrustZone, debug).
4. CMSIS-Core macros are the portable way; raw register reads are for bring-up.
5. Always assume the hardware may have unexpected features — probe, don't presume.


References:
1. ARMv8-M Architecture Reference Manual (DDI0553), CMSIS-Core 5.9.0 `core_cm33.h`, Zephyr `arch/arm/core/arm_cortexm_cpu_id.c`, ARM Cortex-M3/M4/M7 CPUID example code in CMSIS-Pack.
