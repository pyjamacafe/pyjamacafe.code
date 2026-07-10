+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'QEMU UART Hello World'
difficulty = 'hard'
language = 'c'
topic_weight = -18
subtopic_weight = 0
weight = 5
initial_code = '''void uart_putc(char c) {
    volatile uint8_t *thr = (uint8_t*)0x10000000;
    volatile uint8_t *lsr = (uint8_t*)0x10000005;
    while (!(*lsr & (1 << 5)));
    *thr = c;
}

void uart_puts(const char *s) {
    while (*s) uart_putc(*s++);
}

int main(void) {
    uart_puts("Hello, World!\\n");
    while (1);
    return 0;
}'''
+++

## Problem Statement

How do you print "Hello, World!" on a UART from scratch — writing your own boot code, linker script, and UART driver without any operating system or standard library?

## Theory and Concepts

**End-to-end embedded project structure:** A complete bare-metal RISC-V project requires four components: a startup file (start.S), the main application code (main.c), a linker script (link.ld), and a build system (Makefile).

**16550 UART programming model:** The 16550-compatible UART on QEMU virt is at 0x10000000. Key registers:
- THR (offset 0): write to transmit a character
- LSR (offset 5): bit 5 (THR empty) indicates transmitter ready

**Transmit flow:** Initialize the UART (set baud rate, frame format) → poll LSR until THR empty → write character to THR → repeat for the full string.

## Real World Application

This is the embedded systems equivalent of "Hello, World!" — your first milestone when bringing up new hardware. Every embedded engineer writes a UART driver as one of the first software components on a new board. It serves as a basic sanity check that the CPU, memory, clock, and at least one peripheral are working correctly. Getting characters to appear on a terminal confirms the entire toolchain, boot sequence, and hardware are functional.

===EXPLANATION===

![Compilation](/images/embedded-101/embedded-systems/compilation.jpeg)

![UART CSR](/images/embedded-101/embedded-systems/uart_csr.jpeg)

Building from scratch means we control every byte that goes into the binary. The startup code (start.S) is the first thing the CPU executes. It initializes the stack pointer by loading the `_STACK_TOP_` symbol defined in the linker script, then jumps to `main()`. Without the startup code, the C environment is not initialized — sp is undefined, function calls will fail, and global variable initialization hasn't happened.

The linker script defines the memory layout: where code lives (starting at 0x80000000 for QEMU virt), where the stack is placed (at the end of RAM), and the total memory size. Every symbol used in start.S (`_STACK_TOP_`) must be defined here. The Makefile ties everything together with the riscv64-unknown-elf toolchain, using `-nostdlib -nostartfiles` to exclude the hosted C runtime and `-T link.ld` for our custom linker script.

The UART driver polls the Line Status Register's THR empty bit before writing each character. The 16550 has an internal transmit shift register — if we write while it's busy, the character may be lost. The polling loop `while (!(*lsr & (1 << 5)));` ensures we only write when the transmitter is ready. After all characters are sent, the program enters an infinite loop. On QEMU, running with `-nographic` redirects the UART output to the terminal, so "Hello, World!" appears on your console.

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
typedef unsigned char uint8_t;

#define UART_THR  ((volatile uint8_t*)0x10000000)
#define UART_LSR  ((volatile uint8_t*)0x10000005)
#define LSR_THRE  (1 << 5)

void uart_init(void) {
    volatile uint8_t *lcr = (volatile uint8_t*)0x10000003;
    volatile uint8_t *dll = (volatile uint8_t*)0x10000000;
    volatile uint8_t *dlm = (volatile uint8_t*)0x10000001;

    *lcr = (1 << 7);
    *dll = 1;
    *dlm = 0;

    *lcr = (3 << 0);
}

void uart_putc(char c) {
    while (!(*UART_LSR & LSR_THRE));
    *UART_THR = c;
}

void uart_puts(const char *s) {
    while (*s) {
        uart_putc(*s++);
    }
}

int main(void) {
    uart_init();
    uart_puts("Hello, World!\n");
    while (1);
    return 0;
}
```

```makefile {title="Makefile"}
CC = riscv64-unknown-elf-gcc
CFLAGS = -march=rv64gc -mabi=lp64d -O2 -Wall -nostdlib -nostartfiles -ffreestanding
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

## What does the THR empty bit (bit 5 of LSR) indicate?

- [ ] The receive buffer has data
- [x] The transmit holding register is ready to accept a new character
- [ ] The UART is powered off
- [ ] A framing error has occurred

Correct: B
Explanation: Bit 5 of the Line Status Register is set when the Transmit Holding Register (THR) is empty and ready to accept a new byte. The driver must poll this bit before each write to avoid overwriting a character that hasn't been shifted out yet.

## What is the purpose of `-nostdlib -nostartfiles` in the Makefile flags?

- [ ] To enable optimization for the target architecture
- [ ] To link against the standard C library
- [x] To exclude the standard C runtime and startup files so we provide our own
- [ ] To disable all compiler warnings

Correct: C
Explanation: These flags tell the linker not to include the standard C runtime initialization code (crt0) and standard libraries. In bare-metal programming, we provide our own startup code (start.S), linker script (link.ld), and do not depend on any operating system services.
