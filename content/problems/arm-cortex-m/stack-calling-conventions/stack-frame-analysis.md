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

    printf("Stack trace:\\n");

    for (uint32_t i = 0; i < depth && fp != 0; i++) {
        uint32_t return_addr = ((uint32_t*)fp)[1];
        uint32_t prev_fp = ((uint32_t*)fp)[0];

        printf("  #%u: LR=0x%08X FP=0x%08X SP=0x%08X\\n",
               i, return_addr, fp, sp);

        fp = prev_fp;
        sp = (uint32_t)&((uint32_t*)fp)[2];
    }
}

void func_c(int depth) {
    uint32_t local_var = 0xCCCCCCCC + depth;
    printf("\\nfunc_c(depth=%d): local=0x%08X, SP=0x%08X\\n",
           depth, local_var, get_sp());
    print_stack_trace(5);
}

void func_b(int depth) {
    uint32_t local_b = 0xBBBBBBBB;
    printf("func_b: local=0x%08X, SP=0x%08X\\n", local_b, get_sp());
    func_c(depth + 1);
}

void func_a(void) {
    uint32_t local_a = 0xAAAAAAAA;
    printf("func_a: local=0x%08X, SP=0x%08X\\n", local_a, get_sp());
    func_b(1);
}

int main(void) {
    printf("Stack Frame Analysis\\n\\n");
    printf("Initial SP=0x%08X\\n", get_sp());

    func_a();

    printf("\\nFinal SP=0x%08X (should match initial)\\n", get_sp());

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

