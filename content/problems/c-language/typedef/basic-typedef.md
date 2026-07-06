+++
date = '2026-07-06T14:03:00+05:30'
draft = false
title = 'Basic typedef'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 14
weight = 1
initial_code = '''#include <stdio.h>

typedef unsigned int uint;
typedef float real;

int main(void) {
    uint count = 100;
    real temperature = 36.5f;

    printf("Count: %u\\n", count);
    printf("Temperature: %.1f\\n", temperature);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Count: 100, Temperature: 36.5'
+++

## Problem Statement

Use `typedef` to create aliases for `unsigned int` (as `uint`) and `float` (as `real`). Declare variables using these aliases and print their values. Explain that `typedef` creates a new name for an existing type, not a new type.

## Theory and Concepts

- `typedef existing_type new_name;` creates a type alias.
- `typedef` is a storage class specifier (like `static`, `extern`) but does not affect storage.
- Typedef names follow the same scoping rules as variables.
- Common uses: shortening verbose types, abstracting platform-specific types, improving readability.
- `typedef` does not create a new type — it's just an alias (unlike `struct` which creates a unique type).

## Real World Application

`typedef` is used for fixed-width integer types (`uint32_t`, `int16_t` from `<stdint.h>`), size type (`size_t`), pointer types (`FILE *`), and abstracting hardware-specific types for portability across platforms.
