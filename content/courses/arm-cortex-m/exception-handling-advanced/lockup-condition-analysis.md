+++
date = '2026-07-06T10:40:00+05:30'
draft = true
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
    printf("Lockup Prevention Strategies:\n\n");

    printf("1. Fault handler guard:\n");
    printf("   - Never allow faults in fault handlers\n");
    printf("   - Use simple, verified code in handlers\n");
    printf("   - Avoid complex operations (printf, malloc)\n\n");

    printf("2. Stack integrity:\n");
    printf("   - Ensure fault handlers have sufficient stack\n");
    printf("   - Use MSP exclusively in handler mode\n");
    printf("   - Consider a separate 'fault stack'\n\n");

    printf("3. Vector table protection:\n");
    printf("   - Place vector table in ROM or protected RAM\n");
    printf("   - Use VTOR to relocate if needed\n\n");

    printf("4. NMI watchdog:\n");
    printf("   - Use NMI as last resort for lockup recovery\n");
    printf("   - Configure an external watchdog\n");
    printf("   - Reset on lockup detection (WDOG)");
}

int main(void) {
    printf("Cortex-M Lockup Condition Analysis\n\n");

    printf("Lockup is a state where the CPU stops executing\n");
    printf("instructions due to an unrecoverable fault.\n\n");

    printf("Lockup triggers:\n");
    printf("  1. HardFaultHandler causes another fault\n");
    printf("  2. BusFault during vector fetch\n");
    printf("  3. NMI handler causes a fault\n\n");

    uint32_t test_hfsr = (1UL << 30) | (1UL << 1);
    lockup_cause_t cause = analyze_lockup_risk(1, test_hfsr);
    printf("Analysis: %s\n\n", lockup_cause_name(cause));

    check_lockup_prevention();

    printf("\n\nDebug status (DFSR): 0x%08X\n", SCB_DFSR);

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

===EXPLANATION===

Lockup is the Cortex-M's unrecoverable error state — the processor equivalent of a cardiac arrest. When a fault handler (HardFault, NMI) triggers another fault for which there is no handler, the processor enters a state where it stops executing instructions. Only a reset can restore normal operation.

The historical design of lockup reflects the ARM architecture's fail-safe philosophy. Rather than allowing the processor to execute arbitrary corrupted code in an undefined state, ARM chose to halt execution entirely. This is analogous to a safety relay that trips and cuts power when a fault is detected — better to stop completely than to risk unpredictable behavior.

The three primary lockup triggers form a hierarchy of desperation. First: HardFault_Handler causes a fault. HardFault is the last-resort handler — if it fails, there is nowhere else to escalate. This could happen if the HardFault handler itself accesses invalid memory, or if its stack overflows. Second: a BusFault occurs during vector table fetch — the processor cannot even read the HardFault handler address from the vector table. Third: the NMI handler causes a fault — NMI is the highest priority exception, so there is no handler above it to catch the error.

The intuition behind lockup prevention is straightforward: fault handlers must be absolutely bulletproof. They should not use complex C code, not call printf (which might access UART hardware that is broken), not use malloc (which might have corrupted heap structures), and not rely on any peripheral that might have caused the fault. The ideal fault handler does three things: saves the processor state (stack frame, fault status registers), sets a flag for the watchdog to detect, and waits for the watchdog reset.

In professional safety-critical systems, lockup is addressed at the system level rather than the processor level. An external watchdog timer (WDT), typically a separate IC or an internal peripheral that cannot be disabled, monitors a heartbeat signal from the processor. If the processor locks up, the heartbeat stops, the WDT expires, and the WDT asserts the RESET pin or disables safety-critical outputs (like motor drivers or fuel injectors).

The DFSR (Debug Fault Status Register) provides post-mortem analysis. Bit 1 (VCATCH) indicates whether the processor entered debug state due to a vector catch. Bit 0 (HALTED) indicates the core was halted by the debugger. During lockup, the processor continues to service debug requests — meaning a JTAG/SWD debugger can attach and inspect the state even while the processor is locked.

Visualize lockup as an airplane engine that has failed catastrophically. The engine cannot be restarted in flight — the only option is to deploy the auxiliary power unit (watchdog reset) and prepare for an emergency landing (safe state transition).

Key points: lockup stops instruction fetch; only reset recovers; NMI can still execute if it didn't cause the lockup; debug accesses still work during lockup; preventing lockup requires fault handler simplicity, adequate stack, and external watchdog; WFE/WFI during lockup has no effect; HFSR bit 30 (FORCED) + bit 1 (VECTBL) identifies vector table causes.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.5.14 — Lockup), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 10.6), ARM Infocenter DDI0403E.

