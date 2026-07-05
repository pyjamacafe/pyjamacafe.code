+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Interrupt-safe Flag'
difficulty = 'hard'
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

Implement a flag that can be safely set from an interrupt context and cleared from the main loop.

Use a `volatile` flag and show how to disable and restore interrupts around the clear operation if needed.

Assume helper functions `irq_disable()` and `irq_restore()` are available.
