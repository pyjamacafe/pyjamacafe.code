+++
date = '2026-07-06T18:31:00+05:30'
draft = false
title = 'Priority Inversion in Nested Interrupts'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 4
initial_code = '''#include <stdio.h>

// Simulated priority levels
#define PRIORITY_LOW    0xC0
#define PRIORITY_MED    0x80
#define PRIORITY_HIGH   0x40

volatile int shared_resource = 0;

void low_priority_isr(void) {
    // Takes shared resource
    shared_resource = 1;

    // While holding resource, a medium-priority interrupt can preempt
    // But if high-priority interrupt needs the same resource, it must wait
    // This causes priority inversion

    // Simulate work
    for (volatile int i = 0; i < 1000; i++);

    shared_resource = 0;
}

void high_priority_isr(void) {
    // Needs shared_resource — may be blocked by low-priority ISR
    if (shared_resource == 1) {
        printf("Priority inversion: high-priority waiting for low\\n");
    }
}

int main(void) {
    printf("Priority inversion scenario:\\n");
    printf("Low-priority ISR acquires resource\\n");
    printf("Medium-priority ISR preempts low\\n");
    printf("High-priority ISR needs resource, blocked by low\\n");
    printf("Low can't run because medium is running\\n");
    printf("-> High-priority ISR delayed indefinitely\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Priority inversion scenario described'
+++

## Problem Statement

Describe and simulate the priority inversion problem in nested interrupt handling. Explain the scenario: a low-priority ISR holds a shared resource, a medium-priority ISR preempts it (preventing the low-priority ISR from releasing the resource), and a high-priority ISR that needs the resource is blocked indefinitely.

## Theory and Concepts

- Priority inversion occurs when a higher-priority task/ISR is blocked waiting for a resource held by a lower-priority entity, and a medium-priority entity prevents the lower-priority one from releasing the resource.
- In interrupt handling, if ISRs use spinlocks or non-preemptive critical sections, priority inversion can occur.
- Solutions: priority inheritance (the low-priority ISR temporarily inherits the high-priority's priority), priority ceiling protocol, or avoiding shared resources in interrupt handlers.
- The NVIC's fixed priority ordering means a lower-priority interrupt cannot run if a higher-priority one is pending — this prevents the classic inversion in pure interrupt scenarios but can still occur with mutex-based synchronisation.
- ARM Cortex-M BASEPRI register can be used to implement priority inheritance in interrupt handlers.

## Real World Application

Priority inversion is a well-known problem in real-time systems — it famously caused the Mars Pathfinder priority inversion bug in 1997. In embedded systems, it occurs when ISRs and tasks share resources protected by mutexes or critical sections without priority inheritance support.
