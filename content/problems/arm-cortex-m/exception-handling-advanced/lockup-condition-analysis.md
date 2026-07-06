+++
date = '2026-07-06T10:40:00+05:30'
draft = false
title = 'Lockup Condition Analysis'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 9
weight = 5
initial_code = '''// Analyze and prevent lockup conditions
#include <stdio.h>
#include <stdint.h>

#define SCB_CFSR    (*((volatile uint32_t *)0xE000ED28))
#define SCB_HFSR    (*((volatile uint32_t *)0xE000ED2C))
#define SCB_DFSR    (*((volatile uint32_t *)0xE000ED30))

typedef enum {
    LOCKUP_NONE,
    LOCKUP_DOUBLE_FAULT,
    LOCKUP_FAULT_IN_HANDLER,
    LOCKUP_VECTOR_FETCH,
    LOCKUP_NMI_FAULT
} lockup_cause_t;

const char* lockup_cause_name(lockup_cause_t cause) {
    switch (cause) {
        case LOCKUP_DOUBLE_FAULT:     return "Double fault (fault during fault)";
        case LOCKUP_FAULT_IN_HANDLER: return "Fault escalated in handler mode";
        case LOCKUP_VECTOR_FETCH:     return "Vector table read failed";
        case LOCKUP_NMI_FAULT:        return "Fault during NMI handler";
        default:                      return "Unknown";
    }
}

lockup_cause_t analyze_lockup_risk(uint32_t current_mode, uint32_t hfsr) {
    if (current_mode == 1) {
        if (hfsr & (1 << 30)) {
            if (hfsr & (1 << 1)) {
                return LOCKUP_VECTOR_FETCH;
            }
            return LOCKUP_FAULT_IN_HANDLER;
        }
    }
    return LOCKUP_NONE;
}

void check_lockup_prevention(void) {
    printf("Lockup Prevention Strategies:\\n\\n");

    printf("1. Fault handler guard:\n");
    printf("   - Never allow faults in fault handlers\\n");
    printf("   - Use simple, verified code in handlers\\n");
    printf("   - Avoid complex operations (printf, malloc)\\n\\n");

    printf("2. Stack integrity:\n");
    printf("   - Ensure fault handlers have sufficient stack\\n");
    printf("   - Use MSP exclusively in handler mode\\n");
    printf("   - Consider a separate 'fault stack'\\n\\n");

    printf("3. Vector table protection:\n");
    printf("   - Place vector table in ROM or protected RAM\\n");
    printf("   - Use VTOR to relocate if needed\\n\\n");

    printf("4. NMI watchdog:\n");
    printf("   - Use NMI as last resort for lockup recovery\\n");
    printf("   - Configure an external watchdog\\n");
    printf("   - Reset on lockup detection (WDOG)");
}

int main(void) {
    printf("Cortex-M Lockup Condition Analysis\\n\\n");

    printf("Lockup is a state where the CPU stops executing\\n");
    printf("instructions due to an unrecoverable fault.\\n\\n");

    printf("Lockup triggers:\\n");
    printf("  1. HardFaultHandler causes another fault\\n");
    printf("  2. BusFault during vector fetch\\n");
    printf("  3. NMI handler causes a fault\\n\n");

    uint32_t test_hfsr = (1UL << 30) | (1UL << 1);
    lockup_cause_t cause = analyze_lockup_risk(1, test_hfsr);
    printf("Analysis: %s\\n\\n", lockup_cause_name(cause));

    check_lockup_prevention();

    printf("\\n\\nDebug status (DFSR): 0x%08X\\n", SCB_DFSR);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that analyzes lockup conditions in the Cortex-M processor. Lockup occurs when a fault handler triggers another fault (double fault), or when a fault occurs during vector table fetch. Explain each scenario and implement prevention strategies: ensuring fault handlers are simple, providing sufficient stack, and using external watchdogs.

## Theory and Concepts

- Lockup: the processor stops fetching instructions. Only a reset can recover.
- Double fault: HardFault_Handler triggers a BusFault, MemManage, or UsageFault.
- HardFault escalation fails if: the vector table itself is inaccessible, or the system bus is broken.
- Lockup also occurs if NMI handler causes a fault (no higher priority handler to escalate to).
- During lockup, the processor continues to service debug requests and NMI (if NMI didn't cause it).
- Lockup status is visible in DFSR (Debug Fault Status Register) bit 1 (VCATCH) or via external debugger.
- Preventing lockup: keep fault handlers minimal, ensure valid vector table, use watchdog.
- WFE/WFI during lockup: the processor stays in lockup until reset.

## Real World Application

Lockup is a critical concern in safety-critical systems. To meet ISO 26262 (automotive) or IEC 61508 (industrial) standards, systems must detect lockup and perform a safe state transition (reset, shut down actuators) using an external watchdog timer.

