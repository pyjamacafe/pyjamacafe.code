+++
date = '2026-07-06T10:17:00+05:30'
draft = false
title = 'Exception Entry and Exit Stack Frame Analysis'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 5
weight = 4
initial_code = '''// Analyze the exception stack frame
#include <stdio.h>
#include <stdint.h>

typedef struct {
    uint32_t r0;
    uint32_t r1;
    uint32_t r2;
    uint32_t r3;
    uint32_t r12;
    uint32_t lr;
    uint32_t return_address;
    uint32_t xpsr;
} exception_stack_frame_t;

void print_stack_frame(const exception_stack_frame_t *frame) {
    printf("Exception Stack Frame:\\n");
    printf("  R0  = 0x%08X\\n", frame->r0);
    printf("  R1  = 0x%08X\\n", frame->r1);
    printf("  R2  = 0x%08X\\n", frame->r2);
    printf("  R3  = 0x%08X\\n", frame->r3);
    printf("  R12 = 0x%08X\\n", frame->r12);
    printf("  LR  = 0x%08X\\n", frame->lr);
    printf("  PC  = 0x%08X\\n", frame->return_address);
    printf("  xPSR= 0x%08X\\n", frame->xpsr);
}

void analyze_lr_value(uint32_t exc_return) {
    printf("\\nEXC_RETURN analysis (0x%08X):\\n", exc_return);
    printf("  Bit 31 (must be 1): %lu\\n", (exc_return >> 31) & 1);
    printf("  Bit 4  (mode):     %lu  (%s)\\n",
           (exc_return >> 4) & 1,
           ((exc_return >> 4) & 1) ? "Handler" : "Thread");
    printf("  Bit 3  (SP):       %lu  (%s)\\n",
           (exc_return >> 3) & 1,
           ((exc_return >> 3) & 1) ? "PSP" : "MSP");
    printf("  Bit 2  (FPCA):     %lu\\n", (exc_return >> 2) & 1);
    printf("  Bit 0  (must be 1): %lu\\n", exc_return & 1);
}

int main(void) {
    exception_stack_frame_t test_frame = {
        .r0 = 0xDEADBEEF,
        .r1 = 0xCAFEBABE,
        .r2 = 0x12345678,
        .r3 = 0x87654321,
        .r12 = 0xAABBCCDD,
        .lr = 0x08000100,
        .return_address = 0x08000124,
        .xpsr = 0x01000000
    };

    print_stack_frame(&test_frame);

    analyze_lr_value(0xFFFFFFF1);
    analyze_lr_value(0xFFFFFFF9);
    analyze_lr_value(0xFFFFFFFD);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that models and analyzes the Cortex-M exception entry and exit sequence. Define a structure representing the exception stack frame (8 words pushed on exception entry: R0-R3, R12, LR, PC, xPSR). Write functions to print the frame contents and decode EXC_RETURN values to determine the return behavior.

## Theory and Concepts

- On exception entry, the processor automatically pushes R0-R3, R12, LR, PC, xPSR onto the stack (8 words = 32 bytes).
- The stack pointer used (MSP or PSP) depends on the exception type and current mode.
- LR is updated with EXC_RETURN during exception entry, encoding return behavior.
- EXC_RETURN bit 4: 0 = return to Thread mode, 1 = return to Handler mode.
- EXC_RETURN bit 3: 0 = return with MSP, 1 = return with PSP.
- EXC_RETURN bit 2: FPCA (floating-point active) flag.
- EXC_RETURN bit 0: always 1 (indicating Thumb state).
- On exception exit, the processor pops the stack frame and branches to the return address.

## Real World Application

Debugging embedded systems often requires analyzing the exception stack frame to determine the state of the processor when a fault occurred. Debuggers and crash analyzers decode the stacked registers to reconstruct the call stack and identify the fault location.

