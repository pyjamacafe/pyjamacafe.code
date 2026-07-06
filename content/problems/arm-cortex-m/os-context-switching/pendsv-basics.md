+++
date = '2026-07-06T18:03:00+05:30'
draft = false
title = 'PendSV for Context Switching'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 16
weight = 1
initial_code = '''#include <stdio.h>

#define NVIC_INT_CTRL  (*(volatile unsigned int *)0xE000ED04)
#define PENDSVSET      (1 << 28)

// Simulated thread stacks
unsigned int thread_stack[2][256];
unsigned int *current_sp;

void trigger_context_switch(void) {
    // Trigger PendSV exception by setting the PENDSVSET bit
    NVIC_INT_CTRL = PENDSVSET;
}

// PendSV handler (would be in assembly in real code)
void PendSV_Handler(void) {
    // Save current context (R4-R11) to current SP
    // Switch to next thread's stack
    // Restore next thread's context
    // Return using EXC_RETURN with PSP
    __asm("bkpt #0");  // Placeholder
}

int main(void) {
    printf("System ready. Triggering context switch...\\n");
    trigger_context_switch();
    printf("Back in main\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'PendSV context switch simulated'
+++

## Problem Statement

Configure the PendSV exception as the context-switch mechanism for an RTOS. Write the trigger routine that sets the PENDSVSET bit in the NVIC Interrupt Control and Status Register, and outline the PendSV handler that saves and restores CPU registers to switch between two thread contexts.

## Theory and Concepts

- PendSV (Pendable Service Call) is a standard Cortex-M exception designed for context switching.
- It has programmable priority and is typically set to the lowest priority so it runs after all other exceptions.
- The context switch is triggered by writing 1 to bit 28 of NVIC_INT_CTRL (ICSR).
- The PendSV handler saves callee-saved registers (R4–R11) to the current stack, switches stack pointer to the next thread, and restores registers from the new stack.
- Using PSP (Process Stack Pointer) for thread stacks separates thread stack from handler stack (MSP).

## Real World Application

PendSV is the foundation of every ARM Cortex-M RTOS — FreeRTOS, RTX, ThreadX, Mbed OS, and Zephyr all use PendSV for context switching. Understanding PendSV is essential for RTOS porting, device driver development, and low-level systems programming.
