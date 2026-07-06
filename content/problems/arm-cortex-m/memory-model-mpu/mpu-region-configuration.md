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

    printf("MPU region %u configured: base=0x%08X\\n", region_num, base_addr);
}

int main(void) {
    printf("Configuring MPU for SRAM region 0x20000000\\n");

    configure_mpu_region(0, 0x20000000,
        REGION_SIZE_32KB,
        AP_PRIV_RW | TEX_NORMAL | SHARABLE | CACHEABLE | BUFFERABLE);

    MPU_CTRL = 1;
    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("MPU enabled. Region 0 covers 32KB of SRAM\\n");
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

