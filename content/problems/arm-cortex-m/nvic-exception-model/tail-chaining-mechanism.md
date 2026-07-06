+++
date = '2026-07-06T10:16:00+05:30'
draft = false
title = 'Tail-Chaining Mechanism'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 5
weight = 3
initial_code = '''// Demonstrate tail-chaining behavior
#include <stdio.h>
#include <stdint.h>

volatile uint32_t irq_count[3] = {0, 0, 0};

void simulate_tail_chain(void) {
    irq_count[0]++;

    if (irq_count[0] == 1) {
        __asm volatile("MOV R0, #1");
    }
}

void simulate_irq_0(void) {
    irq_count[0]++;
    printf("IRQ 0 handler (count=%u)\\n", irq_count[0]);
}

void simulate_irq_1(void) {
    irq_count[1]++;
    printf("IRQ 1 handler (count=%u)\\n", irq_count[1]);
}

void simulate_irq_2(void) {
    irq_count[2]++;
    printf("IRQ 2 handler (count=%u)\\n", irq_count[2]);
}

void test_tail_chaining(void) {
    printf("\\n=== Tail-Chaining Test ===\\n");
    printf("Scenario: IRQ0 triggers, IRQ1 pending during IRQ0\\n");

    irq_count[0] = 0;
    irq_count[1] = 0;

    simulate_irq_0();
    simulate_irq_1();

    printf("\\nWithout tail-chaining: 2 complete stack/unstack cycles\\n");
    printf("With tail-chaining: IRQ1 starts without unstacking/restacking\\n");
    printf("Saved %u cycles\\n", (uint32_t)26);
}

int main(void) {
    printf("Cortex-M Exception Tail-Chaining\\n");
    test_tail_chaining();

    printf("\\n=== Multiple Pending Test ===\\n");

    for (int i = 0; i < 3; i++) {
        simulate_irq_0();
    }

    printf("IRQ counts: %u, %u, %u\\n",
           irq_count[0], irq_count[1], irq_count[2]);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that models and explains the tail-chaining optimization in the Cortex-M exception model. Simulate a scenario where one interrupt is pending while another is being serviced, and calculate the cycle savings compared to the non-tail-chaining approach (which would pop and re-push the stack frame between handlers).

## Theory and Concepts

- Tail-chaining: when an exception is pending during the return of the current exception, the processor skips the unstack and re-stack of the register frame.
- Without tail-chaining: exception entry (stack) + handler + exception exit (unstack) + next exception entry (stack) + handler + exit (unstack) = 2 complete cycles.
- With tail-chaining: exception entry (stack) + handler + next handler directly (no unstack/stack) + exit = 1 complete cycle + 1 handler.
- Tail-chaining saves approximately 12 CPU cycles (6 for unstack + 6 for re-stack).
- Tail-chaining works only when the pending exception has equal or higher priority than the current.
- Late arrival (a higher priority exception arriving during stacking) is a different optimization.
- Both optimizations reduce interrupt latency without software intervention.

## Real World Application

Real-time systems benefit from tail-chaining because it reduces the worst-case interrupt latency. Communication stacks handling multiple peripheral interrupts (UART RX, TX, error) frequently benefit from this hardware optimization.

