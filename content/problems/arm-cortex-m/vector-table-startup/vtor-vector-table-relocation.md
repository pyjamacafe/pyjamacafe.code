+++
date = '2026-07-06T10:42:00+05:30'
draft = false
title = 'VTOR Vector Table Relocation'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 10
weight = 2
initial_code = '''// Relocate the vector table using VTOR
#include <stdio.h>
#include <stdint.h>

#define SCB_VTOR    (*((volatile uint32_t *)0xE000ED08))

typedef void (*handler_t)(void);

extern uint32_t _sidata;
extern uint32_t _sdata;
extern uint32_t _edata;
extern uint32_t _sbss;
extern uint32_t _ebss;

handler_t relocated_vector_table[16 + 32] __attribute__((section(".ram_vector_table")));

void relocate_vector_table(uint32_t new_base) {
    uint32_t old_base = SCB_VTOR & 0xFFFFFF80;

    for (int i = 0; i < 48; i++) {
        handler_t *old_vt = (handler_t *)old_base;
        relocated_vector_table[i] = old_vt[i];
    }

    SCB_VTOR = (uint32_t)relocated_vector_table & 0xFFFFFF80;

    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("Vector table relocated from 0x%08X to 0x%08X\\n",
           old_base, (uint32_t)relocated_vector_table & 0xFFFFFF80);
}

uint32_t get_vector_table_address(void) {
    return SCB_VTOR & 0xFFFFFF80;
}

handler_t read_vector_entry(uint32_t index) {
    uint32_t vt_base = get_vector_table_address();
    handler_t *vt = (handler_t *)vt_base;
    return vt[index];
}

int main(void) {
    uint32_t original_vtor = get_vector_table_address();

    printf("VTOR Vector Table Relocation\\n\\n");
    printf("Original vector table at: 0x%08X\\n", original_vtor);

    for (int i = 0; i < 4; i++) {
        printf("  Entry %u: 0x%08X\\n", i,
               (uint32_t)read_vector_entry(i));
    }

    relocate_vector_table(0x20000000);
    printf("\\nAfter relocation:\\n");
    printf("  VTOR: 0x%08X\\n", SCB_VTOR);

    for (int i = 0; i < 4; i++) {
        printf("  Entry %u: 0x%08X\\n", i,
               (uint32_t)read_vector_entry(i));
    }

    printf("\\nVTOR is %s aligned\\n",
           (SCB_VTOR & 0x7F) ? "NOT" : "128-byte");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that relocates the vector table from flash to SRAM using the Vector Table Offset Register (VTOR). Copy the entire vector table (all 48 entries) to a RAM-based array, update VTOR to point to the new location, and verify by reading entries from the relocated table.

## Theory and Concepts

- VTOR (SCB->VTOR at 0xE000ED08) holds the base address of the vector table.
- VTOR must be aligned to 128 bytes (256 bytes on Cortex-M0/M0+).
- Bits [31:7] hold the table base; bits [6:0] are reserved.
- To relocate: copy the existing table to the new location, set VTOR, then DSB + ISB.
- VTOR is banked in ARMv8-M with TrustZone (secure and non-secure copies).
- Bootloaders typically run from flash, then relocate the vector table to SRAM for the application.
- Some MCUs have a fixed boot ROM with the vector table; application code must relocate.
- After VTOR change, all subsequent interrupts use the new vector table.

## Real World Application

Vector table relocation is essential for bootloader applications: the bootloader runs from the beginning of flash, then the application at a higher flash address relocates the vector table to its own vector table in RAM or the application flash section.

