+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Text to Binary: How Assembly Becomes Machine Code'
difficulty = 'easy'
language = 'c'
topic_weight = -19
subtopic_weight = 0
weight = 1
initial_code = '''.text
.globl _start
_start:
    addi a0, zero, 5
    addi a1, zero, 3
    add  a2, a0, a1
    addi a7, zero, 93
    ecall'''
+++

## Problem Statement

How does text written in assembly language become binary instructions the CPU can execute? Walk through each step, from the assembly source file to the final binary instruction word stored in memory.

## Theory and Concepts

Assembly language is a human-readable representation of machine code. Each mnemonic (like `add` or `addi`) corresponds to a specific opcode that the CPU's decoder hardware understands. The assembler translates each assembly line into a binary instruction word by computing the opcode, register numbers, and immediate values according to the instruction format.

RISC-V RV32I defines six instruction formats:
- **R-type** — register operands only (e.g., `add rd, rs1, rs2`)
- **I-type** — register + immediate (e.g., `addi rd, rs1, imm`)
- **S-type** — store to memory
- **B-type** — conditional branches
- **U-type** — upper immediate (LUI, AUIPC)
- **J-type** — unconditional jumps

For `add a2, a0, a1` (R-type): opcode[6:0]=`0110011`, funct3[14:12]=`000`, funct7[31:25]=`0000000`, rd=x12=`01100`, rs1=x10=`01010`, rs2=x11=`01011`. The resulting 32-bit word is `00000000101101010000011000110011` = `0x00B50633`.

## Real World Application

Every assembler performs text-to-binary translation. Embedded developers working on bootloaders or firmware often inspect raw hex dumps to verify instruction encoding. Tools like `objdump -d` disassemble binaries back to assembly, forming the round-trip that developers use to confirm their code compiles correctly. When a CPU executes unexpected instructions, examining the raw machine code is often the fastest debugging path.

===EXPLANATION===

![Assembly Debug](/images/embedded-101/assembly/asm.jpeg)

![GDB Debug](/images/embedded-101/assembly/gdb.png)

![Debug](/images/embedded-101/assembly/debug.png)

The translation from assembly to machine code happens in the assembler's first pass: it scans each line, strips comments, and parses the mnemonic and operands. In pass two, it assigns addresses to labels and emits the binary instruction words. Each instruction format defines exactly which bits encode the opcode, register operands, immediate values, and function selectors. The assembler computes each field and packs them into a 32-bit word.

Consider `addi a0, zero, 5` at `_start`. The assembler recognizes `addi` as an I-type instruction with opcode `0x13`. It encodes `rd=a0` (x10 = `01010`), `rs1=zero` (x0 = `00000`), and the immediate `5` (`000000000101`). The resulting word is `0x00500513`. The CPU's instruction fetch unit reads this word from memory; the decoder routes the opcode and control signals to the ALU to perform `x10 = x0 + 5`. Every instruction goes through this same encode-fetch-decode-execute cycle.

This process repeats for every instruction in the program. The output is a flat binary — a sequence of 32-bit words — that the CPU can execute directly. Understanding this encoding allows developers to patch binaries at the machine-code level when source code is unavailable, and is essential for anyone writing instruction-set simulators, disassemblers, or low-level debug tools.

===CODE===

Full compilable example with annotated binary encodings.

```asm {title="add.s"}
.text
.globl _start
_start:
    addi a0, zero, 5    # a0 = 5;  I-type: 0x00500513
    addi a1, zero, 3    # a1 = 3;  I-type: 0x00300593
    add  a2, a0, a1     # a2 = a0 + a1;  R-type: 0x00B50633
    addi a7, zero, 93   # a7 = 93 (exit syscall);  I-type: 0x05D00793
    ecall               # Environment call;  0x00000073
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

## Which field in an R-type RISC-V instruction identifies the operation category?

- [ ] rs1
- [ ] rd
- [x] opcode
- [ ] funct3
Correct: C
Explanation: The opcode field (bits 6:0) identifies the instruction category. For R-type arithmetic instructions, the opcode is 0x33.

## What is the binary encoding of `addi x5, x6, 31`?

- [ ] 0x01F28313
- [x] 0x01F30293
- [ ] 0x01F00313
- [ ] 0x01F28293
Correct: B
Explanation: `addi x5, x6, 31`: I-type with opcode=0010011, rd=x5=00101, funct3=000, rs1=x6=00110, imm=31=000000011111. Packs to 0x01F30293.
