+++
date = '2026-07-06T14:18:00+05:30'
draft = false
title = 'Header Guards and Multiple Includes'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 18
weight = 3
initial_code = '''// Simulating the effect of duplicate includes
#include <stdio.h>

// First inclusion (simulates an included header)
#ifndef CONFIG_H
#define CONFIG_H

struct config {
    int timeout;
    int retries;
};

#endif

// Second inclusion (same header included again — should be skipped)
#ifndef CONFIG_H
#define CONFIG_H

struct config {  // Would be redefinition without the guard!
    int timeout;
    int retries;
};

#endif

int main(void) {
    struct config cfg = {1000, 3};
    printf("Config: timeout=%d, retries=%d\\n", cfg.timeout, cfg.retries);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Config: timeout=1000, retries=3'
+++

## Problem Statement

Simulate what happens when a header file is included twice. The first inclusion defines the struct and the guard macro. The second inclusion is skipped by the `#ifndef` guard. Without the guard, the second definition would cause a compilation error.

## Theory and Concepts

- Include guards prevent the same header content from being processed multiple times.
- Without guards, including a header twice would cause duplicate definition errors for types, variables, and inline functions.
- The standard pattern is `#ifndef HEADER_NAME_H` / `#define HEADER_NAME_H` / content / `#endif`.
- `#pragma once` is a non-standard alternative supported by most compilers.
- Headers should be self-contained — they should include everything they need and be guarded.

## Real World Application

Include guards are used in literally every C header file. The convention is to derive the guard name from the filename (e.g., `MY_HEADER_H` for `my_header.h`). Missing guards or typos in guards cause confusing "redefinition" errors from the compiler.
