+++
date = '2026-07-06T14:05:00+05:30'
draft = false
title = 'typedef for Function Pointers'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 14
weight = 3
initial_code = '''#include <stdio.h>
#include <math.h>

typedef double (*math_func)(double);

double compute(math_func f, double x) {
    return f(x);
}

int main(void) {
    math_func funcs[] = {sin, cos, sqrt};
    const char *names[] = {"sin", "cos", "sqrt"};

    for (int i = 0; i < 3; i++) {
        printf("%s(0.5) = %.4f\\n", names[i], compute(funcs[i], 0.5));
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'sin(0.5) = 0.4794, cos(0.5) = 0.8776, sqrt(0.5) = 0.7071'
+++

## Problem Statement

Use `typedef` to create a type alias for a function pointer: `typedef double (*math_func)(double)`. Use this type in a function that accepts a `math_func` argument and in an array of function pointers. Call standard math functions through this interface.

## Theory and Concepts

- Function pointer syntax is cryptic: `double (*fp)(double)`.
- `typedef double (*math_func)(double)` creates an alias `math_func` for a pointer to a function that takes `double` and returns `double`.
- This makes arrays of function pointers and function parameters much more readable.
- Function pointer typedefs are commonly placed in header files.
- They enable callback mechanisms, plugin systems, and dispatch tables.

## Real World Application

Function pointer typedefs are essential in callback-heavy APIs (`qsort`, `bsearch`, signal handlers), GUI frameworks (event callbacks), embedded drivers (interrupt handlers), and implementing virtual tables in C-based OOP.
