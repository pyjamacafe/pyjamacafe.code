+++
date = '2026-07-06T10:03:00+05:30'
draft = false
title = 'Stack Pointer and CONTROL Register'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 4
initial_code = '''// Configure and switch between MSP and PSP
#include <stdio.h>
#include <stdint.h>

#define PSP_STACK_SIZE 256
static uint32_t psp_stack[PSP_STACK_SIZE / 4];

void set_psp_and_control(void) {
    uint32_t psp_addr = (uint32_t)&psp_stack[PSP_STACK_SIZE / 4 - 1];
    psp_addr &= ~7;

    __asm volatile(
        "MSR PSP, %0     \\n\\t"
        "MRS R0, CONTROL \\n\\t"
        "ORR R0, R0, #2  \\n\\t"
        "MSR CONTROL, R0 \\n\\t"
        "ISB             \\n\\t"
        : : "r" (psp_addr) : "r0"
    );
}

uint32_t get_current_sp(void) {
    uint32_t sp;
    __asm volatile("MOV %0, SP" : "=r" (sp));
    return sp;
}

int main(void) {
    printf("Initial SP: 0x%08X\\n", get_current_sp());

    set_psp_and_control();

    printf("After PSP switch SP: 0x%08X\\n", get_current_sp());

    uint32_t current_sp = get_current_sp();
    uint32_t psp_start = (uint32_t)&psp_stack[0];
    uint32_t psp_end = (uint32_t)&psp_stack[PSP_STACK_SIZE / 4 - 1];

    if (current_sp >= psp_start && current_sp <= psp_end + 3) {
        printf("Using PSP: YES\\n");
    } else {
        printf("Using PSP: NO (using MSP)\\n");
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Using PSP: YES'
+++

## Problem Statement

Implement a function that switches the stack pointer from the Main Stack Pointer (MSP) to the Process Stack Pointer (PSP). Allocate a 256-byte stack in SRAM, set PSP to the top of it (aligned to 8 bytes), and update the CONTROL register to select PSP. Verify the switch by reading SP and comparing the address range.

## Theory and Concepts

- Cortex-M has two stack pointers: MSP (used in handler mode and optionally thread mode) and PSP (used in thread mode).
- CONTROL register bit [1] selects the stack pointer: 0 = MSP, 1 = PSP.
- CONTROL register bit [0] selects privilege level: 0 = privileged, 1 = unprivileged.
- MSR writes to special registers; MRS reads them.
- ISB (Instruction Synchronization Barrier) ensures the new stack pointer is used after the switch.
- PSP is typically used by RTOSes for thread stacks, MSP for interrupt handlers.

## Real World Application

RTOS kernels use PSP for each task's stack, allowing the kernel to run on MSP. This isolates task stacks from the kernel and interrupt stack, preventing a stack overflow in one task from corrupting other tasks or the kernel.

