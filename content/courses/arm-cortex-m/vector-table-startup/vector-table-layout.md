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

===EXPLANATION===

The vector table is the very first thing the Cortex-M processor consults when it wakes from reset. Picture a switchboard in an old telephone exchange: each incoming line (exception or interrupt) has a jack, and the operator plugs the call into the correct destination. The vector table is that switchboard — a simple array of 32-bit function pointers starting at address 0x00000000 (or wherever VTOR points). Entry 0 holds the initial stack pointer value, loading it into the MSP before any instruction executes. Entry 1 holds the address of Reset_Handler, the first C function to run. Entries 2 through 15 cover system exceptions like NMI, HardFault, MemManage, BusFault, UsageFault, SVC, PendSV, and SysTick. Everything from entry 16 onward maps to external peripheral interrupts — timer, UART, GPIO, ADC, and so on.

This design is a dramatic improvement over earlier ARM architectures. On the ARM7TDMI, the vector table was just eight words of branch instructions (B or LDR) hardwired at 0x00000000, leaving almost no room for the interrupt controller's vectors. Cortex-M flipped the model: the table holds plain addresses, not instructions, and spans up to 496 entries on some implementations. Each entry must have its LSB set to 1 to indicate Thumb state — a detail that catches many newcomers when their HardFault_Handler mysteriously never fires.

In professional firmware, the vector table is usually placed in the .isr_vector section via linker script and filled with weak aliases to a Default_Handler that spins forever. The application overrides only the handlers it needs — SysTick_Handler for the OS tick, TIM2_IRQHandler for a PWM timer — and the linker quietly substitutes the strong definitions. A bootloader that chains to an application must either keep the vector table at 0x00000000 (and put the application higher in flash) or use VTOR to relocate the table to the application's base address. Some safety-critical systems put two copies of the vector table in flash: one for the bootloader, one for the application, with VTOR switching between them during the reset sequence.

Visualize the vector table as a street of 32-bit houses. House 0 stores the stack pointer — the address where the stack grows down from. House 1 stores Reset_Handler. Houses 2 through 15 are system exception handlers. Houses 16 and above are your peripheral interrupts. The Cortex-M hardware reads house 0 to set SP, reads house 1 to jump into your code, and for every subsequent interrupt it reads the corresponding house to find the handler address. That is the entire interrupt dispatch mechanism — no software lookup, no vectoring interrupt controller — just a direct table read.

Key points:
1. Entry 0 is always the initial MSP value, never a function pointer.
2. The LSB of every handler address must be 1 (Thumb bit).
3. Unused entries should point to a default handler to catch spurious interrupts.
4. The table must be 256-byte aligned (128-byte on Cortex-M0/M0+).
5. ARMv8-M with TrustZone has separate secure and non-secure vector tables, each banked and controlled by the security attribution unit. For further reading, consult the ARMv7-M Architecture Reference Manual (section B1.5) and the CMSIS-Core documentation on system vectors.
