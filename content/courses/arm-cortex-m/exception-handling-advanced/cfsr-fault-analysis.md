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

===EXPLANATION===

The Configurable Fault Status Register (CFSR) is the master diagnostic register for the Cortex-M fault system. It packs three sub-status registers — MFSR (MemManage Fault), BFSR (BusFault), and UFSR (UsageFault) — into a single 32-bit word at address 0xE000ED28. Decoding the CFSR is the first step in any fault analysis, whether during development debugging or post-mortem crash analysis.

The historical design consolidates what were separate registers in earlier ARM architectures into one readable block. This makes it possible to snapshot all fault status information in a single read operation — critical for fault handlers that need to log the complete state before a watchdog reset occurs.

The three sub-registers occupy non-overlapping bytes: MFSR at bits [7:0], BFSR at bits [15:8], and UFSR at bits [23:16]. Each sub-register has its own set of status bits. MFSR tracks MemManage faults: instruction access violations (IACCVIOL), data access violations (DACCVIOL), and faults during stacking and unstacking (MSTKERR, MUNSTKERR). BFSR tracks BusFaults: instruction bus errors (IBUSERR), precise data bus errors (PRECISERR), imprecise data bus errors (IMPRECISERR), and stacking/unstacking bus errors (STKERR, UNSTKERR). UFSR tracks UsageFaults: undefined instructions, invalid state, invalid PC, and unaligned access.

The precise vs imprecise distinction in BFSR is critical for diagnostic analysis. A precise BusFault means the exact instruction and address are known — BFAR (BusFault Address Register) contains the faulting address, and the stacked PC points to the instruction. An imprecise BusFault means the error occurred asynchronously, typically from a write buffer — the exact instruction is unknown, and BFAR is invalid. Imprecise faults are harder to debug because the PC context may have moved past the actual faulting access.

In professional firmware, the CFSR decoder is integrated into the crash reporter. When a fault occurs, the handler reads CFSR, HFSR, MMAR, BFAR, and the stacked PC, then logs them to flash. On the next boot, the firmware reads the log and outputs the human-readable analysis over a serial port. This system has saved countless hours of debugging in field-returned devices.

The escalation rules encoded in HFSR complement CFSR. When a configurable fault (MemManage, BusFault, UsageFault) occurs but its handler is not enabled, the fault escalates to HardFault, and HFSR bit 30 (FORCED) is set. This tells the debugger that the root cause is in one of the configurable fault sub-registers, not in an actual HardFault condition.

Visualize CFSR as a fault-tree diagram. Each bit is a leaf node that indicates a specific failure mode. The leaves are grouped into three branches (MFSR, BFSR, UFSR) that map to three handler types. The escalation rule is the trunk: if a branch is missing a handler, the trunk (HardFault) catches everything.

Key points: CFSR at 0xE000ED28 combines MFSR, BFSR, UFSR; MMAR/BFAR valid bits (bit 7 in MFSR/BFSR) indicate if address registers hold valid data; stacking/unstacking faults occur during exception entry/exit; precise faults provide exact fault address; write 1 to CFSR to clear status bits; LSPERR/MLSPERR indicate faults during lazy FPU state preservation.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B3.2.16 — CFSR), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 10.4), ARM Infocenter DDI0403E.

