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

===EXPLANATION===

The Security Attribution Unit (SAU) is the programmable security firewall of ARMv8‑M TrustZone. It divides the memory map into Secure, Non‑Secure, and Non‑Secure Callable (NSC) regions. The SAU works in concert with the Implementation Defined Attribution Unit (IDAU), which provides hardwired security attributes set by the silicon vendor. The final security of an address is the logical AND of IDAU and SAU attributes: secure only if both agree it is secure.

Why two units? The IDAU provides a fixed baseline that the chip designer controls — for example, marking the first 64 KB of flash as always secure for the boot ROM, or marking specific peripheral addresses as secure‑only. The SAU then lets secure firmware further restrict (but never relax) the IDAU's attribution. This two‑tier design prevents even secure software from accidentally exposing hardware‑protected resources.

A real TrustZone project typically configures 3‑5 SAU regions: one for the secure firmware's flash and RAM (secure), one for the non‑secure application's flash and RAM (non‑secure), and one NSC region containing the veneer table that securely callable functions use. The SAU is disabled by default, making the whole memory map non‑secure — secure firmware must enable and program it early in the boot sequence.

Visualise a museum with two security layers. The IDAU is the blueprint that says "the vault is always off‑limits" and "the gift shop is always public". The SAU is the day's guard schedule that adds "the restoration lab is secure today" — it can add restrictions but cannot override the blueprint.

Key points:
1. SAU regions have alignment constraints — base and limit must be 32‑byte aligned.
2. RLAR bit 0 enables the region; bit 1 sets NSC attribute.
3. If the SAU is disabled, the default (IDAU‑only) attribution applies.
4. Up to 8 SAU regions are available (implementation dependent).
5. The SAU's CTRL register's ENABLE bit controls the entire unit.
6. Non‑secure code cannot read or write SAU registers — access causes a secure fault.


ARM's *ARMv8‑M Architecture Reference Manual*, "Security Attribution" chapter, provides the SAU register specification. Silicon vendors document IDAU implementation in their device reference manuals, and Arm's *TrustZone for Cortex‑M User Guide* offers practical configuration examples.