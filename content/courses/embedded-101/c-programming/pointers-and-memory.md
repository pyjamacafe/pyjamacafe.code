+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Pointers and Memory Access'
difficulty = 'medium'
language = 'c'
topic_weight = -17
subtopic_weight = 0
weight = 2
initial_code = '''#include <stdio.h>
#include <stdint.h>

int main(void) {
    int a = 42;
    int *ptr = &a;

    printf("Value of a: %d\\n", a);
    printf("Address of a: %p\\n", (void*)&a);
    printf("Pointer ptr holds: %p\\n", (void*)ptr);
    printf("Dereference ptr: %d\\n", *ptr);

    // Pointer arithmetic
    printf("ptr + 0: %p\\n", (void*)(ptr + 0));
    printf("ptr + 1: %p\\n", (void*)(ptr + 1));
    printf("ptr + 2: %p\\n", (void*)(ptr + 2));

    return 0;
}
'''
+++

## Problem Statement

Why are pointers essential in embedded systems programming? How do they map to hardware addresses? Explain how a pointer variable can point to data memory, code memory, or memory-mapped peripheral registers.

## Theory and Concepts

- **Pointer definition**: A pointer is a variable that holds a memory address. The type of the pointer determines how the data at that address is interpreted and how many bytes are accessed on dereference.
- **Address-of operator (&)**: Returns the memory address of a variable. `int *p = &a;` stores the address of `a` in `p`.
- **Dereference operator (*)**: Accesses the value at the address held by a pointer. `int x = *p;` reads the value at address `p`. On RISC-V, this compiles to `lw` (load word) for a 4-byte read.
- **Pointer arithmetic**: Adding N to a pointer advances it by N × sizeof(type) bytes. `int *p; p + 1` advances by 4 bytes (sizeof(int)). This is why pointer arithmetic is type-aware.
- **Pointer to volatile**: The `volatile` qualifier tells the compiler that the value at a pointer may change outside the normal program flow (e.g., by hardware). Every memory-mapped peripheral register should be accessed via a `volatile`-qualified pointer to prevent the compiler from optimizing away reads/writes.
- **Function pointers**: Pointers that store the address of executable code. Declared as `return_type (*name)(param_types)`. Dereferencing calls the function. Used for callback mechanisms, jump tables, and interrupt vector tables.
- **NULL pointer safety**: A pointer with value `0` (or `NULL`) points to nothing. Dereferencing a NULL pointer causes undefined behavior (typically a crash). Always check `if (ptr != NULL)` before dereferencing in production code.

## Real World Application

Pointers are the primary mechanism for accessing hardware in embedded systems. Every memory-mapped peripheral register is accessed through a pointer: `*(volatile uint32_t*)0x40020014 = 0x01;` sets a GPIO pin high on an STM32 microcontroller. Function pointers are used for interrupt service routines (ISRs) — the interrupt vector table is an array of function pointers. RTOS schedulers use function pointers for task entry points. Without pointers, embedded C would be unable to interact with hardware at all.

===EXPLANATION===

![Pointer Example](/images/embedded-101/c-programming/eg-pointer.jpeg)

A pointer is a variable that stores a memory address. The pointer itself occupies memory (typically 4 bytes on RV32, 8 bytes on RV64), and the value it holds is the address of another location. This indirection is what makes pointers powerful: a single pointer variable can access different memory locations at different times, and those locations can be data, code, or peripheral registers.

Pointer arithmetic is scoped to the pointed-to type. For an `int *` on RV32, `ptr + 1` adds 4 to the address (because sizeof(int) = 4). For a `char *`, `ptr + 1` adds 1. This behavior is defined by the C standard and is fundamental to array access — `arr[i]` is equivalent to `*(arr + i)`. For a `uint32_t *` pointing to a memory-mapped register at address 0x10000000, adding 1 gives address 0x10000004 — the next register in the peripheral's address space.

The `volatile` keyword is critical when accessing hardware registers. Consider:

```c
volatile uint32_t *status_reg = (uint32_t*)0x10000004;
while (!(*status_reg & (1 << 5)));  // wait for bit 5
```

Without `volatile`, the compiler may optimize the loop to a single read — it sees `*status_reg` doesn't change in the loop body, so it reads once and caches the value. With `volatile`, the compiler generates a load instruction for every access, ensuring the CPU reads the register on each iteration.

```c {title="memory-mapped-register-access.c"}
#include <stdint.h>

#define UART_BASE ((volatile uint32_t*)0x10000000)
#define UART_THR  (UART_BASE[0])  /* Transmit Holding Register */
#define UART_LSR  (UART_BASE[5])  /* Line Status Register */
#define LSR_THRE  (1 << 5)        /* THR Empty bit */

void uart_putc(char c) {
    while (!(UART_LSR & LSR_THRE));
    UART_THR = c;
}
```

Function pointers enable dynamic dispatch without the overhead of a function call table lookup. On embedded systems, they are used for interrupt handlers (the vector table is literally an array of function pointers), state machines, and plugin architectures.

References: K&R, "The C Programming Language" Ch. 5 (Pointers and Arrays); "Expert C Programming: Deep C Secrets" by Peter van der Linden, Ch. 4 (Pointers). For volatile: Dan Saks, "Volatile as a Promise" (Embedded Systems Programming, 2001).

===QUIZ===

## What does `*(volatile uint32_t*)0x40020014 = 0x01;` do on an ARM Cortex-M4?
- [ ] Declares a constant pointer to an integer
- [ ] Writes the value 1 to the memory-mapped register at address 0x40020014, with volatile access to prevent optimization
- [ ] Reads the value at address 0x40020014 and discards it
- [ ] Creates a new variable at address 0x40020014
Correct: B
Explanation: This expression casts the integer 0x40020014 to a volatile uint32_t pointer, then dereferences it to write 0x01. The volatile qualifier ensures the compiler generates an actual store instruction rather than optimizing it away.

## On a 32-bit system, if `int *p = (int*)0x1000;`, what is the value of `p + 3`?
- [ ] 0x1003
- [ ] 0x100C
- [ ] 0x1030
- [ ] 0x1100
Correct: B
Explanation: Pointer arithmetic is scaled by the size of the pointed-to type. sizeof(int) = 4 bytes, so p + 3 advances by 3 × 4 = 12 bytes = 0xC. The resulting address is 0x1000 + 0xC = 0x100C.
