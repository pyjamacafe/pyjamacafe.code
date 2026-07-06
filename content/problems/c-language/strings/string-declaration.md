+++
date = '2026-07-06T13:55:00+05:30'
draft = false
title = 'String Declaration and Initialization'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 12
weight = 1
initial_code = '''#include <stdio.h>

int main(void) {
    // Different ways to create strings
    char s1[] = "Hello";
    char s2[10] = "Hello";
    const char *s3 = "Hello";

    // Print each
    printf("s1: %s (sizeof: %zu)\\n", s1, sizeof(s1));
    printf("s2: %s (sizeof: %zu)\\n", s2, sizeof(s2));
    printf("s3: %s\\n", s3);

    // Character by character
    for (int i = 0; s1[i] != '\\0'; i++) {
        printf("%c ", s1[i]);
    }
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'String declaration demonstrated'
+++

## Problem Statement

Declare strings using three different methods: a modifiable array (`char s1[]`), a fixed-size array (`char s2[10]`), and a pointer to a string literal (`const char *s3`). Print each and note the differences in `sizeof` and mutability.

## Theory and Concepts

- Strings in C are null-terminated arrays of `char`. The null terminator `'\0'` marks the end.
- `char s1[] = "Hello"` creates an array of 6 bytes (5 chars + `'\0'`).
- `char s2[10] = "Hello"` creates an array of 10 bytes, with remaining elements zero-initialized.
- `const char *s3 = "Hello"` points to a string literal in read-only memory — modifying it is undefined behavior.
- String literals are stored in read-only memory on most systems.

## Real World Application

String handling is fundamental to C programming — parsing configuration files, processing user input, constructing output messages, network protocol parsing, and file I/O. The distinction between modifiable arrays and read-only string literals is critical for avoiding crashes.
