+++
date = '2026-07-06T10:05:00+05:30'
draft = true
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

    printf("Memory Region Classification:\n");
    printf("Address      Region\n");
    printf("----------------------------\n");

    for (int i = 0; i < num_addrs; i++) {
        printf("0x%08X  %s\n",
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

===EXPLANATION===

The Cortex-M memory map was first defined in the ARMv7-M architecture (Cortex-M3, 2005) and has remained unchanged across all subsequent revisions. The 4 GB address space is partitioned into eight 512 MB regions with fixed decode at the top two address bits: `00` = Code, `01` = SRAM, `10` = Peripheral/External/Device, `11` = System. This fixed map means that every Cortex-M microcontroller — from an M0 in a $0.30 MCU to an M85 in a $20 MCU — decodes addresses identically. The MPU can redefine attributes and permissions within regions, but cannot remap addresses to different regions. The System region (0xE0000000-0xFFFFFFFF) contains the Private Peripheral Bus (PPB) with NVIC, SCB, SysTick, MPU, FPU, and debug registers, all at architecturally fixed locations.

The intuition is that the memory map is a "zoning code" for the microcontroller. You would not put a factory (code) in a residential zone (SRAM) — the hardware enforces this. Code must execute from the Code region (0x00000000-0x1FFFFFFF) or SRAM region (0x20000000-0x3FFFFFFF) depending on whether the chip supports execution from SRAM. Peripheral registers belong in the Peripheral region. The MPU acts as a "building permit" — it can restrict access within a zone but cannot move the zone boundaries.

Professional firmware uses the memory map for several purposes. Linker scripts (e.g., STM32CubeIDE's `STM32L5XX_FLASH.ld`) place `.text` in Code, `.data` and `.bss` in SRAM, and the vector table at the base of Code. Zephyr's linker scripts in `arch/arm/core/cortex_m/` use `ROM_ADDR` and `RAM_ADDR` derived from the SoC's memory map. The Linux kernel's Cortex-M port uses `CONFIG_VMSPLIT` to decide the split between kernel and user virtual addresses, but the physical map follows the Cortex-M fixed layout. CMSIS-Pack flash algorithms write the vector table at `0x00000000` (or `0x08000000` on STM32 for flash) — they know these addresses fall in the Code region and behave predictably.

Visualize the map as a colour-coded bar: 0x00000000-0x1FFFFFFF (green = Code), 0x20000000-0x3FFFFFFF (blue = SRAM), 0x40000000-0x5FFFFFFF (red = Peripheral), 0x60000000-0x9FFFFFFF (yellow = External RAM/Device), 0xE0000000-0xFFFFFFFF (purple = System/PPB). Within the PPB, the NVIC is at 0xE000E000, SCB at 0xE000ED00, SysTick at 0xE000E010, and debug at 0xE000EDF0.

Key points:
1. The top 2 bits of the 32-bit address determine the region.
2. The Code region is typically execute-in-place (XIP) flash memory.
3. Bit-banding aliases exist in a 1 MB window within SRAM (0x22000000) and Peripheral (0x42000000) on v7-M only.
4. The PPB is accessible only in privileged mode (unless the MPU opens it).
5. Writing to an alias of the PPB does not work — aliasing is only for SRAM and Peripheral.


References:
1. ARMv7-M ARM (DDI0403) section B3.1, ARMv8-M ARM (DDI0553) section B3.1, STM32L5 memory map in RM0432, Zephyr `dts/arm/` memory node definitions, CMSIS-Core `system_<device>.c` memory map comments.
