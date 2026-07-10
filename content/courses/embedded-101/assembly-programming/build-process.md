+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'The Build Process: From Source to Executable'
difficulty = 'medium'
language = 'c'
topic_weight = -19
subtopic_weight = 0
weight = 4
initial_code = '''.text
.globl _start
_start:
    addi a0, zero, 5
    addi a1, zero, 3
    jal  add_numbers
    addi a7, zero, 93
    ecall

.globl add_numbers
add_numbers:
    add a0, a0, a1
    ret'''
+++

## Problem Statement

Describe the complete build process from source code to executable. What does each tool (assembler, linker) contribute? How are symbols resolved and addresses assigned across multiple source files?

## Theory and Concepts

The build pipeline transforms source files into an executable through two major stages:

1. **Assembler** (`.s` → `.o`): Translates each assembly instruction into machine code. Produces an **object file** with placeholder addresses for external symbols and a **relocation table** listing which locations need fixing up.

2. **Linker** (`.o` → `.elf`): Combines multiple object files, resolves symbol references (matching `jal add_numbers` to the `add_numbers` entry point), and performs **relocation** — patching placeholder addresses with the final memory addresses.

Object files and executables are divided into **sections**:
- `.text` — executable code (read-only, often in flash/ROM)
- `.data` — initialized global/static variables (in RAM)
- `.bss` — zero-initialized global/static variables (in RAM, occupies no space in the binary file)

## Real World Application

Understanding the build process is critical for debugging link-time errors (undefined symbols, duplicate definitions) and for customizing memory layout with **linker scripts**. Embedded projects routinely use linker scripts to place interrupt vectors at address `0x00000000`, code at `0x08000000` (flash), and data at `0x20000000` (RAM). Without this knowledge, developers are helpless when the linker reports "undefined reference" or when the program crashes because a section is mapped to the wrong address.

===EXPLANATION===

![Build Process](/images/embedded-101/assembly/build.jpeg)

![Compiler](/images/embedded-101/assembly/compiler.jpeg)

![Assembler Stages](/images/embedded-101/assembly/assembler-stages.jpeg)

![Linker Stages](/images/embedded-101/assembly/linker-stages.jpeg)

![C to Binary](/images/embedded-101/assembly/c-to-bin.jpeg)

The assembler processes each source file independently in two passes. In pass one, it parses instructions and directives, builds a symbol table (mapping labels to offsets within the section), and identifies unresolved references. In pass two, it emits instruction words with placeholder values for external symbols and records relocation entries. For example, `jal add_numbers` is encoded as a J-type instruction with a dummy immediate; the relocation entry says "at offset 0x10 in `.text`, patch the immediate field with the final address of `add_numbers`".

The linker then takes all object files and performs symbol resolution: it collects every symbol table, verifies that each referenced symbol is defined exactly once, and assigns final memory addresses based on the linker script (or default layout). In our two-file example, `main.o` has an undefined reference to `add_numbers`, and `math.o` provides it. The linker resolves this by placing the `.text` sections of both files consecutively in memory and patching all relocation entries with the final addresses.

The linker script controls this layout precisely. The example linker script places `.text` starting at `0x80000000` (a common RISC-V RAM start), `.data` immediately after, then `.bss`. Relocation is the mechanism that makes this possible: without it, the assembler would need to know the final memory layout at assembly time, which is impossible when multiple files are combined. This separation of concerns — assembler translates, linker arranges — is a foundational design pattern in toolchain architecture.

===CODE===

Multi-file example demonstrating separate compilation and linking.

```asm {title="main.s"}
.text
.globl _start
_start:
    addi a0, zero, 10     # first argument = 10
    addi a1, zero, 20     # second argument = 20
    jal  add_numbers      # call external function
    addi a7, zero, 93     # exit syscall
    ecall
```

```asm {title="math.s"}
.text
.globl add_numbers
add_numbers:
    add a0, a0, a1        # a0 = a0 + a1
    ret
```

```ld {title="link.ld"}
OUTPUT_ARCH(riscv)
ENTRY(_start)

SECTIONS
{
    . = 0x80000000;
    .text : { *(.text) }
    .data : { *(.data) }
    .bss  : { *(.bss) }
}
```

```makefile {title="Makefile"}
CROSS_COMPILE = riscv64-unknown-elf-
AS = $(CROSS_COMPILE)as
LD = $(CROSS_COMPILE)ld

all: program.elf

program.elf: main.o math.o
	$(LD) -T link.ld -o $@ $^

%.o: %.s
	$(AS) -o $@ $<

clean:
	rm -f *.o *.elf
```

===QUIZ===

## What is the primary job of the linker in the build process?

- [ ] Translating assembly mnemonics to binary opcodes
- [x] Resolving symbol references and performing relocation
- [ ] Optimizing the generated machine code for performance
- [ ] Converting object files back to assembly source
Correct: B
Explanation: The assembler handles mnemonic-to-opcode translation. The linker resolves cross-file symbol references and adjusts addresses via relocation entries.

## Which section in an executable contains uninitialized global data that occupies no space in the binary file?

- [ ] .text
- [ ] .data
- [x] .bss
- [ ] .rodata
Correct: C
Explanation: The `.bss` section holds variables that are zero-initialized at runtime. Because all values are zero, only the size and location are stored in the object file — the actual bytes are not present in the binary image.
