+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'C Essentials: Types, Variables, and Compilation'
difficulty = 'medium'
language = 'c'
topic_weight = -17
subtopic_weight = 0
weight = 1
initial_code = '''#include <stdio.h>
#include <stdint.h>

int main(void) {
    printf("Size of char: %zu byte(s)\\n", sizeof(char));
    printf("Size of short: %zu byte(s)\\n", sizeof(short));
    printf("Size of int: %zu byte(s)\\n", sizeof(int));
    printf("Size of long: %zu byte(s)\\n", sizeof(long));
    printf("Size of long long: %zu byte(s)\\n", sizeof(long long));
    printf("Size of float: %zu byte(s)\\n", sizeof(float));
    printf("Size of double: %zu byte(s)\\n", sizeof(double));
    return 0;
}
'''
+++

## Problem Statement

How does C code get compiled into assembly? What is the relationship between C constructs and the underlying machine code? Trace how `int x = 5; int y = x + 3;` becomes RISC-V load, add, and store instructions.

## Theory and Concepts

- **C as a "portable assembler"**: C was designed to map cleanly to machine concepts — variables map to memory locations and registers, operators map to ALU operations, control flow maps to branch instructions. This is why C is the dominant language for systems and embedded programming.
- **Compilation process**: C source → Preprocessor (handles `#include`, `#define`) → Compiler (C → assembly) → Assembler (assembly → object file) → Linker (combines object files → executable). The `-S` flag to GCC generates assembly output.
- **Data types and memory layout**:
  - `char`: 1 byte (8 bits), typically signed on RISC-V
  - `short`: 2 bytes (16 bits)
  - `int`: 4 bytes (32 bits) on RV32
  - `long`: 4 bytes on RV32, 8 bytes on RV64
  - `float`: 4 bytes (IEEE 754 single precision)
  - `double`: 8 bytes (IEEE 754 double precision)
- **sizeof operator**: A compile-time operator that returns the size (in bytes) of a type or expression. The result is of type `size_t` (usually `unsigned int`). Useful for writing portable code that adapts to different platforms.
- **Signed vs unsigned**: The MSB (most significant bit) acts as the sign bit for signed types. Unsigned types use all bits for magnitude, giving a larger positive range.

## Real World Application

Understanding the C compilation model is essential for debugging, optimization, and writing embedded code. When you declare `uint32_t reg_val = *(volatile uint32_t*)0x40020014;`, knowing that this compiles to a single `lw` instruction helps you reason about timing and atomicity. The `sizeof` operator is critical when writing portable code — a `long` on a desktop Linux x86-64 is 8 bytes, but on an RV32 embedded target it is 4 bytes. Using `sizeof` instead of hardcoded sizes prevents subtle bugs when porting code between platforms.

===EXPLANATION===

![C Data Types](/images/embedded-101/c-programming/c-data-types.jpeg)

C provides a small set of fundamental data types that correspond directly to the storage capabilities of the underlying machine. The `char` type is exactly 1 byte — the smallest addressable unit on virtually all modern architectures. The `int` type is designed to be the "natural" word size of the target machine: 32 bits on a 32-bit CPU, 64 bits on a 64-bit CPU. This correspondence is not accidental — Dennis Ritchie designed C to be a "high-level assembler" that lets programmers express machine-level operations in a portable syntax.

The compilation pipeline transforms C source through several stages. The preprocessor handles text substitution (`#include`, `#define`), the compiler translates C to assembly, the assembler produces relocatable machine code, and the linker resolves cross-file references. To see the intermediate assembly, use `gcc -S file.c`. For RISC-V cross-compilation: `riscv64-unknown-elf-gcc -march=rv32im -mabi=ilp32 -S file.c`. The generated `.s` file shows exactly which assembly instructions correspond to each C construct. For example, `int x = 5;` becomes `addi s0, zero, 5` — an I-type instruction that adds the immediate value 5 to register zero and stores the result in `s0`.

The `sizeof` operator is evaluated at compile time (except for variable-length arrays). The compiler knows the size of each type from its internal ABI tables. On a 32-bit RISC-V target, `sizeof(int) = 4`, `sizeof(char) = 1`, `sizeof(float) = 4`. On an 8-bit AVR microcontroller, `sizeof(int) = 2`. This compile-time evaluation means `sizeof` incurs zero runtime overhead — the result is baked into the generated code as an immediate value.

![Integer Types](/images/embedded-101/c-programming/int-types.jpeg)

Integer types store whole numbers using two's complement encoding for signed values. The MSB represents `-2^(N-1)` for signed types. For `signed char` (8 bits), the MSB represents -128; for `int` (32 bits), the MSB represents -2147483648. Unsigned types use all bits for magnitude, doubling the positive range. The `float` and `double` types use IEEE 754 encoding with sign, exponent, and mantissa fields.

References: Kernighan & Ritchie, "The C Programming Language" (2nd ed.), Ch. 2 (Types, Operators, and Expressions); "C: A Reference Manual" by Harbison & Steele, Ch. 5 (Types). For the compilation pipeline: "Linkers and Loaders" by John R. Levine, Ch. 1.

===QUIZ===

## What is the output of `sizeof(int)` on a 32-bit RISC-V target?
- [ ] 2
- [ ] 8
- [ ] 1
- [ ] 4
Correct: D
Explanation: On a 32-bit architecture (RV32), the `int` type is 32 bits = 4 bytes. The C standard only guarantees that `int` is at least 16 bits, but on most 32-bit platforms it is 32 bits.

## What does the `-S` flag do when passed to GCC?
- [ ] It links the object files into an executable
- [ ] It stops compilation after generating assembly output (.s file)
- [ ] It enables optimization level 3
- [ ] It assembles the source without linking
Correct: B
Explanation: The `-S` flag tells GCC to stop after the compilation stage, producing an assembly language file (.s) instead of an object file. This is the primary way to inspect what assembly code the compiler generates from C source.
