+++
date = '2026-07-06T10:06:00+05:30'
draft = false
title = 'MPU Region Configuration'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 2
initial_code = '''// Configure an MPU region for SRAM access
#include <stdio.h>
#include <stdint.h>

#define MPU_BASE    0xE000ED90
#define MPU_RBAR    (*((volatile uint32_t *)(MPU_BASE + 0x00)))
#define MPU_RASR    (*((volatile uint32_t *)(MPU_BASE + 0x04)))
#define MPU_RNR     (*((volatile uint32_t *)(MPU_BASE + 0x08)))
#define MPU_CTRL    (*((volatile uint32_t *)(MPU_BASE + 0x0C)))

#define REGION_SIZE_32KB  (0x0DUL << 1)
#define REGION_ENABLE     (1UL << 0)
#define AP_PRIV_RW        (0x1UL << 24)
#define AP_PRIV_RW_UNUSR_NO (0x0UL << 24)
#define TEX_NORMAL         (0x0UL << 19)
#define SHARABLE           (1UL << 18)
#define CACHEABLE          (1UL << 17)
#define BUFFERABLE         (1UL << 16)

void configure_mpu_region(uint32_t region_num, uint32_t base_addr,
                          uint32_t size_attr, uint32_t access_attr) {
    MPU_RNR = region_num;
    MPU_RBAR = base_addr;
    MPU_RASR = size_attr | access_attr | REGION_ENABLE;

    printf("MPU region %u configured: base=0x%08X\n", region_num, base_addr);
}

int main(void) {
    printf("Configuring MPU for SRAM region 0x20000000\n");

    configure_mpu_region(0, 0x20000000,
        REGION_SIZE_32KB,
        AP_PRIV_RW | TEX_NORMAL | SHARABLE | CACHEABLE | BUFFERABLE);

    MPU_CTRL = 1;
    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("MPU enabled. Region 0 covers 32KB of SRAM\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that configures an MPU region to cover the first 32 KB of SRAM starting at 0x20000000 with full read/write access in privileged mode, normal memory type, write-back cacheable, and sharable attributes. Enable the MPU and verify the configuration by reading back the region descriptor registers.

## Theory and Concepts

- MPU divides memory into regions with configurable size, address, and access permissions.
- MPU_RNR selects the region number (0-7 or 0-15 depending on implementation).
- MPU_RBAR holds the base address (must be aligned to region size).
- MPU_RASR holds the size, sub-region disable, access permissions, and memory attributes.
- Region size must be a power of 2 (32 bytes to 4 GB), encoded as (log2(size) - 1).
- AP (Access Permission) bits control read/write access for privileged and unprivileged modes.
- TEX, S, C, B bits define the memory type (Normal, Device, Strongly-Ordered).
- DSB and ISB barriers ensure MPU configuration takes effect before subsequent accesses.

## Real World Application

MPU region configuration is essential for safety-critical systems (automotive, medical) that must prevent tasks from accessing memory outside their allocated regions. RTOSes like FreeRTOS and Zephyr use the MPU to isolate tasks and protect the kernel.

===EXPLANATION===

The MPU region configuration registers (MPU_RNR, MPU_RBAR, MPU_RASR) have remained architecturally stable since ARMv7-M, with ARMv8-M adding a second security-banked copy. Each region is programmed by writing the region number to MPU_RNR, the base address to MPU_RBAR, and the attributes to MPU_RASR. Region sizes must be a power of 2 between 32 bytes and 4 GB, encoded as `log2(size) - 1` in bits [5:1] of MPU_RASR. The base address must be aligned to the region size — a 32 KB region must start at a multiple of 32 KB. This alignment requirement is the most common source of configuration errors: if you specify a base of `0x20001000` with size 32 KB, the MPU silently uses `0x20000000` because it truncates unaligned bits.

The intuition: the MPU is a pattern matcher with a fixed number of slots. Each slot has a (base, size, permission) tuple. When the CPU issues a memory access, the MPU checks each region in order (region number 0 has highest priority on v7-M, region number 7 on v8-M) and if no region matches, the access faults (if the MPU is enabled). This is why you must always configure a background region for the entire address space if you enable the MPU — or use the default background permission from MPU_CTRL. The MPU does not merge regions — each access hits exactly one region or faults.

Professional RTOS implementations use the MPU for task isolation. FreeRTOS MPU port (`FreeRTOS/Source/portable/MPU/ARM_CM3/`) configures one region per task stack, one for flash (text), and one for peripherals. When switching tasks, `vPortSwitchContext` reprograms the MPU regions for the new task. Zephyr's userspace support (`CONFIG_USERSPACE`) uses the MPU to create a "domain" for each application thread, with stack, flash, and peripheral regions tailored to that thread. The kernel core and interrupt handlers use a separate privileged MPU configuration. mbed OS uses the MPU to prevent user threads from accessing kernel data structures.

Visualize the MPU configuration flow as a sequence: disable MPU → for each region, set RNR = region number, set RBAR = base, set RASR = size+attr → enable MPU → DSB → ISB. Every write to RBAR or RASR needs the correct RNR first — RNR acts as a pointer into the region register bank.

Key points:
1. Region size must be power of 2; base must be aligned to size.
2. Region numbers are not prioritised the same across v7-M (lower number = higher priority) and v8-M (higher number = higher priority).
3. DSB + ISB required after configuration — without them, the MPU may use stale settings.
4. The MPU can be enabled/disabled via MPU_CTRL[0]; disabling it allows all accesses.
5. Sub-regions (8 per region) can exclude specific 1/8th segments — useful for guard bands near stack boundaries.


References:
1. ARMv7-M ARM (DDI0403) B4.2, ARMv8-M ARM (DDI0553) B4.2, FreeRTOS MPU port, Zephyr `arch/arm/core/cortex_m/mpu/arm_mpu.c`, CMSIS-Core `mpu_armv7.h` example configuration.
