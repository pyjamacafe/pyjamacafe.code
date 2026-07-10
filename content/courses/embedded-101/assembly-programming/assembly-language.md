+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Assembly Language: Mnemonics and Instruction Formats'
difficulty = 'easy'
language = 'c'
topic_weight = -19
subtopic_weight = 0
weight = 2
initial_code = '''.text
.globl _start
_start:
    addi t0, zero, 10
    addi t1, zero, 20
    add  t2, t0, t1
    addi a7, zero, 93
    ecall'''
+++

## Problem Statement

What is the relationship between assembly language and machine code? Can you hand-assemble a RISC-V instruction from its mnemonic form to the raw 32-bit binary encoding?

## Theory and Concepts

Assembly language is a one-to-one textual mapping to machine code. Each **mnemonic** (e.g., `add`, `lw`, `jal`) corresponds to a specific opcode. **Operands** (registers, immediates, labels) supply the data the instruction operates on. **Labels** provide symbolic names for memory addresses. **Assembler directives** (like `.text`, `.globl`) control the assembly process without generating instructions.

RISC-V RV32I instructions use six formats:
| Format | Fields | Example |
|--------|--------|---------|
| R-type | `funct7 rs2 rs1 funct3 rd opcode` | `add t0, t1, t2` |
| I-type | `imm rs1 funct3 rd opcode` | `addi t0, t1, 5` |
| S-type | `imm rs1 funct3 rs2 opcode` | `sw t0, 0(t1)` |
| B-type | `imm rs1 funct3 rs2 opcode` | `beq t0, t1, label` |
| U-type | `imm rd opcode` | `lui t0, 0x12345` |
| J-type | `imm rd opcode` | `jal ra, label` |

## Real World Application

Hand-assembly is rarely done manually today, but understanding instruction encoding is essential for writing instruction-set simulators, compilers, and disassemblers. It also helps when reading raw machine code during security reverse-engineering or when patching binaries in the field. Tools like `objdump -d` and `riscv64-unknown-elf-objdump -d` perform the reverse mapping automatically.

===EXPLANATION===

![Assembly Program](/images/embedded-101/assembly/asm-prog.png)

![Labels in Assembly](/images/embedded-101/assembly/labels-asm.jpeg)

![BNE Instruction](/images/embedded-101/assembly/bne.png)

The relationship between assembly and machine code is a direct symbolic mapping. Each mnemonic is shorthand for a binary opcode, each register name maps to a 5-bit register number (x0–x31), and each label resolves to a 32-bit address. The assembler's primary job is to resolve all symbolic references and emit the correct instruction words. This stands in contrast to high-level languages (C, Rust) where a single statement can expand to dozens of instructions.

To hand-assemble `addi sp, sp, -32` (adjusting the stack pointer), you identify: I-type format, opcode `0010011` (ADDI), rd=sp(x2=`00010`), rs1=sp(x2=`00010`), funct3=`000`, imm=`111111100000` (sign-extended -32). The word becomes `111111100000_00010_000_00010_0010011` = `0xFF810113`. This skill is useful when you need to verify what a compiler or assembler produced, or when working with instruction encoding in processor design.

RISC-V was designed with a clean, regular encoding that makes hand-assembly easier than CISC ISAs like x86. All instructions are 32 bits (for RV32I), opcodes are consistently placed in bits 6:0, and register fields always occupy the same bit positions within each format. This regularity is a deliberate design choice that simplifies the decoder hardware and makes the ISA easy to learn.

===CODE===

Example RISC-V program that adds two numbers using temporary registers.

```asm {title="add.s"}
.text
.globl _start
_start:
    addi t0, zero, 10     # t0 = 10
    addi t1, zero, 20     # t1 = 20
    add  t2, t0, t1       # t2 = t0 + t1
    addi a7, zero, 93     # a7 = 93 (exit syscall)
    ecall
```

```makefile {title="Makefile"}
CROSS_COMPILE = riscv64-unknown-elf-
AS = $(CROSS_COMPILE)as
LD = $(CROSS_COMPILE)ld

all: program.elf

program.elf: add.o
	$(LD) -o $@ $^

add.o: add.s
	$(AS) -o $@ $<

clean:
	rm -f *.o *.elf
```

===QUIZ===

## In RISC-V RV32I, how many instruction formats are defined?

- [ ] 3
- [ ] 4
- [x] 6
- [ ] 8
Correct: C
Explanation: RISC-V RV32I defines six formats: R-type, I-type, S-type, B-type, U-type, and J-type. Each has a fixed layout optimized for different operand types.

## What does a label in assembly language represent?

- [ ] A CPU register number
- [x] A symbolic memory address
- [ ] An assembler directive
- [ ] A comment
Correct: B
Explanation: Labels are symbolic names for memory addresses. The assembler resolves each label to its final address in pass two, allowing instructions to reference code or data locations by name.
