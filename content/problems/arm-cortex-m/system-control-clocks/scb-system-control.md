+++
date = '2026-07-06T10:28:00+05:30'
draft = false
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
    printf("SCB State:\\n");
    printf("  CPUID:  0x%08X\\n", SCB_CPUID);
    printf("  ICSR:   0x%08X\\n", SCB_ICSR);
    printf("  VTOR:   0x%08X\\n", SCB_VTOR);
    printf("  AIRCR:  0x%08X\\n", SCB_AIRCR);
    printf("  SCR:    0x%08X\\n", SCB_SCR);
    printf("  CCR:    0x%08X\\n", SCB_CCR);
    printf("  SHCSR:  0x%08X\\n", SCB_SHCSR);
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
    printf("System Control Block (SCB) Configuration\\n\\n");

    print_scb_state();

    printf("\\nEnabling BusFault and UsageFault handlers...\\n");
    enable_busfault_handler();
    enable_usagefault_handler();

    printf("SHCSR after enable: 0x%08X\\n", SCB_SHCSR);

    uint32_t icsr = SCB_ICSR;
    uint32_t pending_vector = icsr & 0x1FF;
    printf("\\nPending exception: %u\\n", pending_vector);

    uint32_t ipsr = icsr & 0xFF;
    printf("Current exception: %u\\n", ipsr);

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

