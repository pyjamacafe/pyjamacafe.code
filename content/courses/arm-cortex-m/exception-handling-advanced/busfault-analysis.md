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

    printf("\n=== BUS FAULT ===\n");

    if (bfsr & (1 << 0)) printf("Instruction bus error\n");
    if (bfsr & (1 << 1)) printf("Precise data bus error\n");
    if (bfsr & (1 << 2)) printf("Imprecise data bus error\n");
    if (bfsr & (1 << 3)) printf("Bus fault on unstacking\n");
    if (bfsr & (1 << 4)) printf("Bus fault on stacking\n");

    if (bfsr & (1 << 7)) {
        last_fault_addr = SCB_BFAR;
        printf("Fault address (BFAR): 0x%08X\n", last_fault_addr);
    }

    last_fault_type = bfsr;

    if (bfsr & (1 << 1)) {
        printf("Precise fault - can retry after fixing address\n");
    } else if (bfsr & (1 << 2)) {
        printf("Imprecise fault - cannot determine fault address\n");
    }

    SCB_CFSR = cfsr & 0x0000FF00;

    printf("Fault logged. Continuing...\n");
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
        "LDREX %0, [%1]   \n\\t"
        : "=r" (val)
        : "r" (addr)
    );

    return val;
}

int main(void) {
    printf("BusFault Analysis and Recovery\n\n");

    SCB_SHCSR |= (1UL << 17);
    printf("BusFault handler enabled\n");

    cause_busfault();

    printf("\nRecovery simulation:\n");
    printf("Last fault PC:  0x%08X\n", last_fault_pc);
    printf("Last fault addr: 0x%08X\n", last_fault_addr);

    printf("\nAvoiding bus faults:\n");
    printf("  - Check address validity before access\n");
    printf("  - Use MPU to block invalid regions\n");
    printf("  - Use safe_read with fault handler\n");

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

===EXPLANATION===

BusFault is the Cortex-M's mechanism for reporting memory access errors. When a bus transaction — whether an instruction fetch, a data load, or a data store — returns an error response, the processor records the failure in the BusFault Status Register (BFSR) and, if enabled, invokes the BusFault handler. Understanding the precise vs imprecise distinction is the key to effective BusFault analysis.

The historical origin of BusFault lies in the ARM system bus architecture. The Cortex-M uses the AHB-Lite or AMBA-5 bus protocol, where every transaction includes an error response signal (HRESP or HREADYOUT). Peripheral devices or memory controllers assert this signal when an access is invalid — attempting to read from a non-existent address, accessing a powered-down peripheral, or violating a bus-level protection scheme.

The precise vs imprecise distinction is fundamental. A precise BusFault occurs when the fault is directly associated with the instruction currently executing. The stacked PC points to the faulting instruction, and BFAR (BusFault Address Register) contains the exact address that caused the error. Precise faults are the easy ones to debug — you know exactly which instruction and which address. An imprecise BusFault occurs when the fault is associated with a buffered write. The Cortex-M has a write buffer that holds pending store transactions. If a buffered write later fails, the processor may have moved on to subsequent instructions. The stacked PC points somewhere after the actual faulting store, and BFAR is invalid.

In professional firmware, BusFault handlers implement a capability-detection pattern. Some microcontrollers have multiple silicon revisions where certain peripherals may be absent or memory regions may have varying sizes. The firmware probes memory-mapped registers with a guarded read that traps BusFaults. If the BusFault handler fires, the driver marks that peripheral as absent and degrades gracefully. This allows a single firmware binary to run across multiple chip variants.

The stacking/unstacking BusFault types (STKERR, UNSTKERR) are particularly dangerous because they occur during exception entry or exit. A BusFault during stacking means the processor could not save its state — the stack frame is corrupted. Recovery is typically impossible because the processor state is already partially overwritten. The best the handler can do is log whatever information is available and reset.

BusFault during vector table read (VECTBL bit in HFSR) is a special case: the processor cannot fetch the HardFault handler address from the vector table, typically because the vector table itself resides in inaccessible memory. This causes immediate lockup.

Visualize a BusFault as a package delivery attempt to an invalid address. A precise BusFault is like the courier returning with "address does not exist" — you know exactly which address failed. An imprecise BusFault is like the courier accepting the package, then the sorting facility later discovering the address is invalid — you know a package failed, but not exactly which one.

Key points: BFAR contains the faulting address for precise BusFaults; BFARVALID flag confirms BFAR content validity; imprecise faults originate from buffered writes; STKERR/UNSTKERR occur during exception entry/exit; BusFault during vector table fetch causes lockup; precise BusFaults can potentially be recovered by fixing the address; always clear BFSR before returning from the handler.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.5.9 — BusFault), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 10.2), ARM Infocenter DDI0403E.

