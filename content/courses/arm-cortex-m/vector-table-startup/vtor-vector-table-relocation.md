+++
date = '2026-07-06T10:42:00+05:30'
draft = true
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

    printf("Vector table relocated from 0x%08X to 0x%08X\n",
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

    printf("VTOR Vector Table Relocation\n\n");
    printf("Original vector table at: 0x%08X\n", original_vtor);

    for (int i = 0; i < 4; i++) {
        printf("  Entry %u: 0x%08X\n", i,
               (uint32_t)read_vector_entry(i));
    }

    relocate_vector_table(0x20000000);
    printf("\nAfter relocation:\n");
    printf("  VTOR: 0x%08X\n", SCB_VTOR);

    for (int i = 0; i < 4; i++) {
        printf("  Entry %u: 0x%08X\n", i,
               (uint32_t)read_vector_entry(i));
    }

    printf("\nVTOR is %s aligned\n",
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

===EXPLANATION===

Picture a building where the main switchboard is fixed in the lobby. If a new tenant moves into a higher floor and needs their own switchboard, they cannot move the lobby — they must install a secondary board and tell everyone to route calls there instead. VTOR (Vector Table Offset Register) at address 0xE000ED08 is exactly that mechanism: it tells the Cortex-M processor where to find the vector table, freeing it from its hardwired position at address zero.

Before VTOR existed, ARM processors (ARM7TDMI, ARM9) mandated the vector table at 0x00000000. This made bootloaders almost impossible — the application always had to occupy the reset vector position. Cortex-M changed everything by introducing VTOR in the System Control Block. A single write to bits [31:7] of VTOR relocates the entire exception dispatch. Bits [6:0] are reserved and must be zero, enforcing 128-byte alignment (256-byte on Cortex-M0/M0+). After updating VTOR, the code must execute a Data Synchronization Barrier (DSB) to ensure the write reaches the register, followed by an Instruction Synchronization Barrier (ISB) to flush the prefetch buffer so subsequent exception entries use the new table.

A professional bootloader typically works in stages. Stage 1 (the ROM bootloader) runs from flash base, initializes the hardware, and loads stage 2 or the application image into flash at a higher offset (e.g., 0x08040000 on an STM32 with 2 MB of flash). Stage 2 then copies the vector table from that flash offset into SRAM — because flash is slower and may be busy with read-while-write operations — and points VTOR to the SRAM copy. The application never needs to know it is relocated; it simply enables interrupts and the hardware dereferences the relocated table.

The trickiest part is ensuring the copied vector table is byte-for-byte identical to the original. A memcpy of all 48 entries (or however many the MCU supports) is usually enough, but the alignment constraint means the destination buffer must be allocated on a 128-byte or 256-byte boundary. Some RTOS kernels use a designated section in the linker script (e.g., .ram_vectors) with the appropriate alignment attribute. On ARMv8-M with TrustZone, VTOR is banked — there is a secure VTOR and a non-secure VTOR — and the security attribution unit must allow the non-secure world to relocate its own table.

Key points:
1. VTOR is at SCB->VTOR (0xE000ED08) and holds the table base in bits [31:7].
2. Always issue DSB + ISB after writing VTOR.
3. The destination must be aligned to 128 bytes (256 bytes for Cortex-M0/M0+).
4. Copy all entries — including the initial SP and Reset_Handler — before switching.
5. On ARMv8-M, remember that secure and non-secure VTOR are independent. Reference: ARMv7-M Architecture Reference Manual, section B3.2.5 (SCB->VTOR).
