+++
date = '2026-07-06T13:56:00+05:30'
draft = false
title = 'String Copy and Concatenation'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 12
weight = 2
initial_code = '''#include <stdio.h>
#include <string.h>

int main(void) {
    char dest[50] = "Hello";
    const char *src = " World";

    // Manual copy
    char copy[50];
    int i;
    for (i = 0; dest[i] != '\\0'; i++) {
        copy[i] = dest[i];
    }
    copy[i] = '\\0';

    printf("Copy: %s\\n", copy);

    // String concatenation (manual)
    char result[50] = "Hello";
    int len = strlen(result);
    for (int j = 0; src[j] != '\\0'; j++) {
        result[len + j] = src[j];
        result[len + j + 1] = '\\0';
    }

    printf("Concatenated: %s\\n", result);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Copy: Hello, Concatenated: Hello World'
+++

## Problem Statement

Implement manual versions of string copy and string concatenation without using the standard library functions (`strcpy`, `strcat`). Copy the string character by character, then concatenate two strings by appending to the first. Use the existing `strlen` function.

## Theory and Concepts

- String copy: iterate from source to destination until `'\0'` is reached, copying each character. Don't forget to null-terminate the destination.
- String concatenation: find the end of the destination string, then append characters from the source.
- Both operations require the destination buffer to be large enough to hold the result.
- Buffer overflow is a common security vulnerability — always know your buffer sizes.

## Real World Application

Manual string operations are needed in freestanding environments (bootloaders, kernels) where the standard library is unavailable. Understanding the low-level mechanics also helps prevent buffer overflow bugs when using library functions.
