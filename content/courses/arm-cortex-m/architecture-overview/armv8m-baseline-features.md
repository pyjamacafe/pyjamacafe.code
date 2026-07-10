+++
date = '2026-07-06T10:19:00+05:30'
draft = false
title = 'ARMv8-M Baseline Feature Set'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 4
initial_code = '''// Detect ARMv8-M Baseline core features
#include <stdio.h>
#include <stdint.h>

#define SCB_CPUID  (*((volatile uint32_t *)0xE000ED00))

typedef struct {
    uint32_t implementer;
    uint32_t variant;
    uint32_t architecture;
    uint32_t part_no;
    uint32_t revision;
} cpuid_fields_t;

cpuid_fields_t decode_cpuid(uint32_t cpuid) {
    cpuid_fields_t f;
    f.implementer   = (cpuid >> 24) & 0xFF;
    f.variant       = (cpuid >> 20) & 0xF;
    f.architecture  = (cpuid >> 16) & 0xF;
    f.part_no       = (cpuid >> 4) & 0xFFF;
    f.revision      = cpuid & 0xF;
    return f;
}

int main(void) {
    uint32_t cpuid = SCB_CPUID;
    cpuid_fields_t f = decode_cpuid(cpuid);

    printf("CPUID: 0x%08X\n", cpuid);
    printf("Implementer:  0x%02X (%s)\n",
           f.implementer, f.implementer == 0x41 ? "ARM" : "Other");
    printf("Variant:      0x%X\n", f.variant);
    printf("Architecture: 0x%X ", f.architecture);

    switch (f.architecture) {
        case 2: printf("ARMv6-M\n"); break;
        case 3: printf("ARMv7-M\n"); break;
        case 4: printf("ARMv8-M\n"); break;
        default: printf("Unknown\n"); break;
    }

    printf("Part number:  0x%03X ", f.part_no);
    if (f.part_no == 0xD22) printf("(Cortex-M23 - Baseline)\n");

    printf("Revision:     %u\n", f.revision);

    if (f.part_no == 0xD22) {
        printf("\n=> ARMv8-M Baseline: No FPU, No DSP, optional MPU\n");
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that reads the CPUID register and determines whether the current core is an ARMv8-M Baseline core (Cortex-M23). Extract the implementer, variant, architecture version, part number, and revision. Print the feature set expected for Baseline cores: no FPU, no DSP extension, and an optional MPU.

## Theory and Concepts

- ARMv8-M Baseline (Cortex-M23) is the successor to ARMv6-M (Cortex-M0/M0+).
- Baseline cores use a subset of the Thumb ISA, primarily 16-bit instructions.
- ARMv8-M Baseline adds TrustZone security to the Baseline class.
- Features: MPU is optional, no FPU, no DSP extensions, no bit-banding.
- The part number for Cortex-M23 is 0xD22.
- ARMv8-M Baseline supports the SG instruction and SAU for TrustZone.
- Interrupt latency is very low (12-15 cycles) due to the simplified pipeline.

## Real World Application

ARMv8-M Baseline cores are used in ultra-low-power IoT devices, medical sensors, and battery-powered wearables where energy efficiency is critical, but TrustZone security is required.

===EXPLANATION===

ARMv8-M Baseline, embodied by the Cortex-M23, was announced in 2016 as the evolutionary replacement for the Cortex-M0+. The headline addition was TrustZone security — the first time a Baseline-class core could enforce hardware isolation. But everything else about the M23 remained deliberately minimal: no FPU, no DSP extensions, and the MPU is optional (most implementations omit it). ARM's engineers made a strategic decision: the ultra-low-power market needed security more than it needed DSP or floating-point. The M23's pipeline is a simple two-stage fetch-execute (same as M0+), keeping interrupt latency at a blistering 12 cycles and gate count under 12k.

The mental model for ARMv8-M Baseline is: "what if an M0+ could run secure and non-secure code?" The ISA is identical to ARMv6-M — only 56 Thumb instructions, no IT blocks beyond the single conditional, no hardware divide, no saturating math, no bit-banding. What changes is the security architecture: the SAU (Security Attribution Unit), the SG (Secure Gateway) instruction, and the banked stack pointers and NVIC for secure/non-secure separation. The M23 is the smallest processor that can achieve PSA Certified Level 1.

In professional firmware, ARMv8-M Baseline appears in constrained devices where every microamp matters. Zephyr RTOS supports M23 with the `cortex_m23` architecture variant in `soc/arm/arm/`, which disables FPU context switching, uses minimal fault handlers, and provides TrustZone driver support via `arm_trustzone.c`. FreeRTOS's Cortex-M23 port uses the same `portasm.S` as M0+ but adds secure gateway trampolines. The mbed OS TZ-DVK (TrustZone Demonstration Kit) runs on M23 to showcase secure firmware update and attestation. In the CMSIS-Pack ecosystem, flash algorithms for M23-based devices (e.g., NXP LPC55S16) use the Baseline Memory Protection Unit (if present) but typically run with MPU disabled.

Visualize the M23 die as the M0+ die with the SAU and a second set of register banks squeezed into the same area — the security extension costs roughly 15-20% more gates but doubles the functionality. The ISA Venn diagram is the same 56-instruction subset, but the memory map now has two colours: Secure (blue) and Non-Secure (grey).

Key points:
1. Part number 0xD22, architecture field 0x4.
2. No hardware divide — use software division or avoid division.
3. No unprivileged thread mode — the CONTROL register is fixed.
4. TrustZone is optional per chip — check the SAU_CTRL availability.
5. The vector table is banked between Secure and Non-Secure worlds.
6. Interrupt latency of 12 cycles is the lowest of any Cortex-M with security.


References:
1. ARM Cortex-M23 Technical Reference Manual (DDI0579), ARMv8-M Baseline Architecture (DDI0553), CMSIS-Core `core_cm23.h`, Zephyr M23 port in `arch/arm/core/cortex_m/`, PSA Certified Level 1 requirements.
