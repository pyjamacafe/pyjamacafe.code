+++
date = '2026-07-06T13:41:00+05:30'
draft = false
title = 'Conditional Compilation'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 9
weight = 3
initial_code = '''#include <stdio.h>

#define DEBUG 1
#define PLATFORM "STM32"

int main(void) {
#if DEBUG
    printf("Debug mode enabled\\n");
#endif

#if defined(PLATFORM)
    printf("Platform: %s\\n", PLATFORM);
#else
    printf("No platform defined\\n");
#endif

#ifdef __STDC__
    printf("ANSI C compliant\\n");
#endif

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Debug mode enabled, Platform: STM32, ANSI C compliant'
+++

## Problem Statement

Use `#if`, `#ifdef`, `#ifndef`, and `#else` directives to conditionally compile different code paths. Define macros like `DEBUG` and `PLATFORM` and show how changing their definitions changes which block is compiled.

## Theory and Concepts

- `#if expression`: includes the block if `expression` evaluates to non-zero.
- `#ifdef MACRO`: includes the block if `MACRO` is defined.
- `#ifndef MACRO`: includes the block if `MACRO` is not defined.
- `#else` and `#elif` provide alternative branches.
- `#endif` ends the conditional block.
- `defined()` operator can be used inside `#if`: `#if defined(A) || defined(B)`.
- Conditional compilation happens at preprocessing time, before compilation.

## Real World Application

Conditional compilation is used for debug vs release builds, platform-specific code (Linux vs Windows vs embedded), feature toggles, compiler-specific workarounds, and header include guards (`#ifndef HEADER_H` / `#define HEADER_H` / `#endif`).
