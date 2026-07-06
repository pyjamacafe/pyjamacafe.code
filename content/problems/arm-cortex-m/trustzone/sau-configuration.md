+++
date = '2026-07-06T10:12:00+05:30'
draft = false
title = 'SAU Configuration for Memory Isolation'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 3
initial_code = '''// Program SAU regions for secure/non-secure isolation
#include <stdio.h>
#include <stdint.h>

#define SAU_CTRL    (*((volatile uint32_t *)0xE000EDD0))
#define SAU_TYPE    (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RNR     (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RBAR    (*((volatile uint32_t *)0xE000EDD8))
#define SAU_RLAR    (*((volatile uint32_t *)0xE000EDDC))

typedef struct {
    uint32_t base;
    uint32_t limit;
    uint32_t attrs;
} sau_region_t;

void sau_init(const sau_region_t *regions, uint32_t count) {
    uint32_t num_regions = SAU_TYPE & 0xFF;

    printf("SAU supports %u regions\\n", num_regions);

    SAU_CTRL = 0;
    __asm volatile("DSB" ::: "memory");

    for (uint32_t i = 0; i < count && i < num_regions; i++) {
        SAU_RNR = i;
        SAU_RBAR = regions[i].base;
        SAU_RLAR = (regions[i].limit & 0xFFFFFFC0) | 1 | regions[i].attrs;
    }

    SAU_CTRL = 1;
    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");
}

int main(void) {
    sau_region_t config[] = {
        {0x00000000, 0x001FFFFF, 0},
        {0x00200000, 0x00200FFF, (1UL << 1)},
        {0x20000000, 0x2000FFFF, 0},
        {0x40000000, 0x5FFFFFFF, 0},
    };
    uint32_t num_config = sizeof(config) / sizeof(config[0]);

    printf("Initializing SAU with %u regions\\n", num_config);
    sau_init(config, num_config);

    uint32_t sau_ctrl = SAU_CTRL;
    printf("SAU enabled: %s\\n", (sau_ctrl & 1) ? "YES" : "NO");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a function that initializes the SAU with a given table of region configurations. Disable the SAU before configuring, program all regions, then re-enable it. Include a helper that prints the current SAU configuration and checks that the number of programmed regions does not exceed the hardware limit from SAU_TYPE.

## Theory and Concepts

- SAU must be disabled (CTRL=0) before modifying region descriptors.
- SAU_TYPE register indicates the number of implemented regions (bits [7:0]) and whether there is an IDAU (bit [8]).
- SAU_RNR selects the region register bank to program (0 to N-1).
- SAU_RBAR must be aligned to the region size. In ARMv8.0-M, size must be a power of 2; v8.1-M allows arbitrary alignment.
- SAU_RLAR: bits [31:6] = limit address, bit [1] = NSC, bit [0] = enable.
- The more restrictive security attribute wins when regions overlap: Secure > NSC > Non-Secure.
- After re-enabling SAU, a DSB and ISB are required for the new configuration to take effect.
- Unused SAU regions should have their enable bit cleared.

## Real World Application

A properly configured SAU is the foundation of any TrustZone-based system. PSA Certified security models require SAU configuration to enforce isolation between secure and non-secure worlds, protecting assets like cryptographic keys, secure storage, and trusted firmware.

