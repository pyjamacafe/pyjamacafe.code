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

===EXPLANATION===

Stack overflow is the silent killer of embedded systems. The stack grows downward from high addresses; when it exceeds its allocated region, it overwrites adjacent memory — typically global variables, the heap, or another task's stack. The corruption may not cause immediate failure; instead, a function pointer gets overwritten, a control loop computes with bad data, or a flag changes value — leading to a crash that points nowhere near the root cause.

Three detection techniques dominate embedded practice. The stack canary is the simplest: a known pattern (e.g., 0xDEADBEEF) is written at the stack's boundary during initialisation. Periodic checks verify the canary is intact. If corrupted, the system either resets or triggers a diagnostic routine. The overhead is one comparison per check point — negligible for most applications.

MPU‑based protection is the professional choice. The Memory Protection Unit creates a guard region at the stack's boundary with no access permissions. Any stack overflow that touches this region generates an immediate MemManage fault, precisely identifying the culprit instruction. The zero runtime overhead makes MPU protection ideal for production code. The trade‑off is that each stack (MSP, PSP, and each RTOS task's PSP) requires an MPU region — MPU hardware supports only 8‑16 regions.

Stack watermarking fills the entire stack area with a pattern (e.g., 0xAAAAAAAA) at startup. Periodically, the system scans from the stack's low end upward, counting how many bytes of the pattern remain intact. This determines the maximum stack depth (high‑water mark) used so far, helping developers size stacks accurately during development.

Visualise the stack as a water well. The bucket (function calls) lowers the water level (grows the stack) until it reaches the bottom. A canary is a bell at the bottom — if the bucket hits it, a bell rings. An MPU guard is a fence around the well — if the bucket hits the fence, a loud alarm sounds.

Key points: (1) Stack grows downward — the canary is placed at the lowest address. (2) MPU guard regions must be aligned to 32 bytes. (3) Watermarking is non‑destructive and can run alongside production code. (4) RTOS task stacks each need individual overflow protection. (5) The linker script must allocate the stack region and export `_estack`.

ARM's *Cortex‑M3 Technical Reference Manual* "MPU" chapter and Joseph Yiu's *Definitive Guide* cover MPU‑based stack protection. MISRA‑C and CERT C coding standards recommend stack overflow detection for safety‑critical systems.
