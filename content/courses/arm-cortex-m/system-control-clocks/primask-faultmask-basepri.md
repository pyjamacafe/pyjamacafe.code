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
        "CPSID I \n\\t"
        : : : "memory"
    );
}

void enable_interrupts(void) {
    __asm volatile(
        "CPSIE I \n\\t"
        : : : "memory"
    );
}

void set_basepri(uint32_t priority) {
    __asm volatile(
        "MSR BASEPRI, %0 \n\\t"
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
        "CPSID F \n\\t"
        : : : "memory"
    );
}

int main(void) {
    printf("Interrupt Masking: PRIMASK, FAULTMASK, BASEPRI\n\n");

    disable_interrupts();
    printf("PRIMASK set: interrupts disabled\n");
    enable_interrupts();

    set_basepri(0x80);
    printf("BASEPRI = 0x%02X: interrupts with priority >= 0x80 masked\n",
           get_basepri());

    set_basepri(0);
    printf("BASEPRI cleared (0x%02X): all interrupts enabled\n", get_basepri());

    disable_faults();
    printf("FAULTMASK set: all faults and interrupts disabled\n");
    enable_interrupts();

    printf("\nMasking levels:\n");
    printf("  PRIMASK:   masks all configurable exceptions\n");
    printf("  FAULTMASK: masks all configurable exceptions + HardFault\n");
    printf("  BASEPRI:   masks exceptions below threshold\n");

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

===EXPLANATION===

The three interrupt masking registers — PRIMASK, FAULTMASK, and BASEPRI — form a graduated system for controlling exception preemption. Each provides a different level of protection, and choosing the right one is a critical real-time design decision.

The historical lineage traces to the ARM7TDMI's CPSR interrupt mask bits. The Cortex-M architecture split masking into dedicated special-purpose registers for clarity and to enable BASEPRI's threshold-based approach. PRIMASK is the binary gate — interrupts on or off. BASEPRI is the graduated threshold — all interrupts with priority above (numerically greater than) a configurable value are masked. FAULTMASK is the emergency override — everything except NMI is masked.

The intuition behind BASEPRI is the key insight: most critical sections only need to protect against interrupts at or below a certain priority level. A motor control ISR at priority 0 should never be delayed by a UART ISR at priority 128. But if you use PRIMASK to protect a shared UART buffer, you accidentally block the motor controller too. BASEPRI allows you to set a threshold of, say, 64, which masks the UART (priority 128) but leaves the motor controller (priority 0) unmasked. This is called the "priority ceiling" protocol in real-time systems.

PRIMASK is a single bit. Setting it via CPSID I disables all configurable exceptions (everything except NMI and HardFault). Reading it via MRS reveals whether interrupts are currently disabled. PRIMASK is automatically set on HardFault entry to prevent recursive faults.

FAULTMASK is the nuclear option: when set via CPSID F, it masks HardFault itself in addition to all configurable exceptions. Only NMI can execute. This is used during system recovery sequences where even a HardFault would be catastrophic. FAULTMASK is automatically cleared on exception return.

BASEPRI is the nuanced tool. It accepts an 8-bit priority threshold. Any exception with a priority value greater than or equal to BASEPRI is masked. Setting BASEPRI to 0 disables masking entirely. BASEPRI_MAX is a special atomic variant that only raises the threshold — it never lowers it, preventing race conditions in nested masking.

In professional RTOS code, the scheduler typically disables interrupts by setting BASEPRI to the lowest priority level rather than using PRIMASK. This ensures that the scheduler's own critical sections don't block the highest-priority interrupts from firing. The RTOS must then audit every ISR to ensure they never call RTOS API functions that might touch scheduler data.

Visualize interrupts as people trying to enter a building. PRIMASK is a solid steel door — no one enters. BASEPRI is a bouncer with a height requirement — only people above a certain "priority height" get through. FAULTMASK is an emergency lockdown — even the building manager (HardFault) is locked out.

Key points: CPSID I sets PRIMASK, CPSIE I clears it; MRS/MSR access BASEPRI; BASEPRI only affects configurable exceptions; FAULTMASK survives warm reset; all masks are automatically restored on exception return; BASEPRI_MAX provides atomic raise-only semantics.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.3.4–B1.3.6), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8.3), ARM Infocenter DDI0403E.

