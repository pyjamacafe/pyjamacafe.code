+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Control Flow and Functions'
difficulty = 'medium'
language = 'c'
topic_weight = -17
subtopic_weight = 0
weight = 4
initial_code = '''#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main(void) {
    int x = 10;
    int y = 20;
    int result;

    if (x < y) {
        result = add(x, y);
    } else {
        result = x - y;
    }

    printf("Result: %d\\n", result);
    return 0;
}
'''
+++

## Problem Statement

How do C control flow constructs compile to branch instructions? What is the cost of a function call in terms of cycles and stack usage? Trace how `if/else`, `for` loops, and function calls are implemented in RISC-V assembly.

## Theory and Concepts

- **if/else → branch**: An `if (condition) { A } else { B }` compiles to: evaluate condition, `beq`/`bne` to jump over A (or B), execute the appropriate block. The condition is any expression evaluating to zero (false) or non-zero (true).
- **Loops → jumps**: A `while (cond) { body }` compiles to: evaluate condition, branch to exit if false, execute body, jump back to condition check. `for` and `do-while` are syntactic sugar over this pattern.
- **switch → jump table**: A `switch` with dense case values may compile to a jump table — an array of addresses indexed by the case value. This is O(1) dispatch instead of a chain of comparisons.
- **Function prologue/epilogue**: On entry, a function saves the return address (`ra`) and callee-saved registers to the stack, adjusts the stack pointer (`sp`). On exit, it restores registers and returns via `jalr zero, ra, 0` (RISC-V `ret`).
- **Stack frames**: Each function call creates a stack frame — the region between the old `sp` and the new `sp` after prologue. The frame stores: return address, saved registers, local variables that don't fit in registers, and any `alloca`-allocated space.
- **Calling convention**: The ABI (Application Binary Interface) defines how arguments are passed (in registers `a0`–`a7`, then stack) and which registers must be preserved across calls (callee-saved: `s0`–`s11`, `sp`, `ra`).

## Real World Application

Function call overhead matters in embedded systems. An interrupt service routine must be as fast as possible — every instruction in the prologue/epilogue adds latency. Inline functions (`static inline`) eliminate call overhead by expanding the function body at each call site. The compiler's `-Os` (optimize for size) flag may decide not to inline, while `-O2` aggressively inlines small functions. Understanding stack frames helps estimate worst-case stack usage, which is critical in systems without virtual memory (stack overflow corrupts adjacent memory).

===EXPLANATION===

![Function Machine](/images/embedded-101/c-programming/function-machine.jpeg)

A function in C is a reusable block of code with a defined interface (inputs, output). When the compiler encounters a function call, it generates a `jal` (jump and link) instruction in RISC-V. This instruction saves the return address (the address of the next instruction after the call) into register `ra` and jumps to the function's entry point. The function then executes its prologue, body, and epilogue before returning via `ret` (pseudo-instruction for `jalr zero, ra, 0`).

For the code:
```c
int add(int a, int b) {
    return a + b;
}

int main(void) {
    int x = add(5, 3);
    return 0;
}
```

The generated RISC-V assembly (simplified, with optimizations off) might look like:
```asm
add:
    addi sp, sp, -48      # prologue: allocate stack frame
    sw   ra, 44(sp)       # save return address
    sw   s0, 40(sp)       # save frame pointer
    addi s0, sp, 48       # set frame pointer
    sw   a0, -36(s0)      # save argument a0
    sw   a1, -40(s0)      # save argument a1
    lw   a5, -36(s0)      # load a
    lw   a4, -40(s0)      # load b
    add  a5, a5, a4       # a5 = a + b
    mv   a0, a5           # set return value
    lw   ra, 44(sp)       # restore ra
    lw   s0, 40(sp)       # restore s0
    addi sp, sp, 48       # deallocate frame
    jr   ra               # return

main:
    addi sp, sp, -16
    sw   ra, 12(sp)
    li   a0, 5            # first argument = 5
    li   a1, 3            # second argument = 3
    jal  add              # call add; ra = return addr
    sw   a0, -20(s0)      # x = return value
    li   a0, 0            # return 0
    lw   ra, 12(sp)
    addi sp, sp, 16
    jr   ra
```

Control flow constructs map directly to branch instructions. An `if (x < y)` compiles to something like `lw a5, ...; lw a4, ...; bge a5, a4, .Lelse;` — if x >= y, branch to the else block. A `while` loop compiles to a backward branch: execute body, evaluate condition, `bne` back to loop start if true, fall through if false.

![If-Else Ladder](/images/embedded-101/c-programming/if-else-ladder.jpeg)

A `switch` with dense, contiguous case labels (e.g., `case 0: ... case 1: ... case 2:`) may compile to a jump table. The compiler builds an array of code addresses, subtracts the smallest case value from the switch expression, and uses the result as an index into the table. This is a single indirect jump — O(1) dispatch — versus O(n) for a chain of if-else comparisons.

Function inlining eliminates all this overhead. The compiler copies the function body directly into the caller, removing the `jal`/`ret` pair and the stack frame allocation. For small functions called frequently (like a UART putc wrapper), inlining can significantly improve performance and reduce code size (counterintuitively — call overhead code may be larger than the inlined body).

References: K&R Ch. 3 (Control Flow) and Ch. 4 (Functions); "Computer Systems: A Programmer's Perspective" (CS:APP) Ch. 3 (Machine-Level Representation of Programs). For RISC-V calling convention: "RISC-V Calling Convention" specification, RISC-V International. For jump tables: Patterson & Hennessy, "Computer Organization and Design" §2.13 (Jump Tables).

===QUIZ===

## In the RISC-V calling convention, which register holds the return address after a `jal` instruction?
- [ ] a0
- [ ] sp
- [ ] t0
- [ ] ra
Correct: D
Explanation: The `jal` (jump and link) instruction saves the address of the instruction following the jump into register `ra` (x1). The callee returns to this address using `jalr zero, ra, 0` (assembler pseudo-instruction `ret`).

## What is the primary advantage of a jump table implementation for a `switch` statement?
- [ ] It reduces code size compared to if-else chains
- [ ] It executes in O(1) time regardless of the number of cases
- [ ] It works with non-integer case expressions
- [ ] It eliminates the need for a default case
Correct: B
Explanation: A jump table is an array of code addresses indexed by the case value. The compiler computes the index, does a single indirect jump through the table, and arrives at the correct case handler — all in constant time, regardless of how many cases exist. In contrast, an if-else chain must evaluate each condition sequentially.
