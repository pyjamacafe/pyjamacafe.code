+++
date = '2026-07-06T10:41:00+05:30'
draft = false
title = 'Vector Table Layout and Initialization'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 10
weight = 1
initial_code = '''// Define and initialize a Cortex-M vector table
#include <stdio.h>
#include <stdint.h>

typedef void (*handler_t)(void);

extern void _estack(void);
void Reset_Handler(void);
void NMI_Handler(void);
void HardFault_Handler(void);
void Default_Handler(void);

handler_t __attribute__((section(".isr_vector")))
vector_table[16 + 32] = {
    (handler_t)&_estack,
    Reset_Handler,
    NMI_Handler,
    HardFault_Handler,
    [4]  = Default_Handler,
    [5]  = Default_Handler,
    [6]  = Default_Handler,
    [7]  = Default_Handler,
    [8]  = Default_Handler,
    [9]  = Default_Handler,
    [10] = Default_Handler,
    [11] = Default_Handler,
    [12] = Default_Handler,
    [13] = Default_Handler,
    [14] = Default_Handler,
    [15] = Default_Handler,
    [16 + 0]  = Default_Handler,
    [16 + 1]  = Default_Handler,
};

void print_vector_entry(uint32_t index, handler_t handler) {
    uint32_t addr = (uint32_t)handler;
    printf("  [%2u] 0x%08X", index, addr);
    if (handler == Default_Handler) {
        printf(" (Default)");
    }
    printf("\\n");
}

int main(void) {
    printf("Cortex-M Vector Table Layout\\n\\n");

    printf("Exception table (first 16 entries):\\n");
    for (int i = 0; i < 16; i++) {
        print_vector_entry(i, vector_table[i]);
    }

    printf("\\nExternal interrupts (entries 16+):\\n");
    for (int i = 0; i < 4; i++) {
        print_vector_entry(16 + i, vector_table[16 + i]);
    }

    printf("\\nEntry 0 (SP)     = stack pointer initial value\\n");
    printf("Entry 1 (Reset)  = reset handler address\\n");
    printf("Entry 2 (NMI)    = non-maskable interrupt handler\\n");
    printf("Entry 3 (Hard)   = hard fault handler\\n");
    printf("Entry 11 (SVC)   = supervisor call handler\\n");
    printf("Entry 14 (PendSV)= pendSV handler (RTOS context switch)\\n");
    printf("Entry 15 (SysTck)= system tick timer handler\\n");

    return 0;
}

void Reset_Handler(void) { printf("Reset Handler called\\n"); }
void NMI_Handler(void) {}
void HardFault_Handler(void) { while (1); }
void Default_Handler(void) { while (1); }
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Define a complete Cortex-M vector table in C. The vector table must include the initial stack pointer, the 16 system exception vectors (Reset, NMI, HardFault, MemManage, BusFault, UsageFault, SVCall, PendSV, SysTick, etc.), and at least 32 external interrupt vectors. Use weak default handlers that loop forever.

## Theory and Concepts

- The vector table is an array of function pointers (each 4 bytes) starting at address 0x00000000 (or VTOR).
- Entry 0: Initial Main Stack Pointer (MSP) value.
- Entry 1: Reset_Handler — the entry point after reset.
- Entries 2-15: system exception handlers. Entries 16+: external interrupt handlers.
- The LSB of each entry must be 1 to indicate Thumb state.
- Unused entries should have a default handler to catch unexpected interrupts.
- In ARMv8-M with TrustZone, there are separate secure and non-secure vector tables.
- The vector table must be at a 256-byte aligned address (128-byte for Cortex-M0/M0+).
- Many compilers use the .isr_vector section to place the table at the correct address.

## Real World Application

Every Cortex-M project requires a vector table as the first code structure. Bootloaders, application firmware, and RTOS-integrated projects all define vector tables. Understanding the layout is essential for setting up interrupts correctly.

