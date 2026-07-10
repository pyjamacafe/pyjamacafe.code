+++
date = '2026-07-06T18:05:00+05:30'
draft = false
title = 'Process Stack Pointer for Threads'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 16
weight = 3
initial_code = '''#include <stdio.h>

#define CONTROL_REG  (*(volatile unsigned int *)0xE000ED80)

void set_psp(unsigned int addr) {
    __asm("MSR PSP, %0" : : "r" (addr));
}

void set_control(unsigned int value) {
    __asm("MSR CONTROL, %0" : : "r" (value));
    __asm("ISB");
}

unsigned int get_psp(void) {
    unsigned int result;
    __asm("MRS %0, PSP" : "=r" (result));
    return result;
}

// Thread stack (in RAM)
unsigned int thread_stack[256];

int main(void) {
    // Set PSP to top of thread stack
    set_psp((unsigned int)&thread_stack[256]);

    // Switch to PSP (bit 1 of CONTROL) and unprivileged (bit 0)
    set_control(0x03);

    // Now running on PSP in unprivileged mode
    printf("PSP = 0x%08X\n", get_psp());

    // Switch back to MSP for kernel
    set_control(0x00);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'PSP configured and thread mode demonstrated'
+++

## Problem Statement

Configure the Process Stack Pointer (PSP) for thread-level code, switch the current stack from MSP to PSP by setting the CONTROL register, and then switch back. Demonstrate that handler mode always uses MSP while thread mode can use either MSP or PSP.

## Theory and Concepts

- The Cortex-M has two stack pointers: MSP (Main Stack Pointer) used by default in handler mode and optionally in thread mode, and PSP (Process Stack Pointer) used for thread stacks in an RTOS.
- Bit 1 of the CONTROL register selects between MSP (0) and PSP (1) in thread mode.
- Handler mode always uses MSP regardless of the CONTROL register setting.
- The PSP is initialised by the RTOS for each thread/process to provide an independent stack.
- On exception entry, the CPU automatically uses the appropriate stack pointer (MSP for handler, configured for thread).

## Real World Application

All ARM Cortex-M RTOSes use PSP for thread stacks — this separates kernel stack (MSP) from application thread stacks (PSP), preventing a thread stack overflow from corrupting the kernel's critical data structures.

===EXPLANATION===

The Cortex‑M provides two stack pointers — MSP (Main Stack Pointer) and PSP (Process Stack Pointer) — to support a fundamental OS design principle: kernel data structures must be protected from user‑mode stack corruption. Handler mode always uses MSP. Thread mode can use either MSP or PSP, selected by CONTROL[1]. RTOSes assign MSP to the kernel and PSP to each thread, creating isolated stack regions.

This separation is not merely a safety feature — it enables a clean context switch. On exception entry, the hardware automatically uses PSP if CONTROL[1] was set before the exception. The stacked frame is placed on the thread's PSP, and after saving the callee‑saved registers, the kernel switches to a new thread by updating PSP and executing an exception return. The hardware then unwinds the frame from the new PSP.

In FreeRTOS, each task's stack is allocated during `xTaskCreate()`. The task function runs in thread mode on its PSP. When the task is preempted, the hardware pushes R0‑R3, R12, LR, PC, xPSR (and optionally FPU registers) onto the PSP. The PendSV handler then saves R4‑R11 and stores the PSP in the task's TCB. It loads the next task's PSP from its TCB, restores R4‑R11, and returns, causing the hardware to pop the frame from the new PSP.

Visualise a building with two elevators. One elevator (MSP) runs express between the ground floor (handler mode) and the penthouse (kernel). The other elevator (PSP) serves each apartment's floor (thread stacks). If someone overloads the apartment elevator, it stops on that floor — the express elevator continues running.

Key points:
1. CONTROL[1] selects PSP in thread mode; handler mode always uses MSP.
2. The PSP must be initialised before setting CONTROL[1] — an invalid PSP causes a fault immediately.
3. On exception entry, the hardware reads CURRENT stack pointer for the frame — not the active stack pointer.
4. Writing to CONTROL requires an ISB to ensure the new stack selection takes effect.
5. Some toolchain startup code uses MSP for both modes; RTOS ports switch to PSP in `main()`.


The ARMv7‑M and ARMv8‑M Architecture Reference Manuals, "Stack Pointer Selection" section, specify the precise behaviour. FreeRTOS's `port.c` for Cortex‑M and the CMSIS‑RTOS2 thread management implementation demonstrate production PSP usage.
