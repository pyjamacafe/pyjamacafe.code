+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Structures and Unions for Hardware Access'
difficulty = 'medium'
language = 'c'
topic_weight = -17
subtopic_weight = 0
weight = 3
initial_code = '''#include <stdio.h>
#include <stdint.h>

struct pixel {
    unsigned char red;
    unsigned char green;
    unsigned char blue;
};

union word_byte {
    uint32_t word;
    uint8_t  bytes[4];
};

int main(void) {
    printf("sizeof(struct pixel) = %zu\\n", sizeof(struct pixel));
    printf("sizeof(union word_byte) = %zu\\n", sizeof(union word_byte));

    struct pixel p = {255, 0, 0};  // red pixel
    printf("RGB(%d, %d, %d)\\n", p.red, p.green, p.blue);

    union word_byte wb;
    wb.word = 0x12345678;
    printf("Bytes: %02x %02x %02x %02x\\n",
           wb.bytes[0], wb.bytes[1], wb.bytes[2], wb.bytes[3]);

    return 0;
}
'''
+++

## Problem Statement

How can C structures be used to model hardware peripherals and their memory-mapped registers? What is the difference between struct and union in terms of memory layout, and when should each be used?

## Theory and Concepts

- **Struct**: Groups multiple variables (possibly of different types) into a single compound type. Members are laid out sequentially in memory, with possible padding between members for alignment.
- **Struct padding**: The compiler may insert padding bytes between struct members to satisfy alignment requirements. On RISC-V, a `uint32_t` member must be 4-byte aligned. If a `uint8_t` is followed by a `uint32_t`, 3 padding bytes are inserted. The `__attribute__((packed))` or `__packed` qualifier suppresses padding, but unaligned access may be slower or fault on some architectures.
- **Bit fields**: Allow specifying the exact number of bits for a struct member. Useful for hardware registers where control bits are packed into a single word. Syntax: `type name : width;`. Bit fields may reduce portability due to implementation-defined layout.
- **Union**: Stores all members at the same starting address. The size of a union is the size of its largest member. Used for type punning (interpreting the same bytes as different types) and for saving space when only one variant is used at a time.
- **Struct overlay for registers**: A struct with members matching the register layout of a peripheral can be cast to the peripheral's base address, giving clean member-access syntax for hardware registers.

## Real World Application

The struct overlay technique is the standard way to access hardware peripherals in embedded C. Every CMSIS header file for ARM Cortex-M microcontrollers uses structs to define peripheral register maps. The Linux kernel uses the same pattern for device tree-mapped MMIO regions. Without this technique, accessing a UART's baud rate divisor would require error-prone manual offset calculations scattered throughout the code.

===EXPLANATION===

![Struct Layout](/images/embedded-101/c-programming/struct-pixel.jpeg)

A struct's memory layout is determined by its member declarations in order. Consider `struct pixel { unsigned char red; unsigned char green; unsigned char blue; };` — each member is 1 byte, no alignment issues, total size = 3 bytes. But if we add a `uint32_t alpha;` after the three bytes, the compiler aligns `alpha` to a 4-byte boundary, inserting 1 byte of padding after `blue` (sizeof = 8 bytes total).

For memory-mapped register access, we must ensure the struct layout exactly matches the hardware register layout. The 16550 UART has registers at offsets 0, 1, 2, 3, 4, 5, 6, 7 — all 1 byte wide with no gaps. A packed struct with `volatile uint8_t` members maps perfectly:

```c {title="16550-uart-struct.c"}
#include <stdint.h>

typedef volatile uint8_t reg8_t;

typedef struct {
    reg8_t thr;   /* 0: Transmit Holding Register (write) */
    reg8_t ier;   /* 1: Interrupt Enable Register */
    reg8_t fcr;   /* 2: FIFO Control Register (write) */
    reg8_t lcr;   /* 3: Line Control Register */
    reg8_t mcr;   /* 4: Modem Control Register */
    reg8_t lsr;   /* 5: Line Status Register */
    reg8_t msr;   /* 6: Modem Status Register */
    reg8_t scr;   /* 7: Scratch Register */
} uart_t;

#define UART ((uart_t*)0x10000000)

void uart_init(void) {
    UART->lcr = 0x83;     /* 8N1 + DLAB = 1 */
    UART->thr = 1;        /* divisor low byte */
    UART->ier = 0;        /* divisor high byte */
    UART->lcr = 0x03;     /* 8N1, DLAB = 0 */
    UART->fcr = 0x07;     /* enable FIFO, clear */
}
```

Bit fields are used when a hardware register packs multiple flags into a single word. For example, the RISC-V `mstatus` register has fields like `MIE` (bit 3), `MPIE` (bit 7), and `MPP` (bits 12:11). A bit field struct can model this:

```c
struct mstatus {
    unsigned long mie  : 1;   /* bit 3 */
    unsigned long      : 3;   /* padding */
    unsigned long mpie : 1;   /* bit 7 */
    unsigned long      : 4;   /* padding */
    unsigned long mpp  : 2;   /* bits 12:11 */
};
```

Unions are invaluable for type punning in embedded systems. For example, interpreting a 32-bit register as four 8-bit values:

```c
union reg32 {
    uint32_t word;
    uint8_t  bytes[4];
    struct {
        uint8_t b0, b1, b2, b3;
    };
};
```

References: K&R Ch. 6 (Structures); ISO C99 Standard §6.7.2.1 (Structure and union specifiers). For struct overlay in embedded: "Embedded C" by Michael Barr, Ch. 4 (Using Structures to Map Peripherals). ARM CMSIS-Core documentation for peripheral struct definitions.

===QUIZ===

## Why must a struct used for memory-mapped register access typically be declared `__packed`?
- [ ] To make the code execute faster
- [ ] To prevent the compiler from inserting padding bytes between members that would shift register offsets
- [ ] To align the struct to a 4-byte boundary
- [ ] To enable bit field operations
Correct: B
Explanation: The compiler may insert padding bytes between struct members to satisfy alignment requirements (e.g., 3 bytes between a uint8_t and a uint32_t). For hardware register overlays, the struct layout must exactly match the register offsets — any padding would misalign all subsequent register accesses. Packed structs suppress this padding.

## What is the size of `union { uint32_t w; uint8_t b[4]; uint16_t h[2]; }`?
- [ ] 10
- [ ] 7
- [ ] 4
- [ ] 8
Correct: C
Explanation: The size of a union is the size of its largest member. Here, `uint32_t` is 4 bytes, `uint8_t[4]` is 4 bytes, and `uint16_t[2]` is 4 bytes. All members are the same size (4 bytes), so the union occupies 4 bytes total.
