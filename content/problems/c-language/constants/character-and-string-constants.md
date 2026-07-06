+++
date = '2026-07-06T13:06:00+05:30'
draft = false
title = 'Character and String Constants'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    char ch = 'A';
    char newline = '\\n';
    char tab = '\\t';

    // Print character constants
    printf("Character: %c, code: %d\\n", ch, ch);

    // String literal
    char *str = "Hello, C!";
    printf("String: %s\\n", str);

    // Print size of string vs character

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Character and string constants demonstrated'
+++

## Problem Statement

Declare a character constant using single quotes, a string literal using double quotes, and escape sequences like `\n` and `\t`. Print the character both as a symbol and as its ASCII code. Print the string and compare `sizeof('A')` with `sizeof("A")`.

## Theory and Concepts

- Character constants are enclosed in single quotes: `'A'`, `'\n'`.
- String constants are enclosed in double quotes: `"hello"`.
- A string constant implicitly includes a null terminator `'\0'` — so `"A"` is 2 bytes, while `'A'` is 1 byte.
- Escape sequences: `\n` (newline), `\t` (tab), `\\` (backslash), `\'` (single quote), `\"` (double quote), `\0` (null).

## Real World Application

Character and string constants appear in every C program — printing messages, parsing input, formatting output, and defining command strings for peripheral modules (AT commands, JSON strings, protocol payloads).
