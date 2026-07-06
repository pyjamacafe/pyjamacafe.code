+++
date = '2026-07-06T18:23:00+05:30'
draft = false
title = 'Interrupt and Naked Function Attributes'
difficulty = 'medium'
language = 'c'
topic_weight = 1
subtopic_weight = 19
weight = 1
initial_code = '''#include <stdio.h>

// interrupt attribute tells the compiler to use exception return
__attribute__((interrupt)) void my_isr(void) {
    // The compiler automatically saves/restores context
    // and uses BX LR with EXC_RETURN
    printf("ISR executed\\n");
}

// naked attribute: no prologue/epilogue — for pure assembly
__attribute__((naked)) void startup_asm(void) {
    // Must contain only assembly — the compiler will not
    // generate any function frame
    __asm(
        "LDR R0, =_estack\\n"
        "MOV SP, R0\\n"
        "BL main\\n"
        "B .\\n"
    );
}

int main(void) {
    printf("Attributes demonstrated\\n");
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Function attributes demonstrated'
+++

## Problem Statement

Use `__attribute__((interrupt))` and `__attribute__((naked))` to control how the compiler generates function prologue and epilogue. Explain that `interrupt` causes the compiler to generate an exception return sequence (BX LR with EXC_RETURN), while `naked` suppresses all prologue/epilogue for pure assembly routines.

## Theory and Concepts

- `__attribute__((interrupt))`: tells the compiler to generate code suitable for an exception handler — it saves/restores all registers and uses an exception return instruction (BX LR with a value that indicates return to Thread/Handler mode).
- `__attribute__((naked))`: suppresses function prologue (stack frame creation) and epilogue — the function body is used exactly as written, typically containing only assembly.
- `__attribute__((weak))`: allows a function definition to be overridden by a strong definition in another object file.
- `__attribute__((always_inline))`: forces the compiler to inline a function regardless of optimisation level.
- These attributes are GCC/Clang extensions; ARM Compiler uses `__irq` and `__asm` respectively.

## Real World Application

The `interrupt` attribute is used for ISRs in older codebases and simpler projects; modern CMSIS uses the `__RAM_FUNC` or `__WEAK` attributes. The `naked` attribute is essential for startup code (`Reset_Handler`), context-switch routines, and SVC handlers that must not modify the stack frame.
