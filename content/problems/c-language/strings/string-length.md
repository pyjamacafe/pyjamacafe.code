+++
date = '2026-07-06T12:04:00+05:30'
draft = false
title = 'String Length Without strlen'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 1
initial_code = '''int my_strlen(const char *s) {
    // Return the length of the string without using strlen
}

int main(void) {
    const char *msg = "Hello";
    int len = my_strlen(msg);

    // Expected len = 5

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Length = 5'
+++

## Problem Statement

Implement `my_strlen` that returns the number of characters in a null-terminated string without using the standard library function `strlen`. The function should count characters from the start of the string up to (but not including) the null terminator `'\0'`.

## Theory and Concepts

- **Null-terminated strings**: In C, a string is an array of `char` ending with a `'\0'` (null) character. The length is the number of characters before the null.
- **Pointer traversal**: Start at the beginning of the string and advance the pointer until the null terminator is encountered.
- **`const` correctness**: The input string is read-only, so the parameter is declared `const char *`.

## Real World Application

Manual string length calculation is essential in environments where the standard library is unavailable — embedded systems, bootloaders, OS kernels, and freestanding C implementations. It also deepens understanding of how standard library functions work under the hood.
