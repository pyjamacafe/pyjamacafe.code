+++
date = '2026-07-06T10:28:00+05:30'
draft = true
title = 'System Control Block Configuration'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 7
weight = 3
initial_code = '''// Configure System Control Block registers
#include <stdio.h>
#include <stdint.h>

#define SCB_CPUID   (*((volatile uint32_t *)0xE000ED00))
#define SCB_ICSR    (*((volatile uint32_t *)0xE000ED04))
#define SCB_VTOR    (*((volatile uint32_t *)0xE000ED08))
#define SCB_AIRCR   (*((volatile uint32_t *)0xE000ED0C))
#define SCB_SCR     (*((volatile uint32_t *)0xE000ED10))
#define SCB_CCR     (*((volatile uint32_t *)0xE000ED14))
#define SCB_SHCSR   (*((volatile uint32_t *)0xE000ED24))

void print_scb_state(void) {
    printf("SCB State:\n");
    printf("  CPUID:  0x%08X\n", SCB_CPUID);
    printf("  ICSR:   0x%08X\n", SCB_ICSR);
    printf("  VTOR:   0x%08X\n", SCB_VTOR);
    printf("  AIRCR:  0x%08X\n", SCB_AIRCR);
    printf("  SCR:    0x%08X\n", SCB_SCR);
    printf("  CCR:    0x%08X\n", SCB_CCR);
    printf("  SHCSR:  0x%08X\n", SCB_SHCSR);
}

void set_vector_table_offset(uint32_t offset) {
    SCB_VTOR = offset & 0xFFFFFF80;
    __asm volatile("DSB" ::: "memory");
}

void enable_busfault_handler(void) {
    SCB_SHCSR |= (1UL << 17);
}

void enable_usagefault_handler(void) {
    SCB_SHCSR |= (1UL << 18);
}

int main(void) {
    printf("System Control Block (SCB) Configuration\n\n");

    print_scb_state();

    printf("\nEnabling BusFault and UsageFault handlers...\n");
    enable_busfault_handler();
    enable_usagefault_handler();

    printf("SHCSR after enable: 0x%08X\n", SCB_SHCSR);

    uint32_t icsr = SCB_ICSR;
    uint32_t pending_vector = icsr & 0x1FF;
    printf("\nPending exception: %u\n", pending_vector);

    uint32_t ipsr = icsr & 0xFF;
    printf("Current exception: %u\n", ipsr);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that configures key System Control Block registers. Read and display the CPUID, ICSR, VTOR, AIRCR, SCR, CCR, and SHCSR registers. Implement functions to relocate the vector table via VTOR and enable the BusFault and UsageFault exception handlers.

## Theory and Concepts

- SCB is part of the System Control Space (SCS) at 0xE000ED00-0xE000EDFF.
- CPUID: identifies the processor core and revision.
- ICSR: shows current/pending exception numbers and provides Set-Pend/Clr-Pend for system exceptions.
- VTOR: vector table offset register. Must be 128-byte aligned (256-byte for Cortex-M0+).
- AIRCR: reset control, endianness, priority grouping (PRIGROUP).
- SCR: sleep mode control (SLEEPDEEP, SLEEPONEXIT, SEVONPEND).
- CCR: configures stack alignment, unaligned access behavior, and division by zero trapping.
- SHCSR: enables system fault handlers (MemManage, BusFault, UsageFault) and indicates active/pending state.

## Real World Application

Bootloaders use VTOR to relocate the vector table to the application address. Safety-critical firmware enables all fault handlers via SHCSR. Power management uses SCR bits. Understanding SCB is fundamental to Cortex-M system programming.

===EXPLANATION===

The System Control Block (SCB) is the configuration hub of the Cortex-M processor. Located in the System Control Space at 0xE000ED00, it provides software control over exception handling, vector table location, sleep modes, endianness, and fault configuration. It is the one-stop shop for system-level processor control.

The historical design of the SCB consolidates features that were scattered across multiple co-processor registers in earlier ARM architectures. The ARM7TDMI used CP15 for system control; the Cortex-M unified everything into a single memory-mapped block accessible without co-processor instructions. This makes the SCB accessible from C code via pointer dereference, no inline assembly required.

The CPUID register (0xE000ED00) is the simplest and most useful: it identifies the processor core and its revision. Reading it tells you whether you are running on a Cortex-M0 (0x410CC200), Cortex-M3 (0x412FC230), Cortex-M4 (0x410FC240), or Cortex-M33 (0x410FD213). This is essential for runtime feature detection in firmware that runs across multiple chip variants.

VTOR is arguably the most important register in the SCB for system software. It relocates the vector table to any 128-byte-aligned address. Bootloaders use it to hand off to applications. Dual-bank OTA systems use it to switch between bank A and bank B firmware images. On ARMv8-M with TrustZone, there are separate Secure VTOR and Non-Secure VTOR registers.

SHCSR controls which fault handlers are active. By default, only HardFault is enabled. Safety-critical applications must explicitly enable MemManage (bit 16), BusFault (bit 17), and UsageFault (bit 18) via SHCSR. Without this, any configurable fault escalates directly to HardFault, losing diagnostic information.

The AIRCR register is the system control nexus. It contains the PRIGROUP field for priority grouping, the SYSRESETREQ bit for software reset, and the ENDIANNESS indicator. Writing to AIRCR requires the VECTKEY value 0x05FA in the upper 16 bits to prevent accidental writes.

In professional firmware, the SCB is configured in the first few lines of the Reset handler. The startup code sets up VTOR, enables fault handlers via SHCSR, configures priority grouping via AIRCR, and optionally sets up the SysTick timer. Any system that does not configure these registers relies on reset defaults — which is fine for simple applications but inadequate for safety-critical or complex systems.

Visualize the SCB as the cockpit of an aircraft. CPUID shows the aircraft type. VTOR sets the navigation database location. AIRCR is the master control panel with reset and priority settings. SCR controls the autopilot sleep modes. CCR configures exception handling behavior. SHCSR arms the fault warning systems.

Key points: SCB base is 0xE000ED00; VTOR must be 128-byte aligned; AIRCR requires VECTKEY 0x05FA to write; SHCSR enables configurable fault handlers; reset defaults have only HardFault and NMI enabled; ICSR provides current and pending exception numbers.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B3.2 — System Control Block), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 7), ARM Infocenter DDI0403E.

