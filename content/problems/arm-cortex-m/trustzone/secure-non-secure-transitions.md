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

