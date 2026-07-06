+++
date = '2026-07-06T13:02:00+05:30'
draft = false
title = 'Character Type and _Bool'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 3
initial_code = '''#include <stdio.h>
#include <stdbool.h>

int main(void) {
    char ch = 'A';
    bool flag = true;

    // Print ch as character and as integer
    // Toggle flag and print it

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Char and bool values printed'
+++

## Problem Statement

Work with `char` and `_Bool` types. Initialize a `char` variable with a letter, print it both as a character (`%c`) and as an integer (`%d`). Initialize a `_Bool` (or `bool` from `<stdbool.h>`) variable, toggle it, and print its value.

## Theory and Concepts

- `char` is the smallest addressable unit (typically 1 byte). It can hold ASCII values 0–127 (or extended).
- `char` can be `signed` or `unsigned` depending on the platform.
- `_Bool` stores 0 (false) or 1 (true). `<stdbool.h>` provides `bool`, `true`, and `false` macros.
- Characters are stored as their ASCII integer codes — `'A' == 65`.

## Real World Application

`char` is the building block for all text processing — strings, file I/O, communication protocols. `_Bool` is used for flags and state machines in embedded firmware and game logic.
