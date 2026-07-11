+++
date = '2026-07-06T18:03:00+05:30'
draft = true
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
    printf("System ready. Triggering context switch...\n");
    trigger_context_switch();
    printf("Back in main\n");
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

===EXPLANATION===

PendSV (Pendable Service Call) was introduced with the Cortex‑M3 specifically to solve a problem that plagued earlier ARM designs: how to perform a context switch cleanly without interfering with higher‑priority interrupt handlers. Before PendSV, developers had to either disable all interrupts during the switch (increasing latency) or use complex state machines to defer the switch.

The intuition is simple: PendSV is an exception that stays pending until the CPU has no higher‑priority exceptions to service. By programming it to the lowest priority, you guarantee the context switch runs only after all interrupts — including SysTick — have completed. This elegantly solves the problem of a SysTick interrupt firing while a high‑priority ISR is still running: the context switch is deferred until that ISR finishes.

In FreeRTOS, the assembly routine `xPortPendSVHandler` (or `vPortSVCHandler` for the initial switch) saves R4‑R11 and the PSP to the current task's stack, loads the next task's PSP, restores R4‑R11, and returns with an EXC_RETURN value that loads the new PSP. The hardware automatically saves and restores R0‑R3, R12, LR, PC, and xPSR on exception entry and return — PendSV only handles the callee‑saved registers.

Visualise two actors on a stage sharing one costume rack. When actor A finishes their scene (is interrupted), they hang their costume (registers) on the rack (stack). Actor B walks on, takes the next costume, and performs. PendSV is the stage manager who ensures the change happens only after the applause (interrupts) dies down.

Key points:
1. PendSV priority must be the lowest of all programmable exceptions.
2. Trigger by writing 1 to ICSR bit 28 (PENDSVSET).
3. The handler uses the current stack pointer — it must run on MSP.
4. Only callee‑saved registers (R4‑R11) need manual save/restore; the hardware stack frame handles the rest.
5. EXC_RETURN in LR determines whether execution resumes on MSP or PSP.


The ARM Architecture Reference Manual, section on exception entry and exit, defines the PendSV behaviour. FreeRTOS port layers for Cortex‑M and the CMSIS‑RTOS2 reference implementation provide concrete, field‑tested PendSV handlers.
