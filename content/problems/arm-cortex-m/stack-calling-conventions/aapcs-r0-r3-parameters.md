+++
date = '2026-07-06T10:46:00+05:30'
draft = false
title = 'AAPCS: R0-R3 Parameter Passing'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 11
weight = 1
initial_code = '''// Demonstrate AAPCS parameter passing in R0-R3
#include <stdio.h>
#include <stdint.h>

uint32_t add_four(uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    return a + b + c + d;
}

void capture_args(uint32_t r0, uint32_t r1, uint32_t r2, uint32_t r3) {
    printf("Function arguments received in:\\n");
    printf("  R0 = 0x%08X\\n", r0);
    printf("  R1 = 0x%08X\\n", r1);
    printf("  R2 = 0x%08X\\n", r2);
    printf("  R3 = 0x%08X\\n", r3);
}

uint64_t return_64bit(uint32_t lo, uint32_t hi) {
    return ((uint64_t)hi << 32) | lo;
}

int main(void) {
    printf("AAPCS Parameter Passing (R0-R3)\\n\\n");

    printf("Test 1: Four 32-bit parameters\\n");
    uint32_t sum = add_four(0x11, 0x22, 0x44, 0x88);
    printf("  Result in R0: 0x%08X\\n\\n", sum);

    printf("Test 2: Capture argument registers\\n");
    capture_args(0xDEAD, 0xBEEF, 0xCAFE, 0xBAAB);

    printf("\\nTest 3: 64-bit return (R0:R1 pair)\\n");
    uint64_t val = return_64bit(0x12345678, 0x9ABCDEF0);
    printf("  64-bit result: 0x%016llX\\n", (unsigned long long)val);
    printf("  R0 (low):  0x%08X\\n", (uint32_t)val);
    printf("  R1 (high): 0x%08X\\n", (uint32_t)(val >> 32));

    printf("\\nAAPCS rules:\\n");
    printf("  R0-R3: argument registers (caller-saved)\\n");
    printf("  R0:    return value (32-bit) or low half (64-bit)\\n");
    printf("  R1:    return high half (64-bit)\\n");
    printf("  >4 args: passed on stack\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = ''
+++

## Problem Statement

Write a program that demonstrates the AAPCS (ARM Architecture Procedure Call Standard) calling convention for passing parameters in R0-R3. Create functions with different numbers and types of parameters. Show how the compiler places the first four 32-bit arguments in R0-R3 and how 64-bit return values use R0:R1.

## Theory and Concepts

- AAPCS defines how function arguments are passed: first 4 words in R0-R3, remaining on the stack.
- R0 also holds the return value (32-bit or 32-bit low half of 64-bit value).
- R1 holds the upper 32 bits of a 64-bit return value.
- 64-bit arguments (double, long long) occupy two consecutive registers.
- If a 64-bit argument starts at R2, it occupies R2:R3, and R0 is unused for that argument.
- Structures are passed by value in registers if they fit; otherwise by pointer.
- For variadic functions, arguments that would normally go in R0-R3 are also pushed on the stack.
- The callee does not need to save R0-R3 (caller-saved). Caller saves them if needed.

## Real World Application

Understanding AAPCS is essential for writing assembly functions that interface with C code, implementing interrupt handlers that must preserve registers, and debugging function call issues by examining the register state.

===EXPLANATION===

The ARM Architecture Procedure Call Standard (AAPCS) defines the rules for how functions pass arguments, return values, and preserve registers across calls. The portion covering R0–R3 parameter passing is the entry point to understanding how any compiled C or C++ function communicates with its callees. When you write `result = add_four(0x11, 0x22, 0x44, 0x88)`, the compiler generates code that places these values in R0, R1, R2, and R3 respectively—no stack access needed. This register-based argument passing is the primary reason ARM code can be both compact and fast.

The convention has its roots in the original ARM Procedure Call Standard (APCS) from the 1990s, later standardized as AAPCS (ARM IHI 0042E). The design philosophy is simple: the first four words of arguments go in registers because register access is orders of magnitude faster than memory. For typical functions with 0–4 parameters, the calling overhead is almost zero. R0 also doubles as the return value register (or the low 32 bits for a 64-bit return in R0:R1), so the caller immediately finds the result in a register without needing to dereference a pointer.

The intuition is straightforward: stands to reason that the most frequently used data should live in the fastest storage. Arguments and return values are the most transient data in a program—they exist only for the duration of the function call boundary. Putting them in registers avoids the pointless round-trip of writing to the stack only to immediately read back. Functions with more than four arguments push the extras onto the stack, but in practice, well-designed embedded code rarely needs more than four parameters.

In professional firmware, AAPCS matters when you write interrupt handlers in assembly, implement RTOS scheduler code (SVCall handler), or create inline assembly performance-critical sections. The Linux kernel's ARM port, Zephyr RTOS, and CMSIS-Core all rely on AAPCS conventions. When you see `__attribute__((naked))` functions, the compiler does not generate the standard prologue/epilogue—you must follow AAPCS yourself. Understanding R0–R3 usage is also critical for debugging: if a value is corrupted, check whether it was in a caller-saved register at the time of the call.

Picture the register file during a function call: before the branch, the caller loads R0–R3 with arguments (possibly evaluating complex expressions into them). The BL instruction saves the return address in LR and jumps to the callee. Inside the callee, R0–R3 can be freely modified because AAPCS designates them as caller-saved. When the callee finishes, it places the return value in R0 (or R0:R1 for 64-bit), and executes BX LR. The caller finds R0 containing the answer. If the caller needed any of R0–R3's original values after the call, it would have saved them before the BL.

Key points to remember: (1) 32-bit arguments go in a single register; 64-bit arguments (double, long long) occupy two registers (e.g., R2:R3). (2) For variadic functions (printf-style), the standard says all arguments are passed on the stack, even the first four, to simplify the callee's argument traversal. (3) Structures up to 4 words may be passed in registers; larger structures are passed by pointer. (4) The callee does not save R0–R3, so the caller must preserve its own values before the call. (5) R12 (IP) is an intra-procedure-call scratch register, used by the linker for veneers and long branches.

References: AAPCS Specification (ARM IHI 0042E), "Definitive Guide to ARM Cortex-M3 and Cortex-M4" (Chapter 2), ARM Compiler Reference Guide, and the ELF for ARM Architecture Supplement (defining how these conventions map to object files and debug info).

