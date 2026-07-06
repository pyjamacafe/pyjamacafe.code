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
        "MSR PSP, %0     \\n\\t"
        "MRS R0, CONTROL \\n\\t"
        "ORR R0, R0, #2  \\n\\t"
        "MSR CONTROL, R0 \\n\\t"
        "ISB             \\n\\t"
        : : "r" (psp_addr) : "r0"
    );

    printf("PSP initialized to 0x%08X\\n", psp_addr);
}

uint32_t check_stack_overflow(void) {
    uint32_t stack_bottom = (uint32_t)&stack[0];

    if (stack[0] != STACK_CANARY) {
        printf("STACK OVERFLOW! Bottom canary corrupted\\n");
        return 1;
    }
    if (stack[STACK_SIZE / 4 - 1] != STACK_CANARY) {
        printf("STACK UNDERFLOW! Top canary corrupted\\n");
        return 1;
    }

    uint32_t current_sp;
    __asm volatile("MOV %0, SP" : "=r" (current_sp));

    uint32_t usage = stack_bottom + STACK_SIZE - current_sp;
    uint32_t pct = (usage * 100) / STACK_SIZE;

    if (usage > stack_high_watermark) {
        stack_high_watermark = usage;
    }

    printf("Stack usage: %u/%u bytes (%u%%)  Peak: %u bytes\\n",
           usage, STACK_SIZE, pct, stack_high_watermark);

    return 0;
}

void recursive_func(int depth) {
    volatile uint32_t array[64];
    array[0] = depth;

    if (depth % 10 == 0) {
        if (check_stack_overflow()) {
            printf("Overflow at depth %d\\n", depth);
            while (1);
        }
    }

    if (depth < 16) {
        recursive_func(depth + 1);
    }
}

int main(void) {
    printf("Stack Overflow Detection\\n\\n");

    stack_init();

    recursive_func(0);

    printf("\\nStack peak usage: %u bytes\\n", stack_high_watermark);

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

