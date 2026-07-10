+++
date = '2026-07-06T10:07:00+05:30'
draft = false
title = 'MPU Attributes and Access Permissions'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 3
initial_code = '''// Set up MPU with different memory types and permissions
#include <stdio.h>
#include <stdint.h>

#define MPU_RNR   (*((volatile uint32_t *)0xE000ED98))
#define MPU_RBAR  (*((volatile uint32_t *)0xE000ED9C))
#define MPU_RASR  (*((volatile uint32_t *)0xE000EDA0))
#define MPU_CTRL  (*((volatile uint32_t *)0xE000ED94))

#define SIZE_1KB   (0x0AUL << 1)
#define SIZE_4KB   (0x0CUL << 1)
#define SIZE_16KB  (0x0EUL << 1)
#define SIZE_64KB  (0x10UL << 1)
#define ENABLE     (1UL << 0)

typedef enum {
    MEM_NORMAL_WB_WA  = 0x0,
    MEM_NORMAL_WT     = 0x1,
    MEM_DEVICE        = 0x2,
    MEM_STRONGLY_OD   = 0x3
} mem_type_t;

uint32_t build_rasr(uint32_t size, mem_type_t type,
                    uint8_t ap, uint8_t sharable) {
    uint32_t rasr = size | ENABLE;

    switch (type) {
        case MEM_NORMAL_WB_WA:
            rasr |= (0 << 19) | (sharable << 18) | (1 << 17) | (1 << 16);
            break;
        case MEM_NORMAL_WT:
            rasr |= (0 << 19) | (sharable << 18) | (1 << 17) | (0 << 16);
            break;
        case MEM_DEVICE:
            rasr |= (0 << 19) | (0 << 18) | (0 << 17) | (1 << 16);
            break;
        case MEM_STRONGLY_OD:
            rasr |= (1 << 19) | (0 << 18) | (0 << 17) | (0 << 16);
            break;
    }

    rasr |= (uint32_t)(ap & 0x7) << 24;
    return rasr;
}

int main(void) {
    printf("Configuring multiple MPU regions with different attributes\n");

    MPU_RNR = 0;
    MPU_RBAR = 0x00000000;
    MPU_RASR = build_rasr(SIZE_64KB, MEM_NORMAL_WB_WA, 3, 1);

    MPU_RNR = 1;
    MPU_RBAR = 0x40000000;
    MPU_RASR = build_rasr(SIZE_4KB, MEM_DEVICE, 3, 0);

    printf("Region 0: Flash (Normal WB-WA, R/W, sharable)\n");
    printf("Region 1: UART (Device, R/W, non-sharable)\n");

    MPU_CTRL = 1;
    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("MPU enabled with 2 regions\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write code to configure two MPU regions with different memory types and access permissions. Region 0 should cover the Flash memory area (0x00000000, 64 KB) with Normal Write-Back Write-Allocate memory type, full read/write access, and sharable. Region 1 should cover a peripheral region (0x40000000, 4 KB) with Device memory type and full access.

## Theory and Concepts

- Memory types: Normal (cacheable), Device (ordered accesses), Strongly-Ordered (all accesses ordered).
- Normal memory: allows speculation, merging, and reordering. Sub-types: Write-Through, Write-Back (Read-Allocate/Write-Allocate), Write-Back No-Write-Allocate.
- Device memory: accesses are not speculated, each access happens exactly once, but may be reordered relative to other device accesses to the same region.
- Strongly-Ordered: all accesses happen in program order with strict alignment.
- AP bits (3 bits): encode privileged/unprivileged read/write permissions.
- TEX[2:0], S, C, B fields encode the memory type and cache policy.
- Sub-regions (8 per region) allow finer-grained control within a region.
- Non-sharable vs Sharable: affects cache coherence between bus masters.

## Real World Application

Safety-critical firmware must use correct memory attributes to prevent compiler/hardware optimizations from breaking peripheral access protocols. DMA buffers need proper cache attributes. Shared memory between CPU and peripherals must be configured as non-cacheable or strongly ordered.

===EXPLANATION===

Memory attributes and access permissions have been part of the MPU since ARMv7-M, inheriting concepts from the ARM Architecture Reference Memory Model. The Cortex-M MPU uses a simplified version of the ARMv7-A MMU attribute scheme: TEX[2:0], C, B, and S bits encode the memory type (Normal, Device, Strongly-Ordered) and cache policy. This matters because Cortex-M processors may have caches (M7, M55, M85) or act as bus masters in multi-core systems. Setting the wrong attribute can cause stale data reads, missed peripheral updates, or bus faults.

The intuition: think of memory types as traffic rules for the memory bus. Normal memory (code, data) allows the bus to merge writes, reorder accesses, and speculate reads — like a highway where cars can change lanes and pass. Device memory (peripheral registers) forces every access to reach the peripheral exactly once and in order — like a single-lane road with traffic lights at every intersection. Strongly-Ordered memory is a strict one-lane road where every car waits for the one ahead to finish before moving — no merging, no reordering, no speculation. Cache policies (Write-Through vs Write-Back) determine whether writes go directly to main memory or sit in the cache first.

In professional practice, getting attributes wrong is a common source of bugs. The Zephyr linker script puts `.device` sections with `STRONGLY_ORDERED` attribute for MMIO regions. FreeRTOS+TCP uses `NORMAL_NON_CACHE` for DMA buffers to avoid cache coherency issues. The Linux kernel's `arch/arm/mm/proc-v7m.S` defines `MT_DEVICE` and `MT_NORMAL` page types. CMSIS-Core provides `MPU_ATTRIBUTES` macros: `MPU_CONFIG_NORMAL_WB_WA` for cached memory and `MPU_CONFIG_DEVICE` for peripherals. In Mbed OS, USB and Ethernet buffers use `NON_SHAREABLE` device memory to prevent CPU prefetch from reading stale descriptors.

Visualise the TEX/C/B encoding as a 5-bit field: TEX[2:0] = 000 for Normal, 001 for Device, 010 for Strongly-Ordered; C = cacheable, B = bufferable, S = shareable. Shareable means the region may be accessed by multiple bus masters (DMA, another CPU) and requires cache coherence support.

Key points:
1. Device memory must never be cached — each read must reach the peripheral.
2. Strongly-Ordered memory forces ordering across all masters — use sparingly.
3. AP bits: 000 = no access, 001 = privileged R/W only, 011 = both privileged/unpriv R/W;.
4. Sub-regions (8 per MPU region) can disable access to specific 1/8th sections.
5. TEX remap (in ACTLR) can change TEX field interpretation on some cores — check your TRM.


References:
1. ARMv7-M ARM (DDI0403) section B4.3, ARMv8-M ARM (DDI0553) section B4.3, CMSIS-Core `mpu_armv7.h`, Zephyr `include/arch/arm/cortex_m/mpu/arm_mpu.h`, ARM Cortex-M7 TRM cache attributes.
