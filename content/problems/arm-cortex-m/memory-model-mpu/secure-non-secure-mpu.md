+++
date = '2026-07-06T10:08:00+05:30'
draft = false
title = 'Secure vs Non-Secure MPU Configuration'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 4
initial_code = '''// Configure both secure and non-secure MPU regions
#include <stdio.h>
#include <stdint.h>

#define SAU_CTRL    (*((volatile uint32_t *)0xE000EDD0))
#define SAU_RNR     (*((volatile uint32_t *)0xE000EDD4))
#define SAU_RBAR    (*((volatile uint32_t *)0xE000EDD8))
#define SAU_RLAR    (*((volatile uint32_t *)0xE000EDDC))

#define S_MPU_RNR   (*((volatile uint32_t *)0xE000ED98))
#define S_MPU_RBAR  (*((volatile uint32_t *)0xE000ED9C))
#define S_MPU_RASR  (*((volatile uint32_t *)0xE000EDA0))

#define NS_MPU_RNR  (*((volatile uint32_t *)0xE002ED98))
#define NS_MPU_RBAR (*((volatile uint32_t *)0xE002ED9C))
#define NS_MPU_RASR (*((volatile uint32_t *)0xE002EDA0))

void config_sau_region(uint32_t num, uint32_t base, uint32_t limit) {
    SAU_RNR = num;
    SAU_RBAR = base;
    SAU_RLAR = limit | 1;
    printf("SAU region %u: 0x%08X - 0x%08X\\n", num, base, limit);
}

void setup_secure_mpu(void) {
    S_MPU_RNR = 0;
    S_MPU_RBAR = 0x00000000;
    S_MPU_RASR = (0x10UL << 1) | (3UL << 24) | 1;
}

void setup_nonsecure_mpu(void) {
    NS_MPU_RNR = 0;
    NS_MPU_RBAR = 0x20000000;
    NS_MPU_RASR = (0x0EUL << 1) | (3UL << 24) | 1;
}

int main(void) {
    printf("SAU: Defining non-secure callable and non-secure regions\\n");
    config_sau_region(0, 0x00200000, 0x00200FFF);
    config_sau_region(1, 0x20000000, 0x2000FFFF);

    SAU_CTRL = 1;
    setup_secure_mpu();
    setup_nonsecure_mpu();

    __asm volatile("DSB" ::: "memory");
    __asm volatile("ISB" ::: "memory");

    printf("Secure and Non-Secure MPU configured\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Configure both the Secure MPU and Non-Secure MPU on an ARMv8-M device with TrustZone. Set up SAU regions to define non-secure and non-secure callable areas. Then configure the Secure MPU to protect the secure code region and the Non-Secure MPU to protect the SRAM region. Enable both MPU units.

## Theory and Concepts

- ARMv8-M with TrustZone has two independent MPU instances: Secure MPU and Non-Secure MPU.
- Secure MPU controls access when the processor is in Secure state.
- Non-Secure MPU controls access when the processor is in Non-Secure state.
- SAU (Security Attribution Unit) defines which addresses are Secure, Non-Secure (NS), or Non-Secure Callable (NSC).
- NSC regions are non-secure but can be entered via SG instructions from secure code.
- MPU configuration registers are banked: secure and non-secure copies at different addresses.
- IDAU (Implementation Defined Attribution Unit) may override SAU settings.
- Both MPUs can be enabled independently via their respective MPU_CTRL registers.

## Real World Application

IoT devices with TrustZone use secure MPU to protect cryptographic keys and secure services from non-secure code. The non-secure MPU isolates untrusted application tasks. This dual-MPU architecture is mandatory for PSA Certified Level 2 compliance.

===EXPLANATION===

The dual-MPU architecture debuted with ARMv8-M and TrustZone (2016), solving a problem that single-MPU Cortex-M devices could not: how to protect secure world assets when non-secure code is actively hostile. In ARMv7-M (M3/M4/M7), there is one MPU with up to 8 or 16 regions. Non-secure code — if it gains privileged access through an exploit — can disable the MPU. ARMv8-M introduces two independent MPU instances: the Secure MPU (S_MPU) at `0xE000ED90` and the Non-Secure MPU (NS_MPU) at `0xE002ED90`. Secure code controls both; non-secure code controls only the NS_MPU. Even if non-secure code turns off the NS_MPU, the S_MPU continues protecting secure memory.

The intuition is a locked room within a rented apartment. The tenant (non-secure code) has keys to their own rooms (NS_MPU regions) and can rearrange furniture. But the landlord (secure code) has a master key to all rooms plus a separate lock on the landlord's private room (S_MPU). The tenant cannot enter the landlord's room, cannot change the landlord's locks, and cannot even see that the landlord's room exists if the SAU also hides it. The SAU (Security Attribution Unit) is the "floor plan" — it decides which rooms are secure, which are non-secure, and which are non-secure callable (the foyer where deliveries happen via SG instruction).

In professional firmware, the dual-MPU architecture is the backbone of PSA Certified Level 2. Zephyr implements this in `arch/arm/core/cortex_m/arm_mpu.c` with separate `arm_mpu_init()` for secure and `arm_ns_mpu_init()` for non-secure. The secure MPU protects the secure firmware image, trusted storage, and cryptographic keys. The non-secure MPU protects the RTOS kernel from untrusted tasks. FreeRTOS's Cortex-M33 MPU port in `port.c` configures the NS_MPU for task isolation, while the secure partition manager (SPM) configures the S_MPU. mbed OS uses the dual-MPU for its TZ-based secure partitions. CMSIS-Pack TrustZone examples show S_MPU configured to protect `0x10000000-0x1001FFFF` (secure SRAM) and NS_MPU configured for `0x20000000-0x2001FFFF` (non-secure SRAM).

Visualize as two concentric rectangles: the outer rectangle is the full memory map; the inner rectangle is the secure region (protected by S_MPU). The NS_MPU can only configure regions outside the secure rectangle. The SAU defines which addresses fall in the secure rectangle — the S_MPU further refines access within it.

Key points:
1. S_MPU and NS_MPU have separate register banks at different base addresses.
2. Secure code writes to both; non-secure code only sees NS_MPU.
3. Each MPU has its own enable bit and can be active independently.
4. The SAU's security attribution takes priority over MPU region permissions.
5. NSC regions are non-secure but executable from non-secure — the S_MPU must allow execution from NS_MPU-controlled NSC areas.


References:
1. ARMv8-M ARM (DDI0553) section B4.3, Zephyr `arm_mpu.c` dual-MPU init, FreeRTOS `port.c` for M33, PSA Certified Level 2 Protection Profile, CMSIS-Pack TrustZone examples.
