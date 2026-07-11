+++
date = '2026-07-06T10:17:00+05:30'
draft = true
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
    printf("Exception Stack Frame:\n");
    printf("  R0  = 0x%08X\n", frame->r0);
    printf("  R1  = 0x%08X\n", frame->r1);
    printf("  R2  = 0x%08X\n", frame->r2);
    printf("  R3  = 0x%08X\n", frame->r3);
    printf("  R12 = 0x%08X\n", frame->r12);
    printf("  LR  = 0x%08X\n", frame->lr);
    printf("  PC  = 0x%08X\n", frame->return_address);
    printf("  xPSR= 0x%08X\n", frame->xpsr);
}

void analyze_lr_value(uint32_t exc_return) {
    printf("\nEXC_RETURN analysis (0x%08X):\n", exc_return);
    printf("  Bit 31 (must be 1): %lu\n", (exc_return >> 31) & 1);
    printf("  Bit 4  (mode):     %lu  (%s)\n",
           (exc_return >> 4) & 1,
           ((exc_return >> 4) & 1) ? "Handler" : "Thread");
    printf("  Bit 3  (SP):       %lu  (%s)\n",
           (exc_return >> 3) & 1,
           ((exc_return >> 3) & 1) ? "PSP" : "MSP");
    printf("  Bit 2  (FPCA):     %lu\n", (exc_return >> 2) & 1);
    printf("  Bit 0  (must be 1): %lu\n", exc_return & 1);
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

===EXPLANATION===

The Cortex-M exception entry sequence is arguably the most elegant hardware feature of the entire architecture. Before its invention, ARM processors required assembly-language trampoline code in every interrupt handler: save registers, determine the interrupt source, call the handler, and restore registers. The Cortex-M automates all of this in hardware, pushing eight registers (R0–R3, R12, LR, PC, xPSR) onto the stack in a single microcoded sequence.

The intuition behind the stack frame is driven by the principle of transparent preemption. When an interrupt fires, the processor must save enough state so that the interrupted code resumes exactly as if nothing happened. R0–R3 are the caller-saved working registers; R12 is the intra-procedure-call scratch register; LR holds the return address of the interrupted function; PC is the actual instruction pointer; and xPSR captures the condition flags, interrupt mask, and saturation state. These eight words constitute the minimum context needed for transparent resumption.

Professional debugging tools reconstruct entire call stacks from these eight registers. When a HardFault occurs, the stacked PC tells you exactly which instruction caused the fault. The stacked LR reveals the call site. Debuggers like SEGGER J-Link, OpenOCD, and ARM Keil use this data to unwind the call stack, showing the full chain of function calls leading to the crash. In production firmware, crash reporters save this stack frame to flash or transmit it over a serial link for post-mortem analysis.

The EXC_RETURN value stored in LR during exception entry is a clever encoding trick. Rather than using a dedicated register to track the return mode and stack pointer, the processor repurposes LR as an EXC_RETURN code. Values 0xFFFFFFF1, 0xFFFFFFF9, and 0xFFFFFFFD encode thread vs handler mode, MSP vs PSP, and whether the floating-point state was saved. The high 0xFFFFFF prefix ensures these values never collide with valid code addresses.

Visualize the stack frame as a time capsule. When an exception interrupts normal execution, the processor takes a snapshot of eight critical registers and seals them onto the stack. On return, it opens the capsule, restores each register to its exact value, and jumps back to the interrupted instruction. The whole mechanism is symmetric—push on entry, pop on exit—and the hardware guarantees perfect balance.

Key points: eight registers are pushed in a fixed order; the stack pointer selection (MSP/PSP) depends on the exception and current mode; EXC_RETURN bits encode the return behavior; the xPSR preserves ALU flags across the exception; on ARMv7-M with FPU, an additional 16 words may be pushed for floating-point state.

References:
1. ARM Architecture Reference Manual ARMv7-M (section B1.5.6 — Stack frame), Joseph Yiu "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8.4 — Exception Entry and Exit), ARM Infocenter document DDI0403E.

