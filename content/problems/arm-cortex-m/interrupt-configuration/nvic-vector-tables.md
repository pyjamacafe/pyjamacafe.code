+++
date = '2026-07-06T10:24:00+05:30'
draft = false
title = 'NVIC Vector Table and Interrupt Mapping'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 6
weight = 4
initial_code = '''// Map NVIC interrupts to vector table entries
#include <stdio.h>
#include <stdint.h>

#define VECTOR_TABLE_BASE 0x00000000

typedef void (*vector_entry_t)(void);

extern void Default_Handler(void);
void IRQ0_Handler(void);
void IRQ1_Handler(void);

vector_entry_t const vector_table[16 + 2] __attribute__((section(".isr_vector"))) = {
    (vector_entry_t)0x20001000,
    (vector_entry_t)Default_Handler,
    [16 + 0] = IRQ0_Handler,
    [16 + 1] = IRQ1_Handler,
};

void map_irq_to_handler(uint32_t irq_num, const char *handler) {
    uint32_t vector_offset = 16 + irq_num;
    printf("IRQ%u -> VT[%u] -> %s\\n", irq_num, vector_offset, handler);
}

const char* irq_handlers[32];

void register_handler(uint32_t irq_num, const char *name) {
    if (irq_num < 32) {
        irq_handlers[irq_num] = name;
    }
}

void print_vector_mappings(void) {
    printf("\\nSystem exception vectors:\\n");
    printf("  [0]  Initial SP value\\n");
    printf("  [1]  Reset\\n");
    printf("  [2]  NMI\\n");
    printf("  [3]  HardFault\\n");
    printf("  [11] SVCall\\n");
    printf("  [14] PendSV\\n");
    printf("  [15] SysTick\\n");

    printf("\\nExternal interrupt vectors (offset 16):\\n");
    for (int i = 0; i < 32; i++) {
        if (irq_handlers[i] != NULL) {
            map_irq_to_handler(i, irq_handlers[i]);
        }
    }
}

int main(void) {
    register_handler(0, "TIM0_IRQHandler");
    register_handler(1, "UART0_IRQHandler");
    register_handler(10, "DMA_IRQHandler");

    print_vector_mappings();

    printf("\\nTotal IRQs mapped: ");
    int count = 0;
    for (int i = 0; i < 32; i++) {
        if (irq_handlers[i]) count++;
    }
    printf("%d\\n", count);

    return 0;
}

void IRQ0_Handler(void) { printf("IRQ0 handled\\n"); }
void IRQ1_Handler(void) { printf("IRQ1 handled\\n"); }
void Default_Handler(void) { while (1); }
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the mapping between NVIC interrupt numbers and vector table entries. External interrupt N corresponds to vector table entry (16 + N). Create a data structure that registers handler names for each IRQ number and prints the complete mapping from IRQ number through the vector table to the handler function.

## Theory and Concepts

- The vector table starts at address 0x00000000 (or VTOR-aligned address).
- The first 16 entries are system exceptions: Reset, NMI, HardFault, MemManage, BusFault, UsageFault, SVCall, PendSV, SysTick, etc.
- External interrupts start at entry 16. IRQ #0 maps to vector table slot 16.
- Each vector table entry is a 4-byte function pointer (in Thumb mode, address has bit 0 set).
- On exception entry, the NVIC reads the handler address from the vector table based on the exception number.
- The vector table can be relocated by writing to VTOR (SCB->VTOR).
- On ARMv8-M with TrustZone, there are separate secure and non-secure vector tables.
- Interrupt handlers must be named exactly as listed in the vector table (or use weak aliases).

## Real World Application

Understanding vector table mapping is essential for writing startup code, configuring the NVIC, and implementing custom interrupt handlers. Bootloaders often relocate the vector table using VTOR to give the application control over interrupts.

===EXPLANATION===

The vector table is the spinal cord of the Cortex-M exception system — every exception, from Reset to the highest-numbered external interrupt, gets its handler address from this table. Its design descends directly from the ARM7TDMI vector table, but the Cortex-M made two crucial innovations: it relocated system exceptions into the lower 16 entries and made the table relocatable via VTOR.

The mapping rule is deceptively simple: external interrupt N lives at vector table index (16 + N). The first 16 entries belong to system exceptions: Reset at index 1, NMI at index 2, HardFault at index 3, MemManage at 4, BusFault at 5, UsageFault at 6, SVCall at 11, PendSV at 14, and SysTick at 15. Entry 0 holds the initial stack pointer value — the processor loads SP from this address on reset, before jumping to the Reset handler.

The intuition behind the offset of 16 is one of numbering hygiene. System exceptions are numbered 1–15 by the processor's internal exception numbering. External interrupts start at exception number 16 (which is IRQ 0). The vector table index equals the exception number. So IRQ 0 → exception 16 → vector table slot 16. This consistency means the NVIC can compute the handler address in a single cycle: `vector_table_base + exception_number * 4`.

In professional firmware, vector table relocation via VTOR is how bootloaders hand control to applications. The bootloader runs at the flash base address (0x00000000) with its own vector table. Before jumping to the application at offset 0x40000, it writes `VTOR = 0x00040000`. The NVIC then reads handler addresses from the application's vector table. This mechanism is essential for over-the-air update systems where the bootloader must remain in place while the application is upgraded.

Visualize the vector table as a hotel directory in a lobby. The first 16 listings (system exceptions) are the hotel staff — manager, security, maintenance. Listings 16 and above are guest rooms (external interrupts). The index tells you exactly which room to call.

Key points: entry 0 holds the initial SP (not a handler); each entry is 4 bytes; addresses must have bit 0 set for Thumb state; VTOR must be 128-byte aligned; on ARMv8-M with TrustZone, there are separate Secure and Non-Secure vector tables; weak aliases are commonly used for unhandled interrupts.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.6.2 — Vector Table), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 7 — Vector Table), ARM Infocenter DDI0403E.

