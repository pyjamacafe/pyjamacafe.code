+++
date = '2026-07-06T10:48:00+05:30'
draft = false
title = 'Stack Frame Analysis'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 3
initial_code = '''// Analyze stack frames across function calls
#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t fp;
    uint32_t lr;
    uint32_t sp;
    uint32_t pc;
    uint32_t locals[4];
} stack_frame_t;

uint32_t get_fp(void) {
    uint32_t fp;
    __asm volatile("MOV %0, R7" : "=r" (fp));
    return fp;
}

uint32_t get_sp(void) {
    uint32_t sp;
    __asm volatile("MOV %0, SP" : "=r" (sp));
    return sp;
}

void print_stack_trace(uint32_t depth) {
    uint32_t fp = get_fp();
    uint32_t sp = get_sp();

    printf("Stack trace:\n");

    for (uint32_t i = 0; i < depth && fp != 0; i++) {
        uint32_t return_addr = ((uint32_t*)fp)[1];
        uint32_t prev_fp = ((uint32_t*)fp)[0];

        printf("  #%u: LR=0x%08X FP=0x%08X SP=0x%08X\n",
               i, return_addr, fp, sp);

        fp = prev_fp;
        sp = (uint32_t)&((uint32_t*)fp)[2];
    }
}

void func_c(int depth) {
    uint32_t local_var = 0xCCCCCCCC + depth;
    printf("\nfunc_c(depth=%d): local=0x%08X, SP=0x%08X\n",
           depth, local_var, get_sp());
    print_stack_trace(5);
}

void func_b(int depth) {
    uint32_t local_b = 0xBBBBBBBB;
    printf("func_b: local=0x%08X, SP=0x%08X\n", local_b, get_sp());
    func_c(depth + 1);
}

void func_a(void) {
    uint32_t local_a = 0xAAAAAAAA;
    printf("func_a: local=0x%08X, SP=0x%08X\n", local_a, get_sp());
    func_b(1);
}

int main(void) {
    printf("Stack Frame Analysis\n\n");
    printf("Initial SP=0x%08X\n", get_sp());

    func_a();

    printf("\nFinal SP=0x%08X (should match initial)\n", get_sp());

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that analyzes stack frames across nested function calls. Implement a call chain (main → func_a → func_b → func_c) and at each level, capture the frame pointer, stack pointer, and return address. Walk the frame pointer linked list to produce a stack trace.

## Theory and Concepts

- The frame pointer (R7 in Cortex-M, R11 in some ABIs) points to the saved frame pointer on the stack.
- Each stack frame typically contains: [saved FP] [saved LR] [local variables] [callee-saved regs].
- The frame pointer chain: each frame's first word points to the previous frame's FP.
- The second word in each frame is the return address (LR).
- Stack frames are allocated by subtracting from SP at function entry (PUSH) and restored at exit (POP).
- -O0 (no optimization) preserves frame pointers. -O1/-O2 may omit them (use -fno-omit-frame-pointer).
- SP always points to the last used stack location (full descending stack).
- Stack trace generation walks the linked list of frame pointers.

## Real World Application

Stack unwinding is fundamental to debugging and exception handling. Debuggers, fault handlers, and crash reporters use frame pointer walking to produce call stacks. RTOS-aware debugging also requires walking through task stacks.

===EXPLANATION===

Stack frame analysis is the process of walking backwards through the call chain to reconstruct which functions led to the current point of execution. When a deeply embedded system crashes, the call stack—often called a stack trace or backtrace—is the single most valuable piece of information for diagnosing the fault. It tells you not just where the program was when it died, but how it got there.

The concept of a structured stack frame dates back to the earliest days of computing, but the ARM Architecture Procedure Call Standard (AAPCS) formalized it for ARM processors. On Cortex-M, the frame pointer is conventionally R7 (or R11 in some ABIs). Each function's stack frame starts with the saved frame pointer value of the caller, forming a linked list. The second word in each frame is the return address (saved LR), which points back into the caller. By walking this chain from the current function all the way back to main (or Reset_Handler), you can reconstruct the full call sequence.

The intuition is simple: each time a function is called, it pushes the current frame pointer onto the stack and sets up a new frame. The frame pointer acts like a breadcrumb trail—each crumb points to the previous one. When an error occurs, you follow the crumbs backwards. At each step, you read the saved LR to discover the return address (which tells you the function that was called), and the saved FP to find the next crumb. The calling convention guarantees this structure is preserved because it's the only reliable way for the callee to restore the caller's state on return.

Professionally, stack frame analysis is used everywhere: debuggers like GDB and IAR Embedded Workbench show call stacks by walking frame pointers. Fault handlers in production firmware (HardFault_Handler, MemManage_Handler) dump the stack trace to a serial port or store it in non-volatile memory for post-mortem analysis. RTOS-aware debuggers extend this technique by knowing the stack pointer boundaries of each task and walking the individual task stacks. The open-source CMSIS-DSP library and Zephyr RTOS both include utilities for dumping stack traces.

Visualize the stack growing downward: main()'s frame at the top (highest address), then func_a, func_b, func_c at the bottom (lowest address). Each frame consists of: [saved FP of caller] [saved LR/return address] [local variables] [saved callee-saved registers]. The FP register (R7) always points to the saved FP slot in the current frame. Dereferencing FP gives the previous FP; FP+4 gives the return address. Walking continues until FP is NULL or the address is outside known memory regions.

Key points to remember: (1) Frame pointer-based unwinding only works with compiler optimizations that preserve the frame pointer (-O0 or -fno-omit-frame-pointer). (2) The Cortex-M exception stack frame (8 words pushed by hardware) is a different structure from the regular function call frame—don't confuse them. (3) LR contains the return address, not the address of the call instruction; the actual caller address is typically one instruction before the LR value. (4) For Thumb-2 code, return addresses may have bit 0 set (Thumb indicator); mask it off when comparing addresses.

References:
1. AAPCS (ARM IHI 0042E), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" by Joseph Yiu (Chapter 10 on debugging), ARM Infocenter documentation on fault handling and stack unwinding, and the open-source libunwind project which provides platform-independent unwinding.

