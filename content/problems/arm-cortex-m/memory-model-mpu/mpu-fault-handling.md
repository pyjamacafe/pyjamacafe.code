+++
date = '2026-07-06T10:09:00+05:30'
draft = false
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

    printf("MemManage Fault Status (MFSR):\\n");
    printf("  IACCVIOL: %d\\n", (mfsr >> 0) & 1);
    printf("  DACCVIOL: %d\\n", (mfsr >> 1) & 1);
    printf("  MUNSTKERR: %d\\n", (mfsr >> 3) & 1);
    printf("  MSTKERR: %d\\n", (mfsr >> 4) & 1);
    printf("  MLSPERR: %d\\n", (mfsr >> 5) & 1);
    printf("  MMARVALID: %d\\n", (mfsr >> 7) & 1);

    if (mfsr & MFSR_MMARV) {
        printf("  Fault address (MMAR): 0x%08X\\n", SCB_MMAR);
    }
}

void cause_mpu_fault(void) {
    uint32_t *bad_ptr = (uint32_t *)0x00001000;
    uint32_t val = *bad_ptr;
    (void)val;
}

void HardFault_Handler(void) {
    printf("Hard Fault! Checking MemManage status...\\n");
    print_mpu_fault_status();

    while (1);
}

int main(void) {
    printf("Testing MPU fault handling\\n");
    printf("Enabling MPU with restricted region...\\n");

    cause_mpu_fault();
    printf("Survived (fault was handled)\\n");

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

