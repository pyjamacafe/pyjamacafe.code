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
    printf("PSP = 0x%08X\\n", get_psp());

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
