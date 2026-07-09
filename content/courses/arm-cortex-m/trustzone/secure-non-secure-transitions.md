+++
date = '2026-07-06T10:13:00+05:30'
draft = false
title = 'Secure to Non-Secure Function Call Transitions'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 4
weight = 4
initial_code = '''// Implement secure to non-secure function call transitions
#include <stdio.h>
#include <stdint.h>

typedef void (*ns_func_ptr_t)(void);

void secure_call_non_secure(ns_func_ptr_t ns_func) {
    uint32_t lr_value;

    __asm volatile(
        "MOV %0, LR       \\n\\t"
        "PUSH {%0}        \\n\\t"
        "MOV R12, %1      \\n\\t"
        "BXNS R12         \\n\\t"
        "POP {%0}         \\n\\t"
        "MOV LR, %0       \\n\\t"
        : "=r" (lr_value)
        : "r" (ns_func)
        : "r12"
    );

    printf("Returned from non-secure call\\n");
}

__attribute__((section(".nsc_func")))
void secure_entry_point(void) {
    __asm volatile("SG" ::: "memory");

    printf("In secure entry point\\n");

    nsc_func_ptr_t ns_print = (nsc_func_ptr_t)0x00201000;
    secure_call_non_secure(ns_print);

    printf("Back in secure state\\n");
}

void non_secure_callback(void) {
    printf("Executing in non-secure state\\n");
}

int main(void) {
    secure_entry_point();
    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Implement a secure-to-non-secure function call mechanism. Write a function in secure state that saves the current LR (which has EXC_RETURN value), branches to a non-secure function using BXNS, and restores the return mechanism to come back to secure state. Explain how EXC_RETURN encoding controls the security state transition.

## Theory and Concepts

- BXNS (Branch and Exchange Non-Secure) is used by secure code to call non-secure functions.
- BLXNS will automatically save the return address and security state on the secure stack.
- EXC_RETURN value in LR determines the return behavior: bit[6]=0 indicates return to Non-Secure.
- When secure code calls non-secure code, the processor clears the securable (callee-saved) registers for isolation.
- On return, SG instruction at the NSC entry re-enables secure state.
- The non-secure stack must not contain secure data. The secure stack is used for the transition.
- FPU state is also saved/restored across the boundary if lazy stacking is configured.

## Real World Application

Secure firmware update, attestation, and secure storage services in IoT devices use BXNS to delegate work to non-secure code (e.g., for UI rendering or network communication) while maintaining security isolation.

===EXPLANATION===

Secure to Non-Secure transitions in ARMv8-M use two new instructions: BXNS (Branch and Exchange to Non-Secure) for direct calls, and BLXNS (Branch with Link and Exchange to Non-Secure) for function calls with return. These instructions were added in ARMv8-M and are not present in any earlier architecture. When secure code executes BXNS, the processor clears the security state (NS bit in CONTROL or EXC_RETURN), clears the securable registers (R0-R3, R12, LR, PC, xPSR are cleared or masked for isolation), and branches to the target address in Non-Secure state. The processor automatically saves the secure context so that when non-secure code returns via the SG instruction, the secure state is restored.

The intuition: calling non-secure code from secure is like a diplomat leaving an embassy. Before stepping out, the diplomat locks all sensitive documents in a safe (clearing securable registers). The host country (non-secure) cannot access the embassy's secrets. When the diplomat returns, they present their passport (the SG instruction at an NSC entry), and the embassy unlocks the safe. The BXNS/BLXNS instructions automate this "clearing" — the hardware guarantees that no secure data leaks into non-secure registers.

In professional firmware, BXNS is used extensively in PSA-compliant systems. Zephyr's `arm_trustzone_do_ns_call` in `arch/arm/core/trustzone.c` uses BLXNS to call non-secure functions for non-critical processing (e.g., network stack, display rendering). FreeRTOS's `SecureInit.c` calls `TZ_InitContextSystem_S` which configures the transition using BLXNS. The ARM Platform Security Architecture (PSA) firmware framework defines a Secure Partition Manager (SPM) that uses BXNS to switch between secure partitions. CMSIS-Core provides `__TZ_set_ns_pointer` and `__TZ_import_func` macros for type-safe NS function calls.

Visualize the transition as a state machine: Secure → BXNS → Non-Secure (all securable registers cleared). Non-Secure → SG at NSC entry → Secure (registers restored). During the Non-Secure execution, the secure stack is preserved but inaccessible to non-secure. The FPU context can be lazy-saved for efficiency if `FPU_FPCCR.LSPEN` is configured.

Key points:
1. BXNS jumps to Non-Secure; BLXNS calls and saves return information on the secure stack.
2. On entry to Non-Secure, R0-R3, R12 are cleared for security isolation.
3. Non-secure returns via `SG` at an NSC entry point.
4. The secure stack must be MSP (not PSP) for the transition to work.
5. The `TT` (Test Target) instruction can check whether an address is Secure or Non-Secure before branching.


References:
1. ARMv8-M ARM (DDI0553) section B1.6, Zephyr `trustzone.c`, FreeRTOS `secure_init.c`, CMSIS-Core `core_cm33.h` TZ functions, PSA Firmware Framework for M (FF-M) specification V1.1, ARM AN326 "TrustZone for Cortex-M".
