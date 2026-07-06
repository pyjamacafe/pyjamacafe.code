+++
date = '2026-07-06T18:06:00+05:30'
draft = false
title = 'SVCall for System Calls'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 16
weight = 4
initial_code = '''#include <stdio.h>

#define SHCSR  (*(volatile unsigned int *)0xE000ED24)

// SVCall handler — receives the exception frame
__attribute__((naked)) void SVC_Handler(void) {
    // Extract the SVC number from the stacked PC
    // The SVC instruction is 2 bytes: 0xDFxx where xx is the number
    __asm(
        "TST LR, #4\\n"       // Check which stack was used
        "ITE EQ\\n"
        "MRSEQ R0, MSP\\n"
        "MRSNE R0, PSP\\n"
        "LDR R0, [R0, #24]\\n" // Load stacked PC
        "LDRB R0, [R0, #-2]\\n" // Load SVC number
        "BX LR\\n"
    );
}

int main(void) {
    printf("Triggering SVC...\\n");
    __asm("SVC #1");
    printf("Returned from SVC\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'SVC called and returned'
+++

## Problem Statement

Use the SVC (Supervisor Call) instruction to enter handler mode from thread mode, simulating a system call. The SVC handler extracts the SVC number from the stacked PC and dispatches to the appropriate kernel function. Demonstrate a simple SVC call that returns a result.

## Theory and Concepts

- SVC (previously called SWI) is used by application code to request a service from the operating system kernel.
- The SVC number is encoded in the instruction: `SVC #N` where N is 0–255.
- The handler determines the SVC number by reading the stacked PC (at offset 24 in the exception frame) and subtracting 2 to point to the instruction, then reading the immediate value.
- The handler must check whether MSP or PSP was used by examining bit 2 of the EXC_RETURN value in LR.
- SVC is the traditional mechanism for user-to-kernel transitions in ARM-based RTOSes.

## Real World Application

SVC is used in RTOSes for system calls — creating tasks, sending messages, acquiring semaphores, and requesting I/O. FreeRTOS uses SVC for its initial context switch, and many microkernel designs rely on SVC for protected system calls.
