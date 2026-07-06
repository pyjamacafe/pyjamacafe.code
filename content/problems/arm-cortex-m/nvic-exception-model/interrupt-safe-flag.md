+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Interrupt-safe Flag'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 5
weight = 1
initial_code = '''volatile int event_flag = 0;

void irq_disable(void);
void irq_restore(void);

void isr_handler(void) {
    // Set flag from interrupt
}

void main_loop(void) {
    // Atomically check and clear flag
}
'''

[[test_cases]]
input = ''
expected = 'Flag handled safely'
+++

## Problem Statement

Implement a flag that can be safely set from an interrupt context and cleared from the main loop. In the ISR handler, set the flag to indicate an event occurred. In the main loop, atomically check and clear the flag. Use the provided helper functions `irq_disable()` and `irq_restore()` to protect the read-modify-write sequence in the main loop from interruption. Declare the flag as `volatile` to prevent the compiler from optimising away reads and writes.

## Theory and Concepts

- **Volatile keyword**: Tells the compiler that a variable may change outside the normal execution flow (e.g., by an ISR). Without `volatile`, the compiler might cache the value in a register and miss updates.
- **Interrupt context vs main context**: Interrupt Service Routines run asynchronously and can preempt the main loop at any time. Shared data must be protected.
- **Atomic access**: A read-modify-write sequence (check flag then clear it) can be interrupted partway through. Disabling interrupts during this sequence ensures atomicity.
- **Critical sections**: Code that must not be interrupted is called a critical section. Enter by disabling interrupts, exit by restoring to the previous state.

## Real World Application

Interrupt-safe flags and critical sections are fundamental to every embedded RTOS, device driver, and bare-metal system that handles asynchronous events — button presses, timer expirations, sensor data ready signals, communication byte received events. This pattern appears in virtually all interrupt-driven firmware.
