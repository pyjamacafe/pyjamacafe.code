+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Mixing Assembly and C'
difficulty = 'medium'
language = 'c'
topic_weight = -18
subtopic_weight = 0
weight = 1
initial_code = '''extern int add(int a, int b);

int main(void) {
    int result = add(5, 3);
    *(volatile int*)0x10000000 = result;
    while (1);
    return 0;
}'''
+++

## Problem Statement

How do you call assembly functions from C and vice versa? What ABI rules must both sides follow to ensure arguments are passed correctly and registers are preserved?

## Theory and Concepts

The RISC-V calling convention (part of the RISC-V ABI) defines a standard set of rules for function calls. When a C function calls an assembly function, the compiler generates code that follows these rules, and the assembly function must also follow them for correct operation.

**Argument registers (a0–a7):** The first eight integer arguments are passed in registers a0 through a7. If there are more than eight arguments, additional arguments are passed on the stack. The return value is placed in a0.

**Callee-saved vs. caller-saved registers:** Registers s0–s11 (saved registers) must be preserved by the callee. If the callee modifies them, it must save them to the stack and restore them before returning. Registers a0–a7, ra, t0–t6 are caller-saved — the callee may freely modify them.

**Prologue and epilogue:** The function prologue saves the return address (ra) and any callee-saved registers on the stack, then adjusts the stack pointer (sp). The epilogue restores saved registers and ra, then returns using `ret`.

## Real World Application

Embedded firmware frequently mixes C and assembly. Performance-critical inner loops, CPU initialization (cache, MMU, FPU), and low-level hardware access (interrupt handlers, context switching in RTOS) are often written in assembly while the bulk of application logic is written in C. Understanding the calling convention is essential for writing interrupt service routines in assembly that properly save and restore CPU state, and for calling those routines from C.

===EXPLANATION===

When you write `extern int add(int a, int b);` in C and `add` is implemented in assembly, the compiler generates a call instruction (`jal ra, add`) that jumps to the assembly label. The values `5` and `3` are placed in registers a0 and a1 respectively by the C compiler before the call. The assembly function performs `add a0, a0, a1` — this computes `a0 + a1` and stores the result back into a0, which is the designated return value register. Finally, `ret` (equivalent to `jalr zero, ra, 0`) returns control to the caller. The C code then reads a0 as the return value.

The inverse case — calling C from assembly — follows the same rules. The assembly code must load arguments into a0–a7 (and the stack if needed), then execute `jal ra, function_name`. Upon return, the result is in a0. The assembly code is responsible for saving and restoring any registers it cares about around the call, since the C function follows the standard calling convention and may clobber all caller-saved registers.

Stack management is critical: the stack pointer sp must always remain 16-byte aligned (per the RISC-V ABI), and the frame must be set up correctly if local variables or saved registers are stored. In embedded systems with limited stack space, understanding and auditing the prologue/epilogue code helps prevent subtle stack overflow bugs.

===CODE===

```c {title="main.c"}
extern int add(int a, int b);

int main(void) {
    int result = add(5, 3);
    *(volatile int*)0x10000000 = result;
    while (1);
    return 0;
}
```

```asm {title="add.S"}
.text
.globl _start
_start:
    lui sp, 0x80000
    jal main
1:  j 1b

.globl add
add:
    add a0, a0, a1
    ret
```

```makefile {title="Makefile"}
CC = riscv64-unknown-elf-gcc
CFLAGS = -march=rv64gc -mabi=lp64d -O2 -Wall -nostdlib -nostartfiles
LDFLAGS = -Wl,-Ttext=0x80000000

all: program.elf

program.elf: main.o add.S
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ main.o add.S

main.o: main.c
	$(CC) $(CFLAGS) -c -o $@ $<

clean:
	rm -f *.o program.elf

run: program.elf
	qemu-system-riscv64 -nographic -machine virt -kernel program.elf
```

===QUIZ===

## Which register is used to return a value from a function in the RISC-V calling convention?

- [ ] ra
- [ ] sp
- [x] a0
- [ ] t0

Correct: C
Explanation: The a0 register is designated for returning values from functions. For a 64-bit value, a1 may also be used for the upper 64 bits of a 128-bit return type.

## Which registers must be preserved by a callee function in the RISC-V ABI?

- [ ] a0–a7
- [ ] t0–t6
- [ ] ra and sp only
- [x] s0–s11

Correct: D
Explanation: Registers s0–s11 (saved registers) are callee-saved. If the callee modifies them, it must save them to the stack in the prologue and restore them in the epilogue.
