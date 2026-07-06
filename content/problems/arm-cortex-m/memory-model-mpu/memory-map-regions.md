+++
date = '2026-07-06T10:05:00+05:30'
draft = false
title = 'Cortex-M Memory Map Regions'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 1
initial_code = '''// Identify the memory region for a given address
#include <stdio.h>
#include <stdint.h>

#define REGION_CODE     0x00000000
#define REGION_SRAM     0x20000000
#define REGION_PERIPH   0x40000000
#define REGION_EXTERNAL 0x60000000
#define REGION_DEVICE   0xA0000000
#define REGION_SYSTEM   0xE0000000

const char* get_memory_region_name(uint32_t addr) {
    if (addr < 0x20000000)        return "Code";
    if (addr < 0x3FFFFFFF)        return "SRAM";
    if (addr < 0x5FFFFFFF)        return "Peripheral";
    if (addr < 0x9FFFFFFF)        return "External RAM";
    if (addr < 0xDFFFFFFF)        return "Device";
    if (addr >= 0xE0000000)       return "System (PPB)";
    return "Reserved";
}

int main(void) {
    uint32_t test_addrs[] = {
        0x00000000, 0x08000000, 0x20000000,
        0x40000000, 0x60000000, 0xA0000000,
        0xE000ED00, 0xFFFFFFFF
    };
    int num_addrs = sizeof(test_addrs) / sizeof(test_addrs[0]);

    printf("Memory Region Classification:\\n");
    printf("Address      Region\\n");
    printf("----------------------------\\n");

    for (int i = 0; i < num_addrs; i++) {
        printf("0x%08X  %s\\n",
               test_addrs[i], get_memory_region_name(test_addrs[i]));
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that classifies any given 32-bit address into the appropriate Cortex-M memory region: Code (0x00000000-0x1FFFFFFF), SRAM (0x20000000-0x3FFFFFFF), Peripheral (0x40000000-0x5FFFFFFF), External RAM (0x60000000-0x9FFFFFFF), Device (0xA0000000-0xDFFFFFFF), or System/PPB (0xE0000000-0xFFFFFFFF). Test with representative addresses.

## Theory and Concepts

- The Cortex-M memory map is fixed and divided into eight 512 MB regions.
- Code region: contains the vector table, program code, and optional boot ROM.
- SRAM region: contains data, stack, heap. Bit-banding alias is in this region on cores that support it.
- Peripheral region: memory-mapped peripherals and registers.
- External RAM and Device regions: for off-chip memory and external devices.
- System region (PPB - Private Peripheral Bus): NVIC, SCB, SysTick, MPU, FPU, debug registers.
- The MPU can override default region attributes but cannot change the address decode.
- Aliased addresses (e.g., bit-band) still fall in their respective regions.

## Real World Application

Correctly identifying memory regions is critical when setting up linker scripts, configuring MPU regions, and accessing peripheral registers. Writing to the wrong region can cause hard faults or access violations.

