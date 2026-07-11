+++
date = '2026-07-06T10:09:00+05:30'
draft = true
title = 'MPU Fault Handling and Analysis'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 5
initial_code = '''// Analyze and handle MPU faults
#include <stdio.h>
#include <stdint.h>

#define SCB_CFSR  (*((volatile uint32_t *)0xE000ED28))
#define SCB_MMAR  (*((volatile uint32_t *)0xE000ED34))

#define MFSR_MSTKE  (1UL << 0)
#define MFSR_MSTERR (1UL << 4)
#define MFSR_MMARV  (1UL << 7)

void print_mpu_fault_status(void) {
    uint32_t cfsr = SCB_CFSR;
    uint32_t mfsr = cfsr & 0xFF;

    printf("MemManage Fault Status (MFSR):\n");
    printf("  IACCVIOL: %d\n", (mfsr >> 0) & 1);
    printf("  DACCVIOL: %d\n", (mfsr >> 1) & 1);
    printf("  MUNSTKERR: %d\n", (mfsr >> 3) & 1);
    printf("  MSTKERR: %d\n", (mfsr >> 4) & 1);
    printf("  MLSPERR: %d\n", (mfsr >> 5) & 1);
    printf("  MMARVALID: %d\n", (mfsr >> 7) & 1);

    if (mfsr & MFSR_MMARV) {
        printf("  Fault address (MMAR): 0x%08X\n", SCB_MMAR);
    }
}

void cause_mpu_fault(void) {
    uint32_t *bad_ptr = (uint32_t *)0x00001000;
    uint32_t val = *bad_ptr;
    (void)val;
}

void HardFault_Handler(void) {
    printf("Hard Fault! Checking MemManage status...\n");
    print_mpu_fault_status();

    while (1);
}

int main(void) {
    printf("Testing MPU fault handling\n");
    printf("Enabling MPU with restricted region...\n");

    cause_mpu_fault();
    printf("Survived (fault was handled)\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a fault handler that captures and decodes MPU (MemManage) fault information. Configure an MPU region that excludes a specific memory area, then deliberately try to access it to trigger a fault. The handler should read the CFSR and MMAR registers to print the fault status and the address that caused the fault.

## Theory and Concepts

- MemManage faults occur when the MPU detects an access violation: instruction fetch from a disallowed region, data access violation, or exception stacking/unstacking to a disallowed region.
- CFSR (Configurable Fault Status Register) contains three sub-status registers: MFSR (MemManage), BFSR (BusFault), UFSR (UsageFault).
- MFSR bits: IACCVIOL, DACCVIOL, MSTKERR, MUNSTKERR, MLSPERR, MMARVALID.
- MMAR (MemManage Address Register) holds the faulting address when MMARVALID is set.
- The fault handler must clear the fault status bits before returning to avoid repeated faults.
- HardFault is escalated if MemManage fault handler is not enabled or if a fault occurs in the handler.
- MPU faults can be synchronous (precise) or asynchronous depending on the access type.

## Real World Application

MPU fault handlers are essential for safety-critical systems to detect memory access violations, log diagnostic information, and safely recover or shut down. Automotive ISO 26262 and medical IEC 62304 standards require memory protection and fault analysis.

===EXPLANATION===

MPU fault handling was introduced with the Cortex-M3 (ARMv7-M) alongside the MPU itself. The architecture provides the MemManage fault handler — one of the three configurable fault exceptions (together with BusFault and UsageFault) that escalate to HardFault if unhandled. The Configurable Fault Status Register (CFSR) at `0xE000ED28` contains three 8-bit sub-registers: MFSR (MemManage) at bytes [7:0], BFSR (BusFault) at bytes [15:8], and UFSR (UsageFault) at bytes [31:16]. The MemManage Address Register (MMAR) at `0xE000ED34` captures the faulting address if MMARVALID is set. This diagnostic information is invaluable for debugging memory corruption.

The intuition: a MemManage fault is the MPU saying "you shall not pass." It occurs in three situations: (1) IACCVIOL — the CPU tried to fetch an instruction from a non-executable region; (2) DACCVIOL — a data load/store to a region without permission; (3) MSTKERR/MUNSTKERR — the automatic exception stacking/unstacking tried to access a forbidden region. Case (3) is particularly insidious because the fault handler itself cannot stack — the processor escalates directly to HardFault. This is why many production systems implement a "double fault" handler.

In professional firmware, MPU fault analysis is critical for ISO 26262 (automotive) and IEC 62304 (medical). Zephyr's `fault.c` in `arch/arm/core/cortex_m/` decodes the CFSR and prints a human-readable diagnosis, including the fault address and the exact instruction that caused it. FreeRTOS's `vApplicationMPUFaultHandler` is a weak callback that users override to log and reset. The Linux kernel's `armv7m_fault_handler` in `arch/arm/mm/fault.c` reads MFSR to distinguish MPU faults from bus faults and delivers SIGSEGV to the offending task. CMSIS-Core provides `SCB->CFSR` and `SCB->MMFAR` fields in the `SCB_Type` struct for portable access.

Visualize the fault analysis flow: read CFSR → isolate MFSR (low byte) → check MMARVALID → read MMAR → decode IACCVIOL/DACCVIOL/MSTKERR → clear sticky bits by writing 1 to them → return. The sticky bits persist until explicitly cleared — a handler that returns without clearing will immediately re-enter on the next instruction.

Key points:
1. MemManage faults are precise (synchronous) — the PC in the stacked frame points to the faulting instruction.
2. Stacking/unstacking faults (MSTKERR/MUNSTKERR) escalate to HardFault — the MMAR may not be valid.
3. CFSR bits are "write-1-to-clear" — always clear them before returning from the handler.
4. If MemManage handler is not enabled (SHCSR[16] = 0), faults escalate to HardFault.
5. The fault address in MMAR is valid only when MMARVALID = 1 — check before using it.


References:
1. ARMv7-M ARM (DDI0403) B5.2, ARMv8-M ARM (DDI0553) B5.2, Zephyr `arch/arm/core/cortex_m/fault.c`, FreeRTOS `port.c` MPU fault handling, CMSIS-Core `core_cm.h` SCB struct.
