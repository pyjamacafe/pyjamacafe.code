+++
date = '2026-07-06T10:00:00+05:30'
draft = false
title = 'R0-R12 General-Purpose Registers'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 2
weight = 1
initial_code = '''// Demonstrate reading and writing R0-R12 registers
#include <stdio.h>
#include <stdint.h>

static uint32_t saved_regs[13];

void save_registers(void) {
    __asm volatile(
        "STR R0, [%0, #0]  \\n\\t"
        "STR R1, [%0, #4]  \\n\\t"
        "STR R2, [%0, #8]  \\n\\t"
        "STR R3, [%0, #12] \\n\\t"
        "STR R4, [%0, #16] \\n\\t"
        "STR R5, [%0, #20] \\n\\t"
        "STR R6, [%0, #24] \\n\\t"
        "STR R7, [%0, #28] \\n\\t"
        "STR R8, [%0, #32] \\n\\t"
        "STR R9, [%0, #36] \\n\\t"
        "STR R10, [%0, #40] \\n\\t"
        "STR R11, [%0, #44] \\n\\t"
        "STR R12, [%0, #48] \\n\\t"
        : : "r" (saved_regs) : "memory"
    );
}

int main(void) {
    uint32_t value = 0xDEADBEEF;

    __asm volatile("MOV R0, %0" : : "r" (value));

    save_registers();

    printf("R0 = 0x%08X\\n", saved_regs[0]);
    printf("All registers saved successfully\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'R0 = 0xDEADBEEF\\nAll registers saved successfully'
+++

## Problem Statement

Write a program that reads and displays the values of general-purpose registers R0 through R12 using inline assembly. Store each register value into an array and print them. Then modify R4-R7 with known test patterns and verify the writes by reading them back.

## Theory and Concepts

- Cortex-M has 16 core registers: R0-R15.
- R0-R12 are general-purpose: R0-R7 are low registers (accessible in all Thumb instructions), R8-R12 are high registers (accessible in Thumb-2 and with MOV/MOVT).
- R0-R3 are used for function arguments and return values (AAPCS convention).
- R4-R11 are callee-saved registers preserved across function calls.
- R12 (IP) is the Intra-Procedure-call scratch register.
- Registers can be read/written using MRS/MSR or inline assembly STR/LDR.

## Real World Application

Context switching in RTOS kernels saves and restores R4-R11 (and other registers) during task switches. Debuggers display register banks for troubleshooting. Understanding register accessibility is essential for writing efficient assembly routines and interrupt handlers.

===EXPLANATION===

The Cortex-M register bank R0-R15 has been stable since ARMv6-M, inheriting its layout from the ARM architecture tradition (ARMv4T onward). The split between "low" (R0-R7) and "high" (R8-R12) registers comes from the Thumb ISA's 16-bit encoding: only low registers can be accessed with most 16-bit Thumb instructions. High registers require 32-bit Thumb-2 encodings (MOV, ADD, CMP, etc.). This is why M0/M0+ (ARMv6-M, which lacks Thumb-2) have difficulty working with R8-R12 — they can only access them via MOV and a few other 32-bit instructions that are present even in ARMv6-M.

Intuitively, R0-R3 are the "scratch" registers — callers expect them to be clobbered by any function call (AAPCS convention). R4-R11 are "preserved" — if a function uses them, it must save and restore them (callee-saved). R12 (IP) is the intra-procedure-call scratch register, often used by linkers for veneers and by the compiler for function epilogue patching. This split is not arbitrary — the compiler ABI (AAPCS) ensures that function call boundaries are efficient: the caller saves only what it needs, and the callee saves only what it touches.

Open-source RTOS implementations demonstrate this perfectly. FreeRTOS's `xPortPendSVHandler` in `port.c` saves R4-R11 on the task stack, performs the context switch, then restores them — this is the fundamental context switch operation. Zephyr's `arch/arm/core/cortex_m/swap.c` uses the same pattern: `__pendsv` saves `r4-r11, lr` and restores the new task's. The Mbed OS RTX kernel's `irq_handlers.s` saves R0-R3 and R12 on exception entry (hardware does this automatically via the stacking mechanism), then the handler saves R4-R11 if needed. CMSIS-Core provides `__get_R4()` through `__get_R11()` macros for debug access.

Visualise the register file as a array of 16 32-bit locations indexed R0-R15. R13=SP, R14=LR, R15=PC. On exception entry, the hardware automatically pushes R0-R3, R12, LR, PC, xPSR onto the current stack in that exact order (8 words for Mainline, same for Baseline). The handler then has R4-R11 as workspace if needed. Exception return pops these 8 words.

Key points:
1. R0-R7 are accessible in all Thumb instructions; R8-R12 need Thumb-2.
2. AAPCS: R0-R3 = arguments/scratch, R4-R11 = callee-saved, R12 = IP.
3. Hardware saves R0-R3, R12, LR, PC, xPSR on exception entry — automatically.
4. Context switches save/restore R4-R11 (and optionally FPU registers).
5. R12 is used by the linker for long-branch veneers — do not rely on its value across calls.


References:
1. ARM AAPCS (IHI0042), ARMv7-M ARM (DDI0403) A2.3, FreeRTOS Cortex-M port (`port.c`), Zephyr `arch/arm/core/cortex_m/swap.c`, CMSIS-Core `core_cm.h` register access macros.
