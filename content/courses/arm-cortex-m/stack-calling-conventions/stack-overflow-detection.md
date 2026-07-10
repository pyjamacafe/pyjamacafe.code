+++
date = '2026-07-06T10:49:00+05:30'
draft = false
title = 'Stack Overflow Detection'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 4
initial_code = '''// Detect stack overflow with stack canaries
#include <stdio.h>
#include <stdint.h>

#define STACK_SIZE 256
static uint32_t stack[STACK_SIZE / 4];

#define STACK_CANARY 0xDEADBEEF

static uint32_t stack_high_watermark = 0;

void stack_init(void) {
    stack[0] = STACK_CANARY;
    stack[STACK_SIZE / 4 - 1] = STACK_CANARY;

    for (int i = 1; i < STACK_SIZE / 4 - 1; i++) {
        stack[i] = 0;
    }

    uint32_t psp_addr = (uint32_t)&stack[STACK_SIZE / 4 - 1];
    psp_addr &= ~7;

    __asm volatile(
        "MSR PSP, %0     \n\\t"
        "MRS R0, CONTROL \n\\t"
        "ORR R0, R0, #2  \n\\t"
        "MSR CONTROL, R0 \n\\t"
        "ISB             \n\\t"
        : : "r" (psp_addr) : "r0"
    );

    printf("PSP initialized to 0x%08X\n", psp_addr);
}

uint32_t check_stack_overflow(void) {
    uint32_t stack_bottom = (uint32_t)&stack[0];

    if (stack[0] != STACK_CANARY) {
        printf("STACK OVERFLOW! Bottom canary corrupted\n");
        return 1;
    }
    if (stack[STACK_SIZE / 4 - 1] != STACK_CANARY) {
        printf("STACK UNDERFLOW! Top canary corrupted\n");
        return 1;
    }

    uint32_t current_sp;
    __asm volatile("MOV %0, SP" : "=r" (current_sp));

    uint32_t usage = stack_bottom + STACK_SIZE - current_sp;
    uint32_t pct = (usage * 100) / STACK_SIZE;

    if (usage > stack_high_watermark) {
        stack_high_watermark = usage;
    }

    printf("Stack usage: %u/%u bytes (%u%%)  Peak: %u bytes\n",
           usage, STACK_SIZE, pct, stack_high_watermark);

    return 0;
}

void recursive_func(int depth) {
    volatile uint32_t array[64];
    array[0] = depth;

    if (depth % 10 == 0) {
        if (check_stack_overflow()) {
            printf("Overflow at depth %d\n", depth);
            while (1);
        }
    }

    if (depth < 16) {
        recursive_func(depth + 1);
    }
}

int main(void) {
    printf("Stack Overflow Detection\n\n");

    stack_init();

    recursive_func(0);

    printf("\nStack peak usage: %u bytes\n", stack_high_watermark);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Implement stack overflow detection using canary values. Place a known pattern (0xDEADBEEF) at the top and bottom of the stack. Periodically check if the canaries are intact. Also track stack high-water mark by recording the minimum stack pointer value seen during execution.

## Theory and Concepts

- Stack overflow: the stack grows beyond its allocated region, corrupting adjacent memory (heap, data).
- Stack underflow: the stack pointer moves above the top of the stack region.
- Stack canaries: known values placed at stack boundaries. If the value changes, an overflow occurred.
- High-water marking: track the lowest SP value seen to measure peak stack usage.
- Cortex-M has no hardware stack overflow detection (unlike MPU-based detection).
- The stack grows downward (full descending): SP decrements before storing.
- PSP and MSP are separate — overflows in one don't directly affect the other.
- Recursive functions, large local arrays, and deep call chains are common overflow causes.

## Real World Application

Production firmware uses stack canaries and high-water marks during development to determine optimal stack sizes. RTOS kernels often check stack canaries during context switches to detect task stack overflows.

===EXPLANATION===

Stack overflow is the silent killer of embedded systems. Unlike a desktop application that gracefully segfaults, an embedded system that overflows its stack will corrupt adjacent memory—typically the heap, the data section, or another task's stack—causing mysterious crashes, corrupted sensor readings, or communication failures that are nearly impossible to reproduce. Stack overflow detection using canaries and high-water marking is the most practical defense available on Cortex-M processors, which lack hardware stack limit checking (unless an MPU is present).

The technique dates back to at least the 1990s, when buffer overflow exploits in network stacks popularized canary values. The "canary in a coal mine" analogy is perfect: you place a known value (the canary) at the stack boundaries and periodically check if it is still alive. If the canary is dead (overwritten), the stack has grown beyond its allocated region. In embedded systems, the GNU linker script explicitly defines the stack region, and a canary is placed at its lowest address (the "bottom" of the downward-growing stack). High-water marking tracks the deepest SP penetration ever observed, giving a quantitative measurement of peak stack usage.

The intuition is simple: the stack grows downward from a high address to a low address. The bottom of the stack (lowest valid address) is the last line of defense. If the stack pointer ever goes below this address, memory corruption begins. By placing a sentinel value at this boundary and checking it in the idle loop or after every context switch, you catch overflows before they cause damage. High-water marking is even simpler: at system startup, fill the entire stack region with a known pattern (e.g., 0xDEADBEEF or 0xCD). Periodically scan from the bottom upward to see how much of the pattern remains; the deepest modified byte marks the peak stack usage.

Professionally, production firmware from companies like ARM, NXP, and STMicroelectronics uses both techniques. FreeRTOS includes stack overflow checking as a compile-time option (configCHECK_FOR_STACK_OVERFLOW). When enabled, it checks the task's stack canary during every context switch. Amazon FreeRTOS and Zephyr both support stack canaries as a debugging feature. In safety-critical systems (automotive ISO 26262, medical IEC 62304), stack overflow detection is mandatory—the system must detect and safely handle the fault, not crash unpredictably.

Visualize a stack region as a block of 256 bytes. The very first word (lowest address) is the canary, set to 0xDEADBEEF. The entire rest of the block is filled with 0xCD (the "dead man's pattern"). The stack pointer starts at the highest address. As functions call deeper and allocate local arrays, the SP descends. A deeply recursive function like `recursive_func` with a 64-word local array will quickly consume stack space. If the recursion goes too deep, the SP passes the canary address, writing 0xCD's above it—but also overwriting the canary. The next check sees the canary is gone and triggers a fault handler.

Key points:
1. Stack canaries cannot prevent overflow—they only detect it after the fact.
2. High-water marking gives you the data to right-size stacks: measure during worst-case testing, then allocate 20–30% headroom.
3. On Cortex-M, if using the process stack pointer (PSP) for tasks, each task needs its own canary and stack region.
4. The main stack pointer (MSP) is used for interrupts—interrupt stack overflow will corrupt the main stack's canary.
5. Canary corruption itself can trigger a HardFault if the corrupted memory contains a function pointer or other critical data.


References:
1. "Definitive Guide to ARM Cortex-M3 and Cortex-M4" by Joseph Yiu (Chapter 10 on fault handling), FreeRTOS documentation on stack overflow detection, The GNU Linker manual section on MEMORY regions and stack placement, and the MPU guide in ARM AN321 on using the MPU for stack protection.
