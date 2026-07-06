+++
date = '2026-07-06T10:37:00+05:30'
draft = false
title = 'CFSR Fault Status Analysis'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 9
weight = 2
initial_code = '''// Decode the Configurable Fault Status Register
#include <stdio.h>
#include <stdint.h>

void analyze_cfsr(uint32_t cfsr) {
    uint32_t mfsr = cfsr & 0xFF;
    uint32_t bfsr = (cfsr >> 8) & 0xFF;
    uint32_t ufsr = (cfsr >> 16) & 0xFF;

    printf("CFSR: 0x%08X\\n", cfsr);
    printf("  MFSR: 0x%02X (MemManage)\\n", mfsr);
    printf("  BFSR: 0x%02X (BusFault)\\n", bfsr);
    printf("  UFSR: 0x%04X (UsageFault)\\n\\n", ufsr);

    if (mfsr) {
        printf("MemManage Fault:\\n");
        if (mfsr & (1 << 0)) printf("  IACCVIOL: Instruction fetch from invalid addr\\n");
        if (mfsr & (1 << 1)) printf("  DACCVIOL: Data access to invalid addr\\n");
        if (mfsr & (1 << 3)) printf("  MUNSTKERR: MPU fault on unstacking\\n");
        if (mfsr & (1 << 4)) printf("  MSTKERR: MPU fault on stacking\\n");
        if (mfsr & (1 << 5)) printf("  MLSPERR: MPU fault on lazy FPU save\\n");
        if (mfsr & (1 << 7)) printf("  MMARVALID: MMAR holds valid fault addr\\n");
    }

    if (bfsr) {
        printf("BusFault:\\n");
        if (bfsr & (1 << 0)) printf("  IBUSERR: Instruction bus error\\n");
        if (bfsr & (1 << 1)) printf("  PRECISERR: Precise data bus error\\n");
        if (bfsr & (1 << 2)) printf("  IMPRECISERR: Imprecise data bus error\\n");
        if (bfsr & (1 << 3)) printf("  UNSTKERR: Bus fault on unstacking\\n");
        if (bfsr & (1 << 4)) printf("  STKERR: Bus fault on stacking\\n");
        if (bfsr & (1 << 5)) printf("  LSPERR: Bus fault on lazy FPU save\\n");
        if (bfsr & (1 << 7)) printf("  BFARVALID: BFAR holds valid fault addr\\n");
    }

    if (ufsr) {
        printf("UsageFault:\\n");
        if (ufsr & (1 << 0)) printf("  UNDEFINSTR: Undefined instruction\\n");
        if (ufsr & (1 << 1)) printf("  INVSTATE: Invalid state (EPSR corruption)\\n");
        if (ufsr & (1 << 2)) printf("  INVPC: Invalid PC (EXC_RETURN or load)\\n");
        if (ufsr & (1 << 3)) printf("  NOCP: No coprocessor access\\n");
        if (ufsr & (1 << 8)) printf("  UNALIGNED: Unaligned access\\n");
        if (ufsr & (1 << 9)) printf("  DIVBYZERO: Division by zero\\n");
    }
}

int main(void) {
    printf("CFSR Fault Analysis Tool\\n\\n");

    uint32_t test_faults[] = {
        0x00000001,
        0x00000100,
        0x00010000,
        0x00000303,
        0x00010301
    };

    const char *descriptions[] = {
        "MPU instruction fetch violation",
        "Precise bus error",
        "Undefined instruction",
        "MPU stacking fault + Bus error",
        "MPU violation + Undefined instruction"
    };

    for (int i = 0; i < 5; i++) {
        printf("=== Test Case %d: %s ===\\n\\n", i + 1, descriptions[i]);
        analyze_cfsr(test_faults[i]);
        printf("\\n");
    }

    printf("Fault escalation rules:\\n");
    printf("  - If MemManage/BusFault/UsageFault not enabled -> HardFault\\n");
    printf("  - BusFault during exception entry -> HardFault\\n");
    printf("  - Fault in fault handler -> Lockup\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a CFSR analysis tool that decodes every bit of the Configurable Fault Status Register. Support all sub-status registers: MFSR (MemManage), BFSR (BusFault), UFSR (UsageFault). Test the decoder with various fault status values and print human-readable descriptions of each active fault condition.

## Theory and Concepts

- CFSR is three 8-bit status registers packed into one 32-bit register at 0xE000ED28.
- MFSR [7:0]: IACCVIOL, DACCVIOL, (reserved), MUNSTKERR, MSTKERR, MLSPERR, (reserved), MMARVALID.
- BFSR [15:8]: IBUSERR, PRECISERR, IMPRECISERR, UNSTKERR, STKERR, LSPERR, (reserved), BFARVALID.
- UFSR [23:16]: UNDEFINSTR, INVSTATE, INVPC, NOCP, (reserved), UNALIGNED, DIVBYZERO.
- Precise: fault address known (BFAR/MMAR valid). Imprecise: fault address unknown.
- Stacking/unstacking faults occur when stacking/unstacking causes a bus/MPU fault.
- LSPERR: lazy floating-point state preservation fault.
- Bit 7 of MFSR/BFSR indicates whether MMAR/BFAR contains the fault address.

## Real World Application

Fault analysis tools (like the one in this problem) are integrated into debug firmware to automatically decode crash causes and report them over a serial or debug interface, enabling rapid root-cause analysis of system crashes.

