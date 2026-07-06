+++
date = '2026-07-06T10:18:00+05:30'
draft = false
title = 'Late Arrival in Exception Handling'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 5
weight = 5
initial_code = '''// Model late arrival and preemption scenarios
#include <stdio.h>
#include <stdint.h>

typedef enum {
    IDLE,
    STACKING,
    HANDLER_RUNNING,
    UNSTACKING
} cpu_state_t;

typedef struct {
    uint32_t priority;
    uint32_t active;
    uint32_t pending;
    uint32_t irq_num;
} irq_channel_t;

void simulate_late_arrival(void) {
    irq_channel_t irq_low  = {2, 0, 0, 0};
    irq_channel_t irq_high = {1, 0, 0, 1};
    cpu_state_t state = IDLE;

    printf("=== Late Arrival Simulation ===\\n");
    printf("IRQ0 priority=2, IRQ1 priority=1 (higher)\\n\\n");

    printf("1. IRQ0 fires\\n");
    irq_low.pending = 1;
    state = STACKING;

    printf("2. Starting stack sequence for IRQ0...\\n");

    printf("3. IRQ1 (high priority) arrives DURING stacking!\\n");
    irq_high.pending = 1;

    if (irq_high.priority < irq_low.priority) {
        printf("4. Late arrival: IRQ1 starts before IRQ0 handler\\n");
        printf("   Stack frame now belongs to IRQ1\\n");
        printf("   IRQ0 remains pending for later\\n");
        irq_low.pending = 0;
        irq_high.pending = 0;
        irq_high.active = 1;
        state = HANDLER_RUNNING;
    } else {
        printf("4. No late arrival (IRQ1 priority not higher)\\n");
    }

    printf("\\n5. IRQ1 handler finishes\\n");
    irq_high.active = 0;
    printf("6. Return to pending IRQ0 via tail-chaining\\n");
    irq_low.active = 1;
    state = HANDLER_RUNNING;

    printf("\\nResult: Late arrival avoided wasting %u cycles\\n", (uint32_t)12);
}

int main(void) {
    simulate_late_arrival();

    printf("\\n=== Without Late Arrival ===\\n");
    printf("IRQ0 stacks -> IRQ0 handler -> IRQ0 unstack\\n");
    printf("Then IRQ1 stacks -> IRQ1 handler -> IRQ1 unstack\\n");
    printf("Total: 58 cycles\\n\\n");

    printf("=== With Late Arrival + Tail-Chaining ===\\n");
    printf("IRQ0 stacking interrupted for IRQ1 -> IRQ1 handler\\n");
    printf("-> IRQ0 handler via tail-chain -> unstack\\n");
    printf("Total: 34 cycles (saves ~24)\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a simulation of the late arrival optimization in the Cortex-M exception model. Model two interrupts with different priorities where a higher-priority interrupt arrives while the processor is stacking registers for a lower-priority interrupt. Show how the hardware cancels the current stacking and processes the higher-priority interrupt first, then returns to the lower-priority one via tail-chaining.

## Theory and Concepts

- Late arrival: a higher priority exception that arrives while the processor is performing stacking for a lower priority exception.
- The processor abandons the stacking for the lower priority exception and starts handling the higher priority one.
- The stack frame that was being created is repurposed for the higher priority exception.
- The lower priority exception remains pending and will be serviced after the higher priority one finishes.
- Late arrival differs from preemption (which occurs after the handler starts executing).
- Late arrival saves the complete stacking cycle for the lower priority exception (approximately 12 cycles).
- Combined with tail-chaining, late arrival further reduces the total latency for nested interrupts.

## Real World Application

High-frequency interrupts (e.g., ADC sampling at 1 MHz or timer capture) benefit significantly from late arrival because tight interrupt timing requirements can be met even when lower-priority interrupts are being processed.

