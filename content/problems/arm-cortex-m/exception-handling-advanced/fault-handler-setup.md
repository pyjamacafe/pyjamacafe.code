+++
date = '2026-07-06T10:36:00+05:30'
draft = false
title = 'Fault Handler Setup and Registration'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 9
weight = 1
initial_code = '''// Set up and register fault handlers
#include <stdio.h>
#include <stdint.h>

#define SCB_SHCSR   (*((volatile uint32_t *)0xE000ED24))
#define SCB_CFSR    (*((volatile uint32_t *)0xE000ED28))
#define SCB_HFSR    (*((volatile uint32_t *)0xE000ED2C))
#define SCB_DFSR    (*((volatile uint32_t *)0xE000ED30))

#define SHCSR_MEMFAULTENA  (1UL << 16)
#define SHCSR_BUSFAULTENA  (1UL << 17)
#define SHCSR_USGFAULTENA  (1UL << 18)

void __attribute__((naked)) HardFault_Handler(void) {
    __asm volatile(
        "TST LR, #4         \\n\\t"
        "ITE EQ              \\n\\t"
        "MRSEQ R0, MSP      \\n\\t"
        "MRSNE R0, PSP      \\n\\t"
        "B hardfault_c_handler \\n\\t"
    );
}

void hardfault_c_handler(uint32_t *stacked_frame) {
    printf("=== HARD FAULT ===\\n");
    printf("Stacked PC: 0x%08X\\n", stacked_frame[6]);
    printf("Stacked LR: 0x%08X\\n", stacked_frame[5]);
    printf("Stacked xPSR: 0x%08X\\n", stacked_frame[7]);

    uint32_t hfsr = SCB_HFSR;
    uint32_t cfsr = SCB_CFSR;

    if (hfsr & (1UL << 30)) printf("  Forced HardFault (escalated)\\n");
    if (hfsr & (1UL << 1))  printf("  Vector table read fault\\n");
    if (cfsr & 0xFF)        printf("  MemManage fault active\\n");
    if (cfsr & 0xFF00)      printf("  BusFault active\\n");
    if (cfsr & 0xFF0000)    printf("  UsageFault active\\n");

    SCB_CFSR = cfsr;
    SCB_HFSR = hfsr;

    while (1);
}

int main(void) {
    printf("Cortex-M Fault Handler Setup\\n\\n");

    SCB_SHCSR |= SHCSR_MEMFAULTENA | SHCSR_BUSFAULTENA | SHCSR_USGFAULTENA;
    printf("Fault handlers enabled (SHCSR: 0x%08X)\\n", SCB_SHCSR);

    printf("\\nFault types:\\n");
    printf("  HardFault   - Escalated faults, vector fetch errors\\n");
    printf("  MemManage   - MPU violations\\n");
    printf("  BusFault    - Memory access errors\\n");
    printf("  UsageFault  - Undefined instructions, unaligned access\\n");

    volatile uint32_t *bad_ptr = (uint32_t *)0xFFFFFFFF;
    uint32_t val = *bad_ptr;
    (void)val;

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a complete fault handler setup that enables the MemManage, BusFault, and UsageFault handlers via SCB_SHCSR, implements a HardFault handler that captures the stacked frame and decodes the fault cause from CFSR and HFSR, and demonstrates the handler by triggering a fault.

## Theory and Concepts

- Four fault exceptions: HardFault, MemManage, BusFault, UsageFault.
- MemManage, BusFault, UsageFault are configurable and must be enabled via SHCSR.
- If a configurable fault handler is not enabled, the fault escalates to HardFault.
- Forced HardFault (HFSR bit 30): HardFault caused by escalation, not by a direct fault.
- CFSR (Configurable Fault Status Register) contains the cause of MemManage, BusFault, UsageFault.
- HFSR (HardFault Status Register): forced [30], vector table read [1], debug [0].
- The stacked PC points to the instruction that caused the fault.
- Fault handlers must clear the fault status bits before returning to avoid immediate re-entry.

## Real World Application

Production embedded firmware uses fault handlers to log diagnostic data (stacked registers, fault address, cause) before performing a safe reset. This data is essential for post-mortem debugging, especially in field-returned devices.

