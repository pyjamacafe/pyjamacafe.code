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
        "TST LR, #4         \n\\t"
        "ITE EQ              \n\\t"
        "MRSEQ R0, MSP      \n\\t"
        "MRSNE R0, PSP      \n\\t"
        "B hardfault_c_handler \n\\t"
    );
}

void hardfault_c_handler(uint32_t *stacked_frame) {
    printf("=== HARD FAULT ===\n");
    printf("Stacked PC: 0x%08X\n", stacked_frame[6]);
    printf("Stacked LR: 0x%08X\n", stacked_frame[5]);
    printf("Stacked xPSR: 0x%08X\n", stacked_frame[7]);

    uint32_t hfsr = SCB_HFSR;
    uint32_t cfsr = SCB_CFSR;

    if (hfsr & (1UL << 30)) printf("  Forced HardFault (escalated)\n");
    if (hfsr & (1UL << 1))  printf("  Vector table read fault\n");
    if (cfsr & 0xFF)        printf("  MemManage fault active\n");
    if (cfsr & 0xFF00)      printf("  BusFault active\n");
    if (cfsr & 0xFF0000)    printf("  UsageFault active\n");

    SCB_CFSR = cfsr;
    SCB_HFSR = hfsr;

    while (1);
}

int main(void) {
    printf("Cortex-M Fault Handler Setup\n\n");

    SCB_SHCSR |= SHCSR_MEMFAULTENA | SHCSR_BUSFAULTENA | SHCSR_USGFAULTENA;
    printf("Fault handlers enabled (SHCSR: 0x%08X)\n", SCB_SHCSR);

    printf("\nFault types:\n");
    printf("  HardFault   - Escalated faults, vector fetch errors\n");
    printf("  MemManage   - MPU violations\n");
    printf("  BusFault    - Memory access errors\n");
    printf("  UsageFault  - Undefined instructions, unaligned access\n");

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

===EXPLANATION===

Fault handler setup is the safety net of every production embedded system. While developers spend most of their time writing application code, the fault handlers are the emergency systems that catch crashes, log diagnostics, and perform safe shutdowns. Getting them right is arguably more important than the application code itself — because when the application fails, only the fault handler stands between a graceful reset and a catastrophic lockup.

The historical evolution of Cortex-M fault handling reflects the increasing safety requirements of embedded systems. Early ARM processors had only a single Undefined Instruction and Abort handler. The Cortex-M introduced multiple configurable fault handlers — MemManage, BusFault, UsageFault — each capable of catching a specific class of errors. The SHCSR register was created to enable these handlers individually, since not all applications need or want all three (each disabled fault escalates to HardFault, simplifying the handler for simple systems).

The HardFault handler is special: it cannot be disabled, and it is the final destination for all unhandled faults. Its entry sequence must handle the EXC_RETURN bit 4 to determine whether the stack frame is on MSP or PSP. The standard pattern — `TST LR, #4; ITE EQ; MRSEQ R0, MSP; MRSNE R0, PSP; B handler_c` — extracts the correct stack pointer and branches to a C function. This is one of the few places where inline assembly is unavoidable in Cortex-M firmware.

The intuition behind enabling all three configurable handlers is simple: more information is better. A BusFault tells you exactly which address caused the error. A MemManage fault tells you which MPU region was violated. A UsageFault tells you it was a division by zero or an undefined instruction. If all three are disabled, every one of these conditions escalates to HardFault, and you only know that "something bad happened."

In professional firmware, the HardFault handler captures a full diagnostic payload: the stacked registers (R0–R3, R12, LR, PC, xPSR), the CFSR and HFSR values, and optionally the MMAR or BFAR address. This data is stored in a reserved RAM region that survives a software reset. On the next boot, the startup code checks a magic number in this region, and if present, transmits the crash data over UART, USB, or stores it in flash for later retrieval.

The diagnostic output from a well-written fault handler reads like an aircraft black box: "HardFault at PC=0x08001234, LR=0x08001100. CFSR=0x00010000 (UNDEFINSTR). Stacked xPSR=0x21000000. Crash occurred in function 'process_command' at line 142 of command.c."

Visualize the fault handler system as emergency responders in a building. The UsageFault handler is the fire alarm in the kitchen — it knows exactly what's cooking. The BusFault handler is the structural integrity monitor — it knows which beam failed. The MemManage handler is the security guard — it knows which door was forced open. The HardFault handler is the emergency dispatcher — it coordinates the response and, if all else fails, calls for a full evacuation (system reset).

Key points: HardFault is always enabled; SHCSR enables MemManage, BusFault, UsageFault; the HardFault entry must decode EXC_RETURN for stack pointer selection; fault handlers must clear status bits to prevent immediate re-entry; CFSR + HFSR + stacked PC form a complete diagnostic payload; stored crash data should include a magic number for boot-time detection.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.5.8–B1.5.11), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 10.5), ARM Infocenter DDI0403E.

