+++
date = '2026-07-06T13:36:00+05:30'
draft = false
title = 'Register Keyword'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 7
weight = 4
initial_code = '''#include <stdio.h>

int main(void) {
    register int i;  // Hint to compiler: keep i in a register

    for (i = 0; i < 1000000; i++) {
        // Tight loop where register hint may help
    }
    printf("Done\\n");

    // Cannot take address of register variable:
    // int *p = &i;  // Would cause compilation error

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Done'
+++

## Problem Statement

Declare a loop counter with the `register` storage class. Use it in a tight loop. Note that trying to take the address of a `register` variable would be a compilation error. Explain the purpose and limitations of `register`.

## Theory and Concepts

- `register` is a hint to the compiler that the variable will be heavily used and should be placed in a CPU register.
- Modern compilers are very good at register allocation and usually ignore `register`.
- You cannot take the address of a `register` variable (`&register_var` is invalid).
- `register` can only be used on automatic variables (locals and function parameters).
- In C11 and later, `register` is mostly obsolete — it still prevents taking the address, but the performance hint is ignored by most compilers.

## Real World Application

The `register` keyword is rarely used in modern C. It remains useful only in highly constrained environments (freestanding implementations, some embedded compilers) or when you specifically want to prevent a variable from having an address for optimization reasons.
