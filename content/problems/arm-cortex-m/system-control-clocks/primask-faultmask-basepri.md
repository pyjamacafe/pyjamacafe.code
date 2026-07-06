+++
date = '2026-07-06T10:29:00+05:30'
draft = false
title = 'PRIMASK, FAULTMASK, and BASEPRI'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 7
weight = 4
initial_code = '''// Use PRIMASK, FAULTMASK, and BASEPRI for interrupt masking
#include <stdio.h>
#include <stdint.h>

void disable_interrupts(void) {
    __asm volatile(
        "CPSID I \\n\\t"
        : : : "memory"
    );
}

void enable_interrupts(void) {
    __asm volatile(
        "CPSIE I \\n\\t"
        : : : "memory"
    );
}

void set_basepri(uint32_t priority) {
    __asm volatile(
        "MSR BASEPRI, %0 \\n\\t"
        : : "r" (priority & 0xFF) : "memory"
    );
}

uint32_t get_basepri(void) {
    uint32_t pri;
    __asm volatile("MRS %0, BASEPRI" : "=r" (pri));
    return pri;
}

void set_primask(uint32_t mask) {
    if (mask) {
        __asm volatile("CPSID I" ::: "memory");
    } else {
        __asm volatile("CPSIE I" ::: "memory");
    }
}

void disable_faults(void) {
    __asm volatile(
        "CPSID F \\n\\t"
        : : : "memory"
    );
}

int main(void) {
    printf("Interrupt Masking: PRIMASK, FAULTMASK, BASEPRI\\n\\n");

    disable_interrupts();
    printf("PRIMASK set: interrupts disabled\\n");
    enable_interrupts();

    set_basepri(0x80);
    printf("BASEPRI = 0x%02X: interrupts with priority >= 0x80 masked\\n",
           get_basepri());

    set_basepri(0);
    printf("BASEPRI cleared (0x%02X): all interrupts enabled\\n", get_basepri());

    disable_faults();
    printf("FAULTMASK set: all faults and interrupts disabled\\n");
    enable_interrupts();

    printf("\\nMasking levels:\\n");
    printf("  PRIMASK:   masks all configurable exceptions\\n");
    printf("  FAULTMASK: masks all configurable exceptions + HardFault\\n");
    printf("  BASEPRI:   masks exceptions below threshold\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the three interrupt masking registers: PRIMASK (mask all configurable exceptions), FAULTMASK (mask all exceptions including HardFault), and BASEPRI (mask exceptions below a priority threshold). Use CPS instructions and MSR/MRS to set and read the mask values.

## Theory and Concepts

- PRIMASK: 1-bit register. When set (via CPSID I), masks all configurable exceptions except NMI and HardFault.
- FAULTMASK: 1-bit register. When set (via CPSID F), masks all configurable exceptions AND HardFault. Only NMI can execute.
- BASEPRI: 8-bit register. Masks all exceptions with priority >= BASEPRI value. Priority 0 (highest) is never masked.
- BASEPRI_MAX: variant that only raises the threshold (never lowers), useful for nested masking.
- CPS (Change Processor State): CPSID I (disable IRQ), CPSIE I (enable IRQ), CPSID F, CPSIE F.
- MRS/MSR: read/write special-purpose registers.
- PRIMASK and FAULTMASK are automatically set on HardFault entry to prevent recursive faults.
- All masking is automatically cleared on exception return (EXC_RETURN).

## Real World Application

Critical sections use PRIMASK or BASEPRI to protect shared data from interrupt preemption. BASEPRI is preferred over PRIMASK when possible because it allows high-priority interrupts (like a motor controller timer) to fire while masking low-priority ones.

