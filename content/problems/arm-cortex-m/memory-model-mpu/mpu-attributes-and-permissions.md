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
    printf("Configuring multiple MPU regions with different attributes\\n");

    MPU_RNR = 0;
    MPU_RBAR = 0x00000000;
    MPU_RASR = build_rasr(SIZE_64KB, MEM_NORMAL_WB_WA, 3, 1);

    MPU_RNR = 1;
    MPU_RBAR = 0x40000000;
    MPU_RASR = build_rasr(SIZE_4KB, MEM_DEVICE, 3, 0);

    printf("Region 0: Flash (Normal WB-WA, R/W, sharable)\\n");
    printf("Region 1: UART (Device, R/W, non-sharable)\\n");

    MPU_CTRL = 1;
    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("MPU enabled with 2 regions\\n");
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

