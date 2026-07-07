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

===EXPLANATION===

GCC and Clang function attributes give the programmer fine‑grained control over how the compiler generates function entry and exit sequences. On ARM Cortex‑M, two attributes are particularly important for low‑level system programming: `interrupt` and `naked`.

`__attribute__((interrupt))` tells the compiler this function is an exception handler. The compiler generates a prologue that saves all registers the function might use and an epilogue that uses `BX LR` with the EXC_RETURN value (not a normal `POP {PC}` return). This frees the programmer from manually saving/restoring registers — a convenience, but one that adds code size and cycles. CMSIS‑style handlers rarely use this attribute; instead, they rely on the hardware's automatic stacking and mark handlers as ordinary functions.

`__attribute__((naked))` is the opposite: it suppresses ALL prologue and epilogue code. The compiler generates exactly the assembly in the function body, nothing more. This is mandatory for functions that manipulate the stack frame directly — like `Reset_Handler` (which sets up stacks before C code runs), PendSV handlers (which switch PSP), and SVC handlers (which read the exception frame). A `naked` function must not use local variables or return statements; all control flow must be explicit assembly.

The `weak` attribute is also critical: it allows toolchain‑supplied default handler implementations. If the application defines the same symbol, the application's version takes precedence. This is how CMSIS startup files provide `HardFault_Handler` as a weak infinite loop — override it with your own handler and the linker uses yours.

Visualise function attributes as stage directions in a play script. `interrupt` is "enter with full costume and exit with a flourish". `naked` is "enter with no costume and leave through the trapdoor". `weak` is "understudy available — star actor may replace".

Key points: (1) `interrupt`‑attribute functions cannot return a value. (2) `naked` functions cannot use local C variables. (3) `weak` symbol resolution happens at link time, not compile time. (4) ARM Compiler uses `__irq` for interrupt and `__asm` for naked. (5) The `always_inline` attribute is useful for ISRs in performance‑critical paths.

GCC documentation for ARM‑specific function attributes, and ARM Compiler's `__attribute__` reference, list all available attributes. CMSIS‑Core source files (e.g., `core_cm33.h`) demonstrate modern attribute usage patterns.
