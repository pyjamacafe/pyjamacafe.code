+++
date = '2026-07-06T14:28:00+05:30'
draft = false
title = 'Enum with Bit Flags'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 15
weight = 4
initial_code = '''#include <stdio.h>

enum permission {
    PERM_NONE    = 0,
    PERM_READ    = 1 << 0,
    PERM_WRITE   = 1 << 1,
    PERM_EXECUTE = 1 << 2,
    PERM_ALL     = PERM_READ | PERM_WRITE | PERM_EXECUTE
};

int main(void) {
    int user_perm = PERM_READ | PERM_WRITE;

    if (user_perm & PERM_READ)   printf("Can read\\n");
    if (user_perm & PERM_WRITE)  printf("Can write\\n");
    if (user_perm & PERM_EXECUTE) printf("Can execute\\n");

    // Check specific permission
    if ((user_perm & PERM_WRITE) == PERM_WRITE) {
        printf("Write access confirmed\\n");
    }

    printf("Permission value: %d\\n", user_perm);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Can read, Can write, Permission value: 3'
+++

## Problem Statement

Define an enumeration where each constant is a power of 2 (using `<<`), representing individual bits. Combine them with bitwise OR to create composite permissions. Check for specific permissions using bitwise AND. This pattern is called "bit flags" or "bitmask enum".

## Theory and Concepts

- Enum constants with power-of-2 values (1, 2, 4, 8, ...) represent individual bits.
- Combine: `PERM_READ | PERM_WRITE` sets bits 0 and 1.
- Check: `(flags & PERM_READ)` is non-zero if the read bit is set.
- Remove: `flags & ~PERM_WRITE` clears the write bit.
- The advantage over separate boolean flags is compact storage and the ability to pass a set of flags as a single integer.
- Ensure the underlying type can hold the combined value (use `unsigned int` for safety).

## Real World Application

Bit flags are used in file permissions (Unix rwx), hardware register configurations (each bit enables a feature), system calls (`open()` flags), network socket options, and any API where multiple options can be combined.
