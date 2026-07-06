+++
date = '2026-07-06T13:42:00+05:30'
draft = false
title = 'Stringification and Token Pasting'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 4
initial_code = '''#include <stdio.h>

#define STRINGIFY(x) #x
#define TOKEN_PASTE(a, b) a ## b
#define MAKE_VAR(name) int var_ ## name = (name)

int main(void) {
    printf("%s\\n", STRINGIFY(hello world));
    printf("%s\\n", STRINGIFY(42));

    int xy = 100;
    printf("xy = %d\\n", TOKEN_PASTE(x, y));

    MAKE_VAR(42);
    printf("var_42 = %d\\n", var_42);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'hello world, 42, xy = 100, var_42 = 42'
+++

## Problem Statement

Use the `#` (stringification) operator to convert macro arguments to string literals, and the `##` (token pasting) operator to concatenate tokens into new identifiers. Create a macro that generates variable names dynamically.

## Theory and Concepts

- `#x` in a macro body converts the argument to a string literal: `STRINGIFY(hello)` → `"hello"`.
- `a ## b` concatenates two tokens: `TOKEN_PASTE(x, y)` → `xy`.
- Token pasting is useful for generating identifiers (variable names, function names) based on macro parameters.
- Stringification is useful for printing the source form of an expression or creating assertion macros.
- Both operators only work inside `#define` macros.

## Real World Application

Token pasting is used in the Linux kernel and embedded code for generating register access functions (`READ_REG(name)` expands to `read_register_name()`). Stringification is used in debug macros, assertion frameworks (`assert(x)` prints `"x"` on failure), and code generation utilities.
