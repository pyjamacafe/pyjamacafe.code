+++
date = '2026-07-06T10:47:00+05:30'
draft = true
title = 'Callee-Saved vs Caller-Saved Registers'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 2
initial_code = '''// Demonstrate callee-saved and caller-saved register conventions
#include <stdio.h>
#include <stdint.h>

uint32_t callee_saved_demo(uint32_t a, uint32_t b) {
    uint32_t tmp1 = a * 2;
    uint32_t tmp2 = b * 3;
    uint32_t tmp3 = tmp1 + tmp2;
    uint32_t tmp4 = tmp3 / 2;

    __asm volatile(
        "PUSH {R4-R7}          \n\\t"
        "MOV R4, %0            \n\\t"
        "MOV R5, %1            \n\\t"
        "ADD R6, R4, R5        \n\\t"
        "LSL R7, R6, #2        \n\\t"
        "MOV %0, R7            \n\\t"
        "POP {R4-R7}           \n\\t"
        : "+r" (a)
        : "r" (b)
        : "r4", "r5", "r6", "r7"
    );

    return a;
}

int use_scratch_registers(int x) {
    int r0 = x + 1;
    int r1 = r0 * 2;
    int r2 = r1 - 3;
    int r3 = r2 / 4;
    return r3;
}

int main(void) {
    printf("Callee-Saved vs Caller-Saved Registers\n\n");

    printf("Caller-saved (R0-R3, R12):\n");
    printf("  - Saved by the CALLER before function call\n");
    printf("  - Used for arguments and scratch values\n");
    printf("  - Compiler saves them if values needed after call\n\n");

    int result = use_scratch_registers(10);
    printf("  use_scratch_registers(10) = %d\n\n", result);

    printf("Callee-saved (R4-R11):\n");
    printf("  - Saved by the CALLEE if modified\n");
    printf("  - Preserved across function calls\n");
    printf("  - Used for local variables and temporaries\n\n");

    uint32_t calc = callee_saved_demo(5, 7);
    printf("  callee_saved_demo(5, 7) = %u\n\n", calc);

    printf("Register classification:\n");
    printf("  R0-R3:    Argument/scratch (caller-saved)\n");
    printf("  R4-R11:   Variable (callee-saved)\n");
    printf("  R12 (IP): Intra-call scratch (caller-saved)\n");
    printf("  R13 (SP): Stack pointer (callee-saved)\n");
    printf("  R14 (LR): Link register (caller-saved)\n");
    printf("  R15 (PC): Program counter\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the difference between callee-saved (R4-R11) and caller-saved (R0-R3) registers. Implement a function that uses callee-saved registers with explicit push/pop, and another that uses scratch registers. Show that values in callee-saved registers persist across function calls.

## Theory and Concepts

- Callee-saved (R4-R11): if the callee modifies these, it must save and restore them (usually on the stack).
- Caller-saved (R0-R3, R12): the caller must save these before a call if their values are needed after.
- LR (R14): technically caller-saved. Changed by BL/BLX. Caller saves if the value is needed after nested calls.
- SP (R13): callee-saved. The callee must restore SP to its original value before returning.
- Compilers track which registers are live across calls and generate save/restore code automatically.
- In interrupt handlers, all used registers must be saved because the handler could preempt any code.
- Cortex-M hardware automatically saves R0-R3, R12, LR, PC, xPSR on exception entry.

## Real World Application

Context switching in RTOS kernels saves and restores R4-R11 (and other state) because these are the callee-saved registers that hold task-specific values across function calls.

===EXPLANATION===

The division of ARM Cortex-M registers into callee-saved (R4–R11) and caller-saved (R0–R3, R12) is one of the most fundamental concepts in the ARM Architecture Procedure Call Standard (AAPCS). This classification determines which registers survive a function call unchanged and which may be destroyed, and it directly dictates how compilers generate code, how RTOS kernels perform context switches, and how interrupt handlers must behave.

Historically, this split emerged from the need to balance two competing goals: fast function calls (by minimizing register saving) and reliable program behavior (by preserving values across calls). The ARM calling convention, refined over decades from the original ARM7TDMI through the Cortex-M series, settled on the current split. The idea is that lightweight "leaf" functions—those that call no other functions—can freely use R0–R3 as scratch registers without saving anything. Heavier functions that need persistent local variables across deeper calls use R4–R11, accepting the overhead of saving and restoring them.

The intuition works like this: imagine you are in main() and call helper(). Before the call, main() places values in R0–R3 that it needs after helper() returns. But because R0–R3 are caller-saved, helper() can overwrite them freely—it's main()'s responsibility to save them if they matter. Conversely, if main() stores something important in R4, it knows helper() must preserve it (R4 is callee-saved). If helper() needs to use R4, it must push it on entry and pop it on exit. This contract is checked by the compiler, not by hardware.

In professional RTOS implementations (FreeRTOS, Zephyr, ThreadX), context switching is a beautiful demonstration of callee-saved semantics. The PendSV handler swaps one task's R4–R11 for another's: it pushes the outgoing task's R4–R11 onto its stack, updates PSP, then pops the incoming task's R4–R11. R0–R3 and R12 are not saved because they are caller-saved and contain no task-persistent state—they are scratch registers that any interrupt or function call can freely modify. The hardware exception frame (R0–R3, R12, LR, PC, xPSR) saves R0–R3 and R12 because an exception can happen anywhere, and the interrupted code's scratch values must be preserved to continue correctly.

Visualize the register file as two neighborhoods: the "public square" (R0–R3, R12) where anyone can write, and the "private offices" (R4–R11) where occupants protect their desks. When a function call happens, it's like a visitor entering the office: the visitor can write on the public whiteboard freely, but must ask permission (push) before rearranging anything in a private office. SP (R13) is callee-saved—the stack must be balanced on return. LR (R14) is effectively caller-saved; the caller saves LR before a nested call because BL overwrites it.

Key points:
1. The compiler manages save/restore automatically—you rarely need inline assembly for this unless writing OS code.
2. Interrupt handlers must save any register they modify, including R4–R11; the Cortex-M hardware saves R0–R3, R12, LR, PC, xPSR automatically.
3. The callee/caller distinction only applies to software-invoked function calls, not exceptions.
4. ARMv8-M adds TrustZone which introduces additional register banking for secure vs non-secure state.
5. FPU registers S0–S31 are caller-saved (lazy stacking can defer the save).


References:
1. AAPCS (ARM IHI 0042E), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" by Joseph Yiu (Chapter 2 on registers and Chapter 8 on exceptions), FreeRTOS Cortex-M port source, and the ARM Compiler armasm User Guide section on procedure calls.
