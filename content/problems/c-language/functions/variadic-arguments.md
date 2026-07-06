+++
date = '2026-07-06T13:31:00+05:30'
draft = false
title = 'Variable-length Argument Lists'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 5
initial_code = '''#include <stdio.h>
#include <stdarg.h>

double average(int count, ...) {
    va_list args;
    va_start(args, count);

    double sum = 0;
    for (int i = 0; i < count; i++) {
        sum += va_arg(args, double);
    }

    va_end(args);
    return sum / count;
}

int main(void) {
    double avg = average(4, 10.0, 20.0, 30.0, 40.0);
    printf("Average: %.1f\\n", avg);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Average: 25.0'
+++

## Problem Statement

Implement a variadic function `average` that takes a count followed by that many `double` arguments and returns their average. Use `<stdarg.h>` macros (`va_list`, `va_start`, `va_arg`, `va_end`). Call it with different argument counts and values.

## Theory and Concepts

- Variadic functions accept a variable number of arguments using `...` in the parameter list.
- At least one named parameter must precede `...` (the named parameter provides context, typically a count or format string).
- `va_list` is a type for iterating over arguments.
- `va_start(ap, last_named)` initializes the iterator.
- `va_arg(ap, type)` retrieves the next argument as the given type.
- `va_end(ap)` cleans up.
- There is no type safety — the caller must provide correct types, or undefined behavior occurs.

## Real World Application

Variadic functions are used in `printf` and its family (format strings), error logging functions, sum/average utilities, and generic initialization functions. The pattern is also used in callback-based APIs for passing extra context.
