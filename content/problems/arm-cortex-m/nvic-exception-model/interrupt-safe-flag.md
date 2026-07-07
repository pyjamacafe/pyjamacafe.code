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

===EXPLANATION===

The problem of safely sharing data between interrupt context and main context is as old as interrupt-driven computing itself. When Digital Equipment Corporation introduced interrupt priority levels on the PDP-11 in the 1970s, engineers immediately faced the same question: how do you atomically check-and-clear a flag that an interrupt handler might set at any instant? The answer then, as now, was to temporarily disable interrupts around the critical read-modify-write sequence.

The intuition is straightforward: an interrupt is an asynchronous event that can preempt your code at any machine instruction. If your main loop reads a flag, the interrupt sets it, and then your main loop clears it — that read-modify-write is three separate operations. If the interrupt fires between "read" and "clear," the flag's update is lost. Disabling interrupts during that sequence collapses three operations into an atomic block, ensuring that the interrupt either runs entirely before or entirely after the critical section.

In professional embedded systems, this pattern scales far beyond a single flag. Real-time operating systems use it to protect every kernel data structure — task lists, semaphore counts, queue pointers. The RTOS kernel enters a critical section by disabling interrupts (or using BASEPRI to mask only lower-priority interrupts), performs its sensitive work, then restores the previous interrupt state. The Linux kernel's `local_irq_save` and `local_irq_restore` are direct descendants of this same idea.

Visualize the interrupt timeline as a horizontal line. The main loop executes in thick blocks; interrupts fire as vertical spikes. Without protection, a spike that lands inside a read-check-clear block sees inconsistent state. With `irq_disable`/`irq_restore`, the block becomes an impenetrable fortress — no spike can penetrate it. The `volatile` keyword is the compiler-level counterpart: it erects a fence that prevents the optimizer from caching the flag's value in a register, forcing every read and write to hit actual memory.

Key points: `volatile` prevents compiler optimizations that would skip memory accesses; critical sections prevent interrupt preemption of multi-instruction sequences; use the minimum-duration critical section to keep interrupt latency low; always restore the previous interrupt state rather than unconditionally re-enabling, to support nested critical sections.

References: ARM Architecture Reference Manual ARMv7-M (section B1.3.6 — PRIMASK and BASEPRI), Joseph Yiu's "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors" (Chapter 8 — Exception Handling), and the seminal paper "Interrupts and Critical Sections in Embedded Systems" by Michael Barr.
