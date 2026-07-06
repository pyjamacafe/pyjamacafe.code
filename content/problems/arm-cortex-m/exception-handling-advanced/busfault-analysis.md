+++
date = '2026-07-06T10:38:00+05:30'
draft = false
title = 'BusFault Analysis and Recovery'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 9
weight = 3
initial_code = '''// Analyze BusFault and attempt recovery
#include <stdio.h>
#include <stdint.h>

#define SCB_BFAR    (*((volatile uint32_t *)0xE000ED38))
#define SCB_CFSR    (*((volatile uint32_t *)0xE000ED28))
#define SCB_HFSR    (*((volatile uint32_t *)0xE000ED2C))

volatile uint32_t last_fault_pc = 0;
volatile uint32_t last_fault_addr = 0;
volatile uint32_t last_fault_type = 0;

void BusFault_Handler(void) {
    uint32_t cfsr = SCB_CFSR;
    uint32_t bfsr = (cfsr >> 8) & 0xFF;

    printf("\\n=== BUS FAULT ===\\n");

    if (bfsr & (1 << 0)) printf("Instruction bus error\\n");
    if (bfsr & (1 << 1)) printf("Precise data bus error\\n");
    if (bfsr & (1 << 2)) printf("Imprecise data bus error\\n");
    if (bfsr & (1 << 3)) printf("Bus fault on unstacking\\n");
    if (bfsr & (1 << 4)) printf("Bus fault on stacking\\n");

    if (bfsr & (1 << 7)) {
        last_fault_addr = SCB_BFAR;
        printf("Fault address (BFAR): 0x%08X\\n", last_fault_addr);
    }

    last_fault_type = bfsr;

    if (bfsr & (1 << 1)) {
        printf("Precise fault - can retry after fixing address\\n");
    } else if (bfsr & (1 << 2)) {
        printf("Imprecise fault - cannot determine fault address\\n");
    }

    SCB_CFSR = cfsr & 0x0000FF00;

    printf("Fault logged. Continuing...\\n");
}

void cause_busfault(void) {
    volatile uint32_t *bad_ptr = (uint32_t *)0xE000ED00;
    bad_ptr = (uint32_t *)((uint32_t)bad_ptr + 0x10000000);
    uint32_t val = *bad_ptr;
    (void)val;
}

volatile uint32_t data_ok = 0;

uint32_t safe_read(uint32_t *addr) {
    uint32_t val;

    __asm volatile(
        "LDREX %0, [%1]   \\n\\t"
        : "=r" (val)
        : "r" (addr)
    );

    return val;
}

int main(void) {
    printf("BusFault Analysis and Recovery\\n\\n");

    SCB_SHCSR |= (1UL << 17);
    printf("BusFault handler enabled\\n");

    cause_busfault();

    printf("\\nRecovery simulation:\\n");
    printf("Last fault PC:  0x%08X\\n", last_fault_pc);
    printf("Last fault addr: 0x%08X\\n", last_fault_addr);

    printf("\\nAvoiding bus faults:\\n");
    printf("  - Check address validity before access\\n");
    printf("  - Use MPU to block invalid regions\\n");
    printf("  - Use safe_read with fault handler\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a BusFault handler that captures and analyzes bus error information. Read the BFSR (BusFault Status Register) to determine if the fault was precise or imprecise, instruction or data access, and during stacking/unstacking. Read BFAR if valid, log the fault, and demonstrate attempted recovery.

## Theory and Concepts

- BusFault occurs when a bus transaction returns an error response (no device at address, access violation).
- Precise BusFault: the exact address and instruction that caused the fault are known. BFAR contains the address.
- Imprecise BusFault: the bus error occurred, but the exact instruction/address is not known. Common with write buffers.
- IBUSERR: instruction fetch bus error (precise by nature).
- PRECISERR: precise data access bus error. BFAR contains the faulting address.
- IMPRECISERR: imprecise data bus error. BFAR is not valid.
- STKERR: bus error during exception stacking. UNSTKERR: bus error during unstacking.
- BusFaults during exception entry escalate to HardFault if not enabled.

## Real World Application

Memory-mapped I/O accesses to peripherals that are powered down or clock-gated cause BusFaults. Robust drivers use BusFault handlers to detect missing hardware and gracefully degrades functionality rather than crashing.

