+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Assembler Directives: Controlling the Assembler'
difficulty = 'medium'
language = 'c'
topic_weight = -19
subtopic_weight = 0
weight = 3
initial_code = '''.equ  MY_VAL, 100
.text
.globl _start
_start:
    addi a0, zero, MY_VAL
    addi a7, zero, 93
    ecall'''
+++

## Problem Statement

What are assembler directives and how do they differ from instructions? Give examples of when each is used, and explain the role of `.section`, `.globl`, `.align`, and `.word` in organizing assembly programs.

## Theory and Concepts

Assembler directives (also called pseudo-operations) are commands to the assembler, not CPU instructions. They control section placement, symbol visibility, alignment, data storage, and constant definitions. Unlike instructions, directives do not produce machine code directly — they affect how the assembler organizes and labels the generated binary.

Common RISC-V assembler directives:

| Directive | Purpose | Example |
|-----------|---------|---------|
| `.text` | Place following code in the text (code) section | `.text` |
| `.data` | Place following data in the data section | `.data` |
| `.bss` | Place following data in the BSS section | `.bss` |
| `.globl` | Make a symbol visible to the linker | `.globl _start` |
| `.align n` | Align next data/code to 2^n boundary | `.align 2` |
| `.word v` | Emit a 32-bit value | `.word 0xDEADBEEF` |
| `.byte v` | Emit an 8-bit value | `.byte 0x41` |
| `.equ n, v` | Define a numeric constant | `.equ UART_BASE, 0x1000` |
| `.space n` | Reserve n bytes (zero-filled) | `.space 64` |

## Real World Application

Bare-metal embedded systems rely heavily on directives. `.section` places interrupt vector tables at specific memory addresses. `.align` ensures structure members are properly aligned for the target ABI. `.equ` defines memory-mapped register offsets portably, so changing a peripheral's base address requires only one edit.

===EXPLANATION===

![Directives Explained](/images/embedded-101/assembly/directives-explained.png)

![GNU AS Documentation](/images/embedded-101/assembly/gnu-as-doc.png)

The distinction between directives and instructions is fundamental: an instruction tells the CPU what to do at runtime, while a directive tells the assembler how to build the binary at compile time. For example, `.word 0xDEADBEEF` does not execute anything — it simply places the 32-bit value `0xDEADBEEF` at the current location in the output. The CPU will interpret those bytes as data or as an instruction depending on where the program counter points.

Directives become especially important in multi-section programs. The `.text` section holds executable code, typically placed in ROM or flash on embedded systems. The `.data` section holds initialized global variables that must be copied to RAM at startup. The `.bss` section holds uninitialized globals that are zero-filled by the CRT (C runtime) before `main()` runs. Understanding these sections is critical for writing linker scripts and for minimizing a program's memory footprint — `.bss` variables consume no space in the binary image, only in RAM.

The `.equ` directive is a simple text substitution mechanism: wherever the assembler sees `UART_BASE`, it substitutes `0x10000000`. Unlike C's `#define`, `.equ` applies only within the assembly source and is not processed by a preprocessor. The `.globl` directive controls symbol visibility — only symbols explicitly marked `.globl` are exported to the symbol table for the linker. Without `.globl`, a symbol is local to the file and cannot be referenced from other object files.

===CODE===

Example demonstrating various assembler directives with annotations.

```asm {title="directives.s"}
.equ  UART_BASE, 0x10000000
.equ  UART_TX,   UART_BASE + 0x00

.section .rodata
msg:
    .byte 0x48, 0x65, 0x6C, 0x6C, 0x6F  # "Hello" in ASCII

.section .data
my_data:
    .word 0xDEADBEEF, 0xCAFEBABE
    .align 2

.section .bss
buffer:
    .space 64

.section .text
.globl _start
_start:
    lui   a0, %hi(my_data)
    addi  a0, a0, %lo(my_data)
    lw    a1, 0(a0)
    addi  a7, zero, 93
    ecall
```

```makefile {title="Makefile"}
CROSS_COMPILE = riscv64-unknown-elf-
AS = $(CROSS_COMPILE)as
LD = $(CROSS_COMPILE)ld

all: program.elf

program.elf: directives.o
	$(LD) -o $@ $^

directives.o: directives.s
	$(AS) -o $@ $<

clean:
	rm -f *.o *.elf
```

===QUIZ===

## Which directive makes a symbol visible to other object files during linking?

- [ ] .text
- [ ] .align
- [x] .globl
- [ ] .equ
Correct: C
Explanation: `.globl` exports a symbol to the object file's symbol table so it can be referenced by other modules at link time. Without `.globl`, symbols are file-local.

## What is the primary difference between an assembler directive and a CPU instruction?

- [ ] Directives execute faster than instructions
- [x] Instructions produce machine code; directives control the assembler
- [ ] Directives can only appear at the start of a file
- [ ] Instructions are case-sensitive; directives are not
Correct: B
Explanation: Instructions are translated to binary opcodes that the CPU executes at runtime. Directives are commands to the assembler that control sectioning, alignment, symbol visibility, and data emission.
