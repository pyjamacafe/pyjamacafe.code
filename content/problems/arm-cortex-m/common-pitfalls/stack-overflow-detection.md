+++
date = '2026-07-06T18:30:00+05:30'
draft = false
title = 'Stack Overflow Detection'
difficulty = 'hard'
language = 'c'
topic_weight = 1
subtopic_weight = 20
weight = 3
initial_code = '''#include <stdio.h>

// Stack canary — place at the end of the stack region
#define STACK_CANARY 0xDEADBEEF
extern unsigned int _estack;  // Top of stack

void check_stack(void) {
    volatile unsigned int *canary = &_estack - 1;
    if (*canary != STACK_CANARY) {
        printf("Stack overflow detected!\\n");
        while (1);
    }
}

// Deep recursion to trigger overflow
void recurse(int depth) {
    char buffer[128];  // Stack usage
    check_stack();
    if (depth > 0) recurse(depth - 1);
}

int main(void) {
    // Place canary at the bottom of the stack
    volatile unsigned int *canary = &_estack - 1;
    *canary = STACK_CANARY;

    // Test with safe depth
    recurse(5);
    printf("Safe depth passed\\n");

    // Uncomment to test overflow:
    // recurse(1000);
    // printf("Will not reach here\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Stack canary verified'
+++

## Problem Statement

Implement stack overflow detection using a stack canary (guard value) placed at the end of the stack region. Write a recursive function that places a marker at the stack boundary and checks for corruption at each call level. When the canary is overwritten, the overflow is detected.

## Theory and Concepts

- Stack overflow occurs when the stack grows beyond its allocated region, corrupting adjacent memory (globals, heap, or other stacks).
- Detection methods:
  - **Stack canary**: a known value placed at the stack boundary that is checked periodically — if overwritten, overflow occurred.
  - **MPU guard region**: an MPU region with no access placed below the stack to generate a MemManage fault on overflow.
  - **Stack watermarking**: fill the stack with a pattern at startup and measure the high-water mark to determine peak usage.
- The stack grows downward from high to low addresses — the canary is placed at the low end of the stack region.
- The linker script defines the stack region; the C startup code can initialise the canary.

## Real World Application

Stack overflow detection is critical in safety-critical systems (automotive, medical) where stack corruption can lead to catastrophic failures. Production code typically uses MPU-based protection for zero runtime overhead, while development builds use canaries for easier debugging.
