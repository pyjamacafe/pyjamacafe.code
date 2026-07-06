+++
date = '2026-07-06T14:06:00+05:30'
draft = false
title = 'typedef for Portability'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 14
weight = 4
initial_code = '''#include <stdio.h>
#include <stdint.h>

// Platform-abstracted types
typedef uint32_t  u32;
typedef uint16_t  u16;
typedef uint8_t   u8;

typedef int32_t   i32;
typedef int16_t   i16;
typedef int8_t    i8;

int main(void) {
    u32 counter = 0xFFFFFFFF;
    u8 byte = 0xFF;
    i32 temperature = -25;

    printf("u32: %u (size: %zu)\\n", counter, sizeof(u32));
    printf("u8: %u (size: %zu)\\n", byte, sizeof(u8));
    printf("i32: %d (size: %zu)\\n", temperature, sizeof(i32));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Portable typedef types demonstrated'
+++

## Problem Statement

Use `typedef` with `<stdint.h>` types to create portable aliases (`u32`, `u16`, `u8`, `i32`, etc.). Declare variables with these types and print their sizes. Explain why these aliases help write portable code across different platforms.

## Theory and Concepts

- `int`, `long`, etc. have different sizes on different platforms (16-bit, 32-bit, 64-bit).
- `<stdint.h>` provides fixed-width types: `uint32_t`, `int16_t`, etc.
- Wrapping them with shorter aliases (`u32`, `i16`) makes code concise.
- When porting code to a new architecture, only the typedefs need to change (if the fixed-width types are available).
- This is a common pattern in embedded firmware and cross-platform libraries.

## Real World Application

Portable typedefs are essential in embedded systems (where `int` may be 16 bits on an 8-bit MCU), game engines (cross-platform build targets), and any code that serializes binary data with fixed-size fields (file formats, network protocols).
