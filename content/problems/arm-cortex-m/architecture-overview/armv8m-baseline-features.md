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

    printf("CPUID: 0x%08X\\n", cpuid);
    printf("Implementer:  0x%02X (%s)\\n",
           f.implementer, f.implementer == 0x41 ? "ARM" : "Other");
    printf("Variant:      0x%X\\n", f.variant);
    printf("Architecture: 0x%X ", f.architecture);

    switch (f.architecture) {
        case 2: printf("ARMv6-M\\n"); break;
        case 3: printf("ARMv7-M\\n"); break;
        case 4: printf("ARMv8-M\\n"); break;
        default: printf("Unknown\\n"); break;
    }

    printf("Part number:  0x%03X ", f.part_no);
    if (f.part_no == 0xD22) printf("(Cortex-M23 - Baseline)\\n");

    printf("Revision:     %u\\n", f.revision);

    if (f.part_no == 0xD22) {
        printf("\\n=> ARMv8-M Baseline: No FPU, No DSP, optional MPU\\n");
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

