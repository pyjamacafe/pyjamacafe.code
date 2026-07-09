+++
date = '2026-07-06T18:00:00+05:30'
draft = false
title = 'DWT Cycle Counter for Profiling'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 14
weight = 3
initial_code = '''#include <stdio.h>

#define DWT_CYCCNT  (*(volatile unsigned int *)0xE0001004)
#define DWT_CONTROL (*(volatile unsigned int *)0xE0001000)
#define DWT_LAR     (*(volatile unsigned int *)0xE0001FB0)
#define SCB_DEMCR   (*(volatile unsigned int *)0xE000EDFC)

void dwt_init(void) {
    // Enable DWT and cycle counter
    SCB_DEMCR |= (1 << 24);       // TRCENA
    DWT_LAR = 0xC5ACCE55;        // Unlock DWT (if locked)
    DWT_CONTROL |= 1;             // Enable CYCCNT
}

unsigned int dwt_get_cycles(void) {
    return DWT_CYCCNT;
}

int main(void) {
    dwt_init();
    unsigned int start = dwt_get_cycles();

    // Code to profile
    volatile int sum = 0;
    for (int i = 0; i < 100; i++) {
        sum += i;
    }

    unsigned int elapsed = dwt_get_cycles() - start;
    printf("Elapsed cycles: %u\\n", elapsed);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Cycle count measured'
+++

## Problem Statement

Initialise the DWT (Data Watchpoint and Trace) cycle counter to measure the execution time of a code section in CPU cycles. Write a simple profiling wrapper that records the cycle count before and after a function call, then prints the difference.

## Theory and Concepts

- The DWT_CYCCNT register increments on every CPU cycle.
- It must be enabled by setting the TRCENA bit in DEMCR and the CYCCNTENA bit in DWT_CONTROL.
- The DWT unit may be locked; writing the unlock key (0xC5ACCE55) to DWT_LAR enables access.
- Cycle counting works on Cortex-M3 and above (M4, M7, M33, M55). Not available on Cortex-M0/M0+/M23.
- The counter wraps every ~4 billion cycles (32-bit). Use `uint32_t` subtraction to handle wrapping correctly.

## Real World Application

Cycle-accurate profiling is essential for optimising time-critical code — interrupt service routines, audio processing, control loops, and communication protocol handling. The DWT cycle counter provides a low-overhead way to measure performance without an external profiler.

===EXPLANATION===

The Data Watchpoint and Trace (DWT) cycle counter is a 32-bit register that increments on every CPU clock cycle, providing a free, cycle-accurate profiling timer on Cortex-M processors. It is the embedded engineer's equivalent of a high-resolution stopwatch, capable of measuring execution time down to a single cycle without external instrumentation. For developers optimizing interrupt handlers, audio codecs, control loops, or communication stacks, the DWT cycle counter is an indispensable tool.

The DWT is part of the ARM CoreSight debug infrastructure, alongside the ITM and FPB (Flash Patch and Breakpoint) units. Introduced with Cortex-M3, the DWT provides watchpoints, PC sampling, and cycle counting. The CYCCNT register at address 0xE0001004 is the simplest and most widely used feature: it runs as a free-running counter once enabled, wrapping at 2^32 cycles (about 4 seconds at 1 GHz, or about 17 seconds at 250 MHz). Its 32-bit width means subtraction must handle wrapping, but standard unsigned arithmetic automatically does this correctly.

The intuition is that CYCCNT is just a counter that ticks every cycle. You read it before a code section, read it after, subtract the two values, and you have the exact number of cycles consumed. No context switches, no interrupt overhead, no calibration—the counter runs continuously and transparently. Because it is memory-mapped and requires only load instructions to read, the measurement overhead is minimal (about 5–10 cycles for two reads and a subtraction). The counter is also readable from interrupt handlers, making it possible to profile ISR latency directly.

In professional firmware development, the DWT cycle counter is used in many contexts. Motor control engineers measure the cycle count of their FOC (Field Oriented Control) loop to know if it fits within the PWM interval. Audio engineers measure their I2S interrupt handler to ensure it finishes before the next sample arrives. Networking engineers profile their TCP/IP stack to see where cycles are spent. RTOS kernel developers measure context switch time, scheduler decision time, and message pass latency. The cycle counter even appears in crash dump analysis—capturing CYCCNT at fault time gives a rough timestamp.

Imagine you want to know how long a particular function takes. You place a `start = DWT_CYCCNT;` before the call and `elapsed = DWT_CYCCNT - start;` after. The difference is the cycle count. For very short functions, the measurement overhead may be significant—account for 5–10 cycles by measuring an empty measurement. For longer functions, the overhead becomes negligible. The counter wraps around, but because you are using unsigned subtraction, the result is always correct as long as the measured interval does not exceed 2^32 cycles.

Key points:
1. Enable CYCCNT by setting TRCENA (DEMCR bit 24) and CYCCNTENA (DWT_CONTROL bit 0). May also need to unlock DWT_LAR with 0xC5ACCE55.
2. Not available on Cortex-M0/M0+/M23—those processors lack the DWT unit entirely.
3. The counter stops in deep sleep modes if the CPU clock stops.
4. For very long measurements, chain a software counter: increment it on CYCCNT wrapping using the DWT comparator match interrupt.
5. CYCCNT can also be used for nanosecond-resolution delay loops, though WFI-based delays are preferred for power.


References:
1. ARM Cortex-M3/M4/M7 Technical Reference Manual (DWT chapter), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 16), ARM AN454, and numerous open-source profiling libraries (e.g., EmBitz profiler, Segger SystemView).
