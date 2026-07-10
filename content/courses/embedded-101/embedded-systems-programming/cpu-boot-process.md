+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'CPU Boot Process'
difficulty = 'medium'
language = 'c'
topic_weight = -18
subtopic_weight = 0
weight = 2
initial_code = '''.section .init
.globl _start
_start:
    la sp, _STACK_TOP_
    jal main
loop:
    j loop'''
+++

## Problem Statement

What happens inside a CPU from the moment power is applied until the first instruction of your C program executes? How does the CPU know where to find the first instruction?

## Theory and Concepts

When power is applied to a CPU, it begins execution from a predefined memory address called the **reset vector**. For RISC-V, the reset vector address is implementation-defined and typically set by the hardware platform. In the QEMU virt machine, the CPU starts executing at 0x80000000 by default, which is where we place our code.

**Reset sequence:**
1. Power-on reset (POR) initializes all registers to known values. The program counter (PC) is loaded with the reset vector address.
2. The CPU fetches the first instruction from the reset vector address.
3. The first few instructions typically set up the stack pointer (sp), initialize .bss, copy .data from flash to RAM, and call main().

**RISC-V vs ARM-M boot:** On ARM Cortex-M, the reset vector contains the initial stack pointer value and the reset handler address. RISC-V uses a simpler model — execution starts directly at the reset vector address, and initial sp must be set in software.

**Bootloaders:** Larger systems often use a two-stage boot process: a small first-stage bootloader initializes DRAM and loads a second-stage bootloader or the main firmware from non-volatile storage.

## Real World Application

When you press the reset button on an embedded device, the CPU must transition from an undefined state to running your application correctly. Every embedded engineer encounters boot issues: the device doesn't start, crashes immediately, or behaves erratically. Understanding the boot sequence helps debug these issues by knowing exactly where to set breakpoints (reset vector, start of main()) and what state to expect.

===EXPLANATION===

The boot process bridges the gap between hardware and software. On the QEMU virt machine (RISC-V), the hardware loads the kernel image (your .elf file) into flash/ROM at address 0x80000000. When QEMU starts the CPU, the program counter is set to 0x80000000 and execution begins. The first code to run is usually in a file called start.S or crt0.S, which is written entirely in assembly because the C runtime environment hasn't been set up yet.

The startup code performs several critical tasks before main() can be called. First, the stack pointer must be initialized to point to a valid RAM region. Without a valid stack, function calls and local variables will cause crashes. The `la sp, _STACK_TOP_` pseudo-instruction loads the address of the stack top symbol (defined in the linker script) into sp. The stack typically grows downward, so `_STACK_TOP_` points to the highest address of the stack region.

Second, the startup code may initialize the BSS section (zero-initialized global variables) and copy the DATA section from its load address (in flash) to its runtime address (in RAM). In simpler embedded systems that run directly from RAM (like our QEMU example), these steps are minimal. Finally, `jal main` jumps to the C entry point, passing no arguments. From this point on, the application runs normally.

===CODE===

```asm {title="start.S"}
.section .init
.globl _start
_start:
    la sp, _STACK_TOP_
    jal main
loop:
    j loop
```

```c {title="main.c"}
#define GPIO_BASE 0x10000000
#define GPIO_OUT  *(volatile int*)(GPIO_BASE + 0x00)

int main(void) {
    while (1) {
        GPIO_OUT = 0x01;
        for (volatile int i = 0; i < 1000000; i++);
        GPIO_OUT = 0x00;
        for (volatile int i = 0; i < 1000000; i++);
    }
    return 0;
}
```

```makefile {title="Makefile"}
CC = riscv64-unknown-elf-gcc
CFLAGS = -march=rv64gc -mabi=lp64d -O2 -Wall -nostdlib -nostartfiles
LDFLAGS = -T link.ld

all: program.elf

program.elf: start.o main.o
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

start.o: start.S
	$(CC) $(CFLAGS) -c -o $@ $<

main.o: main.c
	$(CC) $(CFLAGS) -c -o $@ $<

clean:
	rm -f *.o program.elf

run: program.elf
	qemu-system-riscv64 -nographic -machine virt -kernel program.elf
```

```ld {title="link.ld"}
OUTPUT_ARCH(riscv)

MEMORY
{
    RAM (rwx) : ORIGIN = 0x80000000, LENGTH = 64M
}

SECTIONS
{
    . = ORIGIN(RAM);

    _STACK_TOP_ = ORIGIN(RAM) + LENGTH(RAM);

    .init : {
        *(.init)
    } > RAM

    .text : {
        *(.text)
    } > RAM

    .rodata : {
        *(.rodata)
    } > RAM

    .data : {
        *(.data)
    } > RAM

    .bss : {
        *(.bss)
    } > RAM
}
```

===QUIZ===

## What does the CPU do immediately after a power-on reset on a RISC-V system?

- [ ] It initializes the stack pointer from a predefined location
- [ ] It calls main()
- [x] It loads the program counter with the reset vector address and fetches the first instruction
- [ ] It copies .data from flash to RAM

Correct: C
Explanation: The CPU hardware loads the PC with the reset vector address and begins fetching instructions. Stack initialization and .data copying are done by software in the startup code, not by hardware.

## In the startup code (start.S), why must the stack pointer be initialized before calling main()?

- [ ] main() stores all its local variables in registers
- [x] C functions require a valid stack for function calls, local variables, and saving return addresses
- [ ] The CPU will fault if sp is not set within the first 10 instructions
- [ ] The linker script requires it

Correct: B
Explanation: C relies on the stack for function call frames, local variable storage, and saving return addresses (ra). Without a valid sp, the first function call from start.S to main would corrupt memory or crash.
