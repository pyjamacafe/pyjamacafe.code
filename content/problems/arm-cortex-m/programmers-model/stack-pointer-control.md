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

===EXPLANATION===

The dual-stack architecture (MSP and PSP) was introduced with the Cortex-M3 (ARMv7-M) and backported to ARMv6-M via a limited form in later revisions. Before Cortex-M, ARM microcontrollers had a single stack pointer (R13). The Cortex-M3 Technical Reference Manual (2005) described two stack pointers for the first time: the Main Stack Pointer (MSP) used during exceptions and optionally in Thread mode, and the Process Stack Pointer (PSP) used in Thread mode. The CONTROL register bit [1] (SPSEL) selects between them: 0 = MSP, 1 = PSP. The hardware automatically uses MSP during exception handlers regardless of the CONTROL setting, ensuring the interrupt stack is always separate from the task stack.

The intuition is about isolation. Imagine a house with a single front door (one stack): anyone entering (interrupt) uses the same floor space as the occupants (tasks). If a visitor tracks in mud (stack overflow), the occupants' belongings get dirty. Two stacks are like a service entrance for deliveries (MSP for interrupts) and a main entrance for residents (PSP for tasks) — they never interfere. The Cortex-M hardware enforces this: on exception entry, hardware saves registers to PSP (if in Thread mode using PSP) then switches to MSP for the handler. On exception return, it restores PSP and switches back.

Real-world RTOS implementations rely on this heavily. FreeRTOS sets PSP during `xPortStartScheduler` — each task gets its own stack allocated from the heap, and the kernel configures PSP to point to the current task's stack top. The MSP is a fixed, small kernel stack for interrupts only. Zephyr does the same in `arch/arm/core/thread.c`: each thread's `callee_saved.sp` is loaded into PSP on context switch. When an interrupt fires while executing a user task, the hardware saves the task's context to its own PSP, then uses MSP for the ISR. This guarantees that even if a task's stack overflows, the interrupt handlers remain functional. Mbed OS's RTX kernel configures PSP in `rtx_core_cm.h` with `__set_PSP()` and `__set_CONTROL()`.

Visualize the stack layout: MSP sits at a fixed high address (usually the end of SRAM) and grows downward. Each task's PSP sits at a different address in SRAM. The linker script defines `_estack` for MSP, and the OS allocates PSP ranges. The process stack pointer is only valid in Thread mode — writing to PSP in Handler mode has no effect until a return to Thread mode.

Key points: (1) MSP is always used in Handler mode, regardless of CONTROL. (2) SPSEL (CONTROL[1]) only takes effect in Thread mode. (3) Writing CONTROL requires privileged mode and must be followed by an ISB. (4) PSP is typically set to the highest address of the task stack (minus 8 for AAPCS alignment). (5) The hardware does not switch to PSP automatically — the OS must program CONTROL and MSR PSP.

References: ARMv7-M ARM (DDI0403) B1.4, FreeRTOS `xPortStartScheduler`, Zephyr `arch/arm/core/thread.c`, CMSIS-Core `core_cm.h` stack functions (`__set_MSP`, `__set_PSP`), Cortex-M3 TRM (DDI0337) section 2.2.

