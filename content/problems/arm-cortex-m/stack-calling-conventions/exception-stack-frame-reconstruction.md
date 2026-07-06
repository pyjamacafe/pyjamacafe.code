+++
date = '2026-07-06T10:50:00+05:30'
draft = false
title = 'Exception Stack Frame Reconstruction'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 5
initial_code = '''// Reconstruct and analyze an exception stack frame
#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t r0;
    uint32_t r1;
    uint32_t r2;
    uint32_t r3;
    uint32_t r12;
    uint32_t lr;
    uint32_t pc;
    uint32_t xpsr;
} exception_frame_t;

typedef struct {
    uint32_t r4;
    uint32_t r5;
    uint32_t r6;
    uint32_t r7;
    uint32_t r8;
    uint32_t r9;
    uint32_t r10;
    uint32_t r11;
    uint32_t sp;
    exception_frame_t basic_frame;
} full_context_t;

void print_full_context(const full_context_t *ctx) {
    printf("Full CPU Context Reconstruction:\\n\\n");
    printf("  R0  = 0x%08X   R8  = 0x%08X\\n",
           ctx->basic_frame.r0, ctx->r8);
    printf("  R1  = 0x%08X   R9  = 0x%08X\\n",
           ctx->basic_frame.r1, ctx->r9);
    printf("  R2  = 0x%08X   R10 = 0x%08X\\n",
           ctx->basic_frame.r2, ctx->r10);
    printf("  R3  = 0x%08X   R11 = 0x%08X\\n",
           ctx->basic_frame.r3, ctx->r11);
    printf("  R4  = 0x%08X   R12 = 0x%08X\\n",
           ctx->r4, ctx->basic_frame.r12);
    printf("  R5  = 0x%08X   SP  = 0x%08X\\n",
           ctx->r5, ctx->sp);
    printf("  R6  = 0x%08X   LR  = 0x%08X\\n",
           ctx->r6, ctx->basic_frame.lr);
    printf("  R7  = 0x%08X   PC  = 0x%08X\\n",
           ctx->r7, ctx->basic_frame.pc);

    uint32_t xpsr = ctx->basic_frame.xpsr;
    printf("\\n  xPSR = 0x%08X\\n", xpsr);
    printf("    N=%u Z=%u C=%u V=%u\\n",
           (xpsr >> 31) & 1, (xpsr >> 30) & 1,
           (xpsr >> 29) & 1, (xpsr >> 28) & 1);
    printf("    Exception: %u\\n", xpsr & 0x1FF);
}

full_context_t capture_context(exception_frame_t *frame) {
    full_context_t ctx;
    uint32_t sp;

    ctx.basic_frame = *frame;
    __asm volatile(
        "STM %0!, {R4-R11}  \\n\\t"
        : : "r" (&ctx.r4) : "memory"
    );

    __asm volatile("MOV %0, SP" : "=r" (sp));
    ctx.sp = sp;

    return ctx;
}

int main(void) {
    printf("Exception Stack Frame Reconstruction\\n\\n");

    exception_frame_t test_frame = {
        .r0 = 0xAAAAAAAA,
        .r1 = 0xBBBBBBBB,
        .r2 = 0xCCCCCCCC,
        .r3 = 0xDDDDDDDD,
        .r12 = 0xEEEEEEEE,
        .lr = 0x08001000,
        .pc = 0x08001004,
        .xpsr = 0x01000003
    };

    full_context_t context = capture_context(&test_frame);

    print_full_context(&context);

    printf("\\nReconstruction method:\\n");
    printf("  1. Hardware pushes: R0-R3, R12, LR, PC, xPSR\\n");
    printf("  2. Software saves:  R4-R11 (by handler or RTOS)\\n");
    printf("  3. SP determines if MSP or PSP was used\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that reconstructs the full CPU context from an exception stack frame. The hardware pushes R0-R3, R12, LR, PC, xPSR automatically. Software must save R4-R11. Create a data structure that combines both into a complete context and print it in a formatted register dump.

## Theory and Concepts

- On exception entry: hardware saves R0-R3, R12, LR (EXC_RETURN), PC, xPSR (8 words = 32 bytes).
- These 8 words are pushed to the current stack (MSP for handler mode, PSP for thread mode).
- R4-R11 are NOT saved by hardware — the handler or RTOS must save them if needed.
- The stacking format is always the same regardless of the exception type.
- Basic frame + software-saved regs = full context for context switching.
- EXC_RETURN in the stacked LR indicates the return mode and stack pointer used.
- Bit 4 of EXC_RETURN: 0 = return to thread, 1 = return to handler.
- Bit 3 of EXC_RETURN: 0 = return with MSP, 1 = return with PSP.

## Real World Application

RTOS context switching saves R4-R11 (and optionally FPU registers) on top of the hardware-saved frame to create a complete task context. Debuggers and crash analyzers reconstruct the full context from the stacked frame to enable stack unwinding and variable inspection.

