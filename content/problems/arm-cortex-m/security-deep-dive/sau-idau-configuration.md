+++
date = '2026-07-06T18:16:00+05:30'
draft = false
title = 'SAU and IDAU Configuration'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 17
weight = 4
initial_code = '''#include <stdio.h>

#define SAU_CTRL   (*(volatile unsigned int *)0xE000EDD0)
#define SAU_RNR    (*(volatile unsigned int *)0xE000EDD4)
#define SAU_RBAR   (*(volatile unsigned int *)0xE000EDD8)
#define SAU_RLAR   (*(volatile unsigned int *)0xE000EDDC)

void sau_configure_region(int region, unsigned int base, unsigned int limit, int ns) {
    SAU_RNR = region;
    SAU_RBAR = base & 0xFFFFFFE0;           // Aligned to 32 bytes
    SAU_RLAR = (limit & 0xFFFFFFE0) | (1 << 0) | ((ns & 1) << 1);
    // RLAR bit 0: ENABLE
    // RLAR bit 1: NSC (non-secure callable)
}

int main(void) {
    // Enable SAU
    SAU_CTRL = 1;

    // Region 0: entire flash as non-secure
    sau_configure_region(0, 0x00000000, 0x000FFFFF, 1);
    // Region 1: SRAM as non-secure
    sau_configure_region(1, 0x20000000, 0x2000FFFF, 1);
    // Region 2: part of flash as secure
    sau_configure_region(2, 0x10000000, 0x10000FFF, 0);

    printf("SAU configured\\n");
    return 0;
}
'''
[[test_cases]]
input = ''
expected = 'SAU regions configured'
+++

## Problem Statement

Configure the SAU (Security Attribution Unit) to define secure and non-secure memory regions. Create regions for flash, SRAM, and peripherals with appropriate security attributes. Explain the interaction between the SAU and the IDAU (Implementation Defined Attribution Unit).

## Theory and Concepts

- The SAU provides programmable security attribution for the memory map in ARMv8-M.
- Each SAU region has a base address, limit address, and security attributes (Secure/Non-Secure/Non-Secure Callable).
- The SAU works alongside the IDAU, which provides fixed (hardwired) security attributes.
- The final security attribute of an address is: IDAU attribution ANDed with SAU attribution (if enabled). If the IDAU marks an address as secure and the SAU marks it as non-secure, the result is non-secure.
- Region 0 is special: if the SAU is disabled, a default region determines the security state (typically all non-secure).
- The SAU can define up to 8 regions (depends on implementation).

## Real World Application

SAU configuration is the core of TrustZone memory protection — it defines which parts of flash, RAM, and peripherals are secure (only accessible to secure code) and which are non-secure. Every TrustZone project must configure the SAU during secure firmware initialisation.
