+++
date = '2026-07-06T18:06:00+05:30'
draft = true
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
        "TST LR, #4\n"       // Check which stack was used
        "ITE EQ\n"
        "MRSEQ R0, MSP\n"
        "MRSNE R0, PSP\n"
        "LDR R0, [R0, #24]\n" // Load stacked PC
        "LDRB R0, [R0, #-2]\n" // Load SVC number
        "BX LR\n"
    );
}

int main(void) {
    printf("Triggering SVC...\n");
    __asm("SVC #1");
    printf("Returned from SVC\n");
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

===EXPLANATION===

The SVC (Supervisor Call) instruction, formerly SWI in ARM7, is the classic mechanism for user‑mode code to request a privileged service from the kernel. On Cortex‑M, thread mode can be unprivileged (CONTROL bit 0 set), and handler mode is always privileged. SVC triggers an exception that transitions the CPU to handler mode, giving the kernel full access to system resources that the caller does not have.

Encoding the service number directly in the instruction — `SVC #N` where N is 0‑255 — eliminates the need for a dedicated parameter register for the call type. The handler decodes N by reading the stacked PC: the SVC instruction is a 16‑bit Thumb instruction (0xDFxx) located at PC‑2 from the faulting address. Bit 2 of EXC_RETURN (LR) tells the handler whether the caller used MSP or PSP, which is essential for accessing the correct stack frame.

In FreeRTOS, the very first context switch is performed via `SVC #0`. The SVC handler initialises the RTOS tick timer and restores the first task's context. This elegantly sidesteps a chicken‑and‑egg problem: before the scheduler starts, there is no PendSV configuration, but a synchronous exception is always available.

A real‑world microkernel system might define SVC numbers: 0 = yield, 1 = send message, 2 = receive message, 3 = create task. The handler uses a jump table indexed by the immediate value to dispatch to the appropriate kernel function with full privilege.

Visualise a hotel concierge desk. Guests (unprivileged threads) cannot enter the back office (kernel space). They write a request number on a slip of paper (SVC immediate) and slide it under the door. The concierge (SVC handler) reads the number, performs the service using their master key (privileged access), and returns the result.

Key points:
1. SVC is synchronous — it always executes immediately.
2. The SVC number must be extracted from the instruction encoding, not from a register.
3. The handler must correctly determine MSP vs PSP from EXC_RETURN[2].
4. SVC can be called from both privileged and unprivileged code.
5. Nested SVC calls are not recommended and require careful stack management.


The ARM Architecture Reference Manual, "Supervisor Call" chapter, details the instruction encoding and exception behaviour. Joseph Yiu's *Definitive Guide to ARM Cortex‑M* provides step‑by‑step examples of SVC handler implementation with assembly.
