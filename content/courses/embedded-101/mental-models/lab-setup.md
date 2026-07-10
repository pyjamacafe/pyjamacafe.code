+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Lab Setup: RISC-V Cross-Compilation Toolchain'
difficulty = 'easy'
language = 'c'
topic_weight = -20
subtopic_weight = 0
weight = 5
initial_code = '''#include <stdio.h>

int main(void) {
    printf("Hello, RISC-V World!\n");
    return 0;
}
'''
+++

## Problem Statement

Describe the complete toolchain needed to compile and run code for a RISC-V QEMU machine. Starting from a C source file, trace each step: preprocessing, compilation, assembly, linking, and execution on an emulated RISC-V target. What role does each tool in the chain play?

## Theory and Concepts

- **Cross-compilation**: Building executable code for a target machine (RISC-V) on a different host machine (x86-64). The compiler, assembler, and linker are all built to target RISC-V while running on the host.
- **GCC (GNU Compiler Collection)**: Performs compilation (C → assembly). For RISC-V: `riscv64-unknown-elf-gcc`. Key flags: `-march=rv32im` (selects the ISA with extensions), `-mabi=ilp32` (integer calling convention for 32-bit), `-O2` (optimization level).
- **Assembler (GAS, GNU Assembler)**: Converts assembly to relocatable machine code (object file, `.o`). Usually invoked transparently by GCC.
- **Linker (GNU ld)**: Combines multiple object files and libraries into a single executable. For embedded targets, the linker uses a **linker script** (`.ld` file) that defines the memory layout: where `.text` (code), `.data` (initialized data), `.bss` (zero-initialized data), and the stack reside in the target's address space.
- **QEMU (Quick EMUlator)**: Emulates the RISC-V CPU and peripherals in software. Translates RISC-V instructions to host instructions via dynamic binary translation (TCG — Tiny Code Generator). Allows running and debugging RISC-V binaries without physical hardware.
- **GDB (GNU Debugger)**: Debugs the RISC-V program remotely. QEMU provides a GDB stub (`-gdb tcp::1234`). The cross-GDB (`riscv64-unknown-elf-gdb`) connects to QEMU, allowing source-level debugging, breakpoints, single-stepping, and register/memory inspection.
- **Build automation (Make)**: `Makefile` orchestrates the toolchain invocation. Typical rules: `all` (build the binary), `run` (launch in QEMU), `debug` (launch QEMU with GDB stub), `clean` (remove build artifacts).

## Real World Application

This exact toolchain setup is used by SiFive, Microchip (PolarFire SoC), and the entire RISC-V ecosystem for prototyping before silicon arrives. Boot ROM developers for the Texas Instruments AM64x (which has RISC-V coprocessors) use identical cross-compilation flows. QEMU emulation is particularly valuable for embedded CI pipelines: every commit can be tested against an emulated RISC-V target in a GitHub Actions runner, catching build breaks and runtime bugs before hardware testing.

===CODE===

```makefile {title="Makefile"}
CROSS=riscv64-unknown-elf-
CC=$(CROSS)gcc
LD=$(CROSS)ld
CFLAGS=-march=rv32im -mabi=ilp32 -nostdlib -ffreestanding -O2
LDFLAGS=-T linker.ld -nostartfiles

all: firmware.elf

firmware.elf: main.c linker.ld
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ main.c

run: firmware.elf
	qemu-system-riscv32 -nographic -machine virt -bios none -kernel $<

debug: firmware.elf
	qemu-system-riscv32 -nographic -machine virt -bios none -kernel $< \
		-gdb tcp::1234 -S

clean:
	rm -f firmware.elf
```

```c {title="main.c"}
#include <stdio.h>

int main(void) {
    printf("Hello, RISC-V World!\n");
    return 0;
}
```

