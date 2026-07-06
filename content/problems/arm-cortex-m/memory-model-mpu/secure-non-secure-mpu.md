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

