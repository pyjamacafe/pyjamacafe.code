+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Address Map and Struct Mapping for Memory-Mapped I/O'
difficulty = 'hard'
language = 'c'
topic_weight = -18
subtopic_weight = 0
weight = 4
initial_code = '''typedef struct {
    volatile uint8_t thr;
    volatile uint8_t ier;
    volatile uint8_t fcr;
    volatile uint8_t lcr;
    volatile uint8_t lsr;
} uart_t;

#define UART ((uart_t*)0x10000000)'''
+++

## Problem Statement

How do you access hardware peripherals from C code? How can C struct definitions map directly onto memory-mapped device registers?

## Theory and Concepts

**Memory-mapped I/O (MMIO):** Peripherals are accessed by reading and writing specific memory addresses. Each register of a peripheral is assigned an offset from a base address. In the QEMU virt machine, the 16550 UART is at base address 0x10000000.

**The volatile keyword:** When accessing hardware registers, the compiler must not optimize away reads or writes. The `volatile` qualifier tells the compiler that a variable may change outside the normal program flow (e.g., by hardware), preventing unwanted optimizations.

**Struct overlay technique:** A C struct whose members correspond to the register layout of a peripheral can be cast to the peripheral's base address. The struct layout rules and packing must match the hardware register ordering.

**Bit manipulation:** Peripheral registers often control individual features via single bits. Bitfields and bitwise operations (AND, OR, shift) are used to set, clear, and test specific bits.

## Real World Application

Every embedded C codebase that interacts with hardware uses MMIO struct mapping. The CMSIS standard for ARM Cortex-M defines structs for every vendor's peripherals. Linux kernel drivers use similar struct overlays for device tree-mapped MMIO regions. Understanding this technique lets you write clean, readable driver code instead of scattering magic-number pointer dereferences throughout your application.

===EXPLANATION===

![Address Map](/images/embedded-101/embedded-systems/addr_map.png)

![I/O Map Peripheral](/images/embedded-101/embedded-systems/io_map_peripheral.png)

![UART Connection](/images/embedded-101/embedded-systems/uart_connection.jpeg)

The struct overlay technique works because memory-mapped registers appear at fixed addresses. By defining a struct with members at the same offsets and sizes as the hardware registers, we can create a pointer to the struct at the peripheral's base address and access registers as struct members. For the 16550 UART, the Transmit Holding Register (THR) is at offset 0, the Interrupt Enable Register (IER) at offset 1, the FIFO Control Register (FCR) at offset 2, the Line Control Register (LCR) at offset 3, and the Line Status Register (LSR) at offset 5. A packed struct with `volatile uint8_t` members at these offsets maps perfectly.

The `volatile` qualifier is essential. Consider `UART->thr = 'A';` — without volatile, the compiler might cache the struct in registers and never actually write to memory. With volatile, each access generates an explicit load or store instruction. This is critical for read-modify-write operations on registers like the Line Control Register (LCR), where we set the Divisor Latch Access Bit (DLAB, bit 7) before writing the baud rate divisors.

Bit manipulation is closely related: hardware registers encode multiple flags in a single byte or word. The Line Status Register (LSR) has bit 5 (THR empty) indicating the transmitter is ready for more data. The classic UART transmit loop polls this bit: `while (!(UART->lsr & (1 << 5)));`. Combined with struct mapping, this produces highly readable driver code that directly reflects the hardware documentation.

===CODE===

```c {title="uart.h"}
#ifndef UART_H
#define UART_H

#include <stdint.h>

typedef struct {
    volatile uint8_t thr;  /* Transmit Holding Register (write, offset 0) */
    volatile uint8_t ier;  /* Interrupt Enable Register (offset 1) */
    volatile uint8_t fcr;  /* FIFO Control Register (write, offset 2) */
    volatile uint8_t lcr;  /* Line Control Register (offset 3) */
    volatile uint8_t mcr;  /* Modem Control Register (offset 4) */
    volatile uint8_t lsr;  /* Line Status Register (read, offset 5) */
    volatile uint8_t msr;  /* Modem Status Register (read, offset 6) */
} uart_t;

#define UART_BASE ((uart_t*)0x10000000)

/* Line Control Register bits */
#define LCR_DLAB  (1 << 7)
#define LCR_8N1   (3 << 0)

/* Line Status Register bits */
#define LSR_THR_EMPTY (1 << 5)

void uart_putc(char c);
void uart_init(void);

#endif
```

```c {title="uart.c"}
#include "uart.h"

void uart_init(void) {
    uart_t *uart = UART_BASE;

    uart->lcr = LCR_DLAB;
    uart->thr = 1;
    uart->ier = 0;
    uart->lcr = LCR_8N1;

    uart->fcr = 0x07;
}

void uart_putc(char c) {
    uart_t *uart = UART_BASE;

    while (!(uart->lsr & LSR_THR_EMPTY));

    uart->thr = c;
}
```

```asm {title="start.S"}
.section .init
.globl _start
_start:
    la sp, _STACK_TOP_
    jal main
loop:
    j loop
```

```makefile {title="Makefile"}
CC = riscv64-unknown-elf-gcc
CFLAGS = -march=rv64gc -mabi=lp64d -O2 -Wall -nostdlib -nostartfiles
LDFLAGS = -T link.ld

all: program.elf

program.elf: start.o uart.o
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

start.o: start.S
	$(CC) $(CFLAGS) -c -o $@ $<

uart.o: uart.c uart.h
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

## Why is the `volatile` keyword necessary when accessing memory-mapped registers?

- [ ] It makes register access faster
- [x] It prevents the compiler from optimizing away repeated reads or writes that have side effects
- [ ] It automatically aligns struct members to hardware register boundaries
- [ ] It enables bitfield operations on registers

Correct: B
Explanation: Hardware register accesses have side effects (e.g., reading a status register clears bits, writing a transmit register sends data). Volatile forces the compiler to generate a load/store for every access rather than optimizing them away.

## What is the base address of the 16550 UART on the QEMU RISC-V virt machine?

- [ ] 0x80000000
- [ ] 0x80200000
- [x] 0x10000000
- [ ] 0x10001000

Correct: C
Explanation: The QEMU virt machine maps the 16550 UART at physical address 0x10000000. This is defined by the QEMU hardware model and documented in the virt machine's memory map.
