+++
date = '2026-07-06T10:11:00+05:30'
draft = false
title = 'NSC Region Configuration with SAU'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 2
initial_code = '''// Configure NSC regions using the SAU
#include <stdio.h>
#include <stdint.h>

#define SAU_CTRL    (*((volatile uint32_t *)0xE000EDD0))
#define SAU_TYPE    (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RNR     (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RBAR    (*((volatile uint32_t *)0xE000EDD8))
#define SAU_RLAR    (*((volatile uint32_t *)0xE000EDDC))

#define SAU_REGION_ENABLE   1
#define SAU_REGION_NSC      (1UL << 1)

void sau_configure_region(uint32_t region, uint32_t base,
                          uint32_t limit, uint32_t attrs) {
    SAU_RNR = region;
    SAU_RBAR = base;
    SAU_RLAR = (limit & 0xFFFFFFC0) | SAU_REGION_ENABLE | attrs;

    printf("SAU Region %u: 0x%08X - 0x%08X [%s]\\n",
           region, base, limit,
           (attrs & SAU_REGION_NSC) ? "NSC" : "NS");
}

int main(void) {
    printf("Configuring SAU with NSC region\\n");

    sau_configure_region(0, 0x00000000, 0x001FFFFF, 0);
    sau_configure_region(1, 0x00200000, 0x00200FFF, SAU_REGION_NSC);
    sau_configure_region(2, 0x20000000, 0x3FFFFFFF, 0);

    SAU_CTRL = 1;

    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("SAU enabled: Region 0=Secure, 1=NSC, 2=Non-Secure\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Configure the SAU (Security Attribution Unit) to define three memory regions: a Secure region covering the full code area (0x00000000-0x001FFFFF), an NSC region for secure gateway functions (0x00200000-0x00200FFF), and a Non-Secure region for the rest of memory (0x20000000-0x3FFFFFFF). Enable the SAU and verify the configuration.

## Theory and Concepts

- SAU defines security attributes for each memory region: Secure, Non-Secure (NS), or Non-Secure Callable (NSC).
- NSC regions are Non-Secure memory that can contain SG instructions as entry points.
- SAU_RBAR holds the base address (aligned to 32 bytes).
- SAU_RLAR includes the upper limit address plus the enable bit and NSC attribute bit.
- Each SAU region has variable size from 32 bytes to 4 GB (power of 2 alignment required in v8.0-M, any alignment in v8.1-M).
- The IDAU may override SAU settings. If IDAU and SAU disagree, the more secure attribute wins.
- SAU_CTRL enables the SAU. Before enabling, all memory is Secure by default.
- The number of SAU regions is implementation defined (read from SAU_TYPE).

## Real World Application

TrustZone deployments must carefully partition memory between secure and non-secure worlds. NSC regions are particularly important as they define the attack surface — every non-secure to secure transition must go through a properly configured NSC entry point.

