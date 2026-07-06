+++
date = '2026-07-06T13:44:00+05:30'
draft = false
title = '#undef and Macro Redefinition'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 6
initial_code = '''#include <stdio.h>

#define VALUE 10
#define VALUE 20  // Some compilers warn about redefinition

int main(void) {
    printf("VALUE = %d\\n", VALUE);

#undef VALUE
#define VALUE 30

    printf("After #undef: VALUE = %d\\n", VALUE);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'VALUE = 20, After #undef: VALUE = 30'
+++

## Problem Statement

Define a macro, then undefine it with `#undef`, then redefine it with a new value. Print the value before and after to demonstrate that `#undef` removes the macro definition, allowing a new definition.

## Theory and Concepts

- `#undef MACRO_NAME` removes the macro definition.
- Without `#undef`, redefining a macro causes a compiler warning (or error depending on flags).
- `#undef` is useful for temporary macros or when different parts of the code need different definitions.
- `#undef` can be used with conditional compilation to control macro definitions.
- After `#undef`, `#ifdef MACRO_NAME` evaluates to false.

## Real World Application

`#undef` is used to undefine library macros that conflict with application code, in test frameworks to redefine assert macros, and in complex configuration headers where different sections need different macro values.
