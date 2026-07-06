+++
date = '2026-07-06T14:29:00+05:30'
draft = false
title = 'Enum vs #define Constants'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 15
weight = 5
initial_code = '''#include <stdio.h>

// #define approach
#define COLOR_RED   0
#define COLOR_GREEN 1
#define COLOR_BLUE  2

// Enum approach
enum color { ENUM_RED, ENUM_GREEN, ENUM_BLUE };

int main(void) {
    int c = 0;

    // Using #define constants
    c = COLOR_RED;
    printf("#define: %d\\n", c);

    // Using enum constants
    enum color ec = ENUM_GREEN;
    printf("Enum: %d\\n", ec);

    // Enum with wrong value — compiler may warn
    // enum color invalid = 99;  // Allowed but warns with -Wenum-conversion

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '#define and enum constants demonstrated'
+++

## Problem Statement

Define the same set of constants using both `#define` and `enum`. Compare their usage, debuggability, and type safety. Show that `enum` provides better type checking and debugger support, while `#define` is purely textual substitution.

## Theory and Concepts

- `#define` constants: no type, just text substitution before compilation. No debugger symbol.
- `enum` constants: have `int` type, visible in debuggers, respect scope, appear in compiler warnings.
- `enum` prevents accidental assignment of arbitrary values (compiler warns if type is enforced).
- `#define` can be undefined/overridden; `enum` cannot.
- For simple integer constants, prefer `enum` over `#define` — the type safety and debug visibility are valuable.
- Use `#define` when you need a macro (function-like, stringification, token pasting) or for conditional compilation guards.

## Real World Application

Modern C coding styles recommend `enum` for most integer constant needs and reserve `#define` for macros, include guards, and conditional compilation. Many codebases are migrating from `#define` constants to `enum` for better tooling support.