```ld {title="linker.ld"}
OUTPUT_ARCH(riscv)
ENTRY(_start)

MEMORY
{
    RAM (rwx) : ORIGIN = 0x80000000, LENGTH = 128M
}

SECTIONS
{
    .text : {
        *(.text._start)
        *(.text*)
    } > RAM

    .rodata : { *(.rodata*) } > RAM
    .data : { *(.data*) } > RAM
    .bss : { *(.bss*) } > RAM

    . = ALIGN(16);
    . += 4096;
    _sp = .;
}
```
===EXPLANATION===

![Terminal](/images/embedded-101/mental-models/terminal-1.png)

![QEMU GDB Connection](/images/embedded-101/mental-models/qemu-gdb-connection.jpeg)

![Makefile](/images/embedded-101/mental-models/makefile.png)

![Linker Script Annotated](/images/embedded-101/mental-models/linker-script-annotated.png)

The cross-compilation toolchain is the essential bridge between your development machine and the embedded target. On a desktop, you compile and run on the same x86-64 machine: the compiler produces x86-64 machine code, and the OS loads and executes it directly. In the embedded world, the target has a different architecture (RISC-V, ARM Cortex-M, AVR) and typically no OS — the compiler must produce raw machine code that runs directly on the metal, and you must emulate or load it onto the target to test. The toolchain (GCC, linker, assembler) is itself a portable piece of software: you build it once to produce `riscv64-unknown-elf-gcc`, which runs on your x86-64 host but emits RISC-V machine code. The "unknown-elf" triplet means target OS is unknown (bare-metal) and the output format is ELF (Executable and Linkable Format). QEMU provides the emulated hardware that interprets the RISC-V instructions.

The intuition is that you are an architect designing a building in New York but constructing it in Tokyo. Your blueprints (the C source code) are in the same language, but you need a translator (the cross-compiler) who speaks the Tokyo dialect (RISC-V machine code). The linker script is the plot of land with its property boundaries (memory regions: this section of the lot is for the foundation at address 0x80000000, that corner is for the garden at 0x80010000). QEMU is a virtual Tokyo: a detailed scale model of the building site where you can walk through the rooms, check the wiring, and adjust the plumbing before you pour a single slab of real concrete in Tokyo. The Makefile is your foreman: "When I say `make`, first mix the concrete (compile), then pour the foundation (link), then inspect the model (run in QEMU). When I say `make debug`, set up the scaffolding (GDB stub) so I can stand inside the virtual building with my blueprint (source code) and measure every beam."

References: GCC documentation: "GCC Cross-Compiler" (OSDev wiki), QEMU documentation: "System Emulation for RISC-V" (qemu.readthedocs.io). For bare-metal RISC-V toolchain setup: SiFive Freedom Studio documentation. The standard linker script for RISC-V "virt" machine is documented in the QEMU source (`hw/riscv/virt.c`). For understanding the ELF format: "Linkers and Loaders" by John R. Levine (Morgan Kaufmann, 1999).

===QUIZ===

## What is the primary purpose of the linker script (`.ld` file) in a bare-metal RISC-V project?
- [ ] To specify which compiler optimization flags to use
- [ ] To define the target's memory layout — which sections of the binary go to which memory addresses
- [ ] To configure the QEMU emulated peripherals
- [ ] To specify the C standard library version
Correct: B
Explanation: The linker script tells the linker how to map the program's sections (.text, .data, .bss, .rodata, stack) into the target's physical address space. For example, on the QEMU virt machine, RAM starts at 0x80000000, so the linker script places .text there. Without a linker script, the linker would use its default (host-native) layout, producing a binary that cannot execute on the RISC-V target.

## In the provided Makefile, what does the `run` target do?
- [ ] It compiles the program and loads it onto a physical RISC-V board
- [ ] It launches QEMU with the compiled binary as the kernel, emulating a RISC-V machine
- [ ] It cleans all build artifacts
- [ ] It connects GDB to a running QEMU instance
Correct: B
Explanation: The `run` target invokes `qemu-system-riscv32` with `-machine virt` (emulated RISC-V virtual machine), `-nographic` (serial console on stdio), `-bios none` (no boot loader), and `-kernel firmware.elf` (loads the compiled binary as the kernel image). The binary runs immediately, and any printf output appears in the terminal.
