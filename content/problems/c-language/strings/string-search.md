+++
date = '2026-07-06T14:23:00+05:30'
draft = false
title = 'String Search'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 12
weight = 5
initial_code = '''#include <stdio.h>

int find_char(const char *str, char ch) {
    for (int i = 0; str[i] != '\\0'; i++) {
        if (str[i] == ch) return i;
    }
    return -1;
}

int main(void) {
    const char *text = "Hello, World!";
    char target = 'o';

    int pos = find_char(text, target);
    if (pos >= 0) {
        printf("Found '%c' at position %d\\n", target, pos);
    } else {
        printf("'%c' not found\\n", target);
    }

    // Find second occurrence
    int count = 0;
    for (int i = 0; text[i]; i++) {
        if (text[i] == target) count++;
    }
    printf("'%c' appears %d times\\n", target, count);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Found at position 4, appears 2 times'
+++

## Problem Statement

Write a function `find_char` that searches for a character in a string and returns its index (or -1 if not found). Also count how many times the character appears. Test with different search targets.

## Theory and Concepts

- String search iterates through the array until the character is found or the null terminator is reached.
- The function returns the index (0-based) or a sentinel value like -1 for "not found".
- The standard library provides `strchr` for finding a character's first occurrence.
- For finding substrings, use `strstr` (standard) or implement the naive string-matching algorithm.
- String search is case-sensitive by default; for case-insensitive search, compare lowercased characters.

## Real World Application

String search is used in text editors (find/replace), search engines, pattern matching in log files, command parsing (finding flags starting with `-`), and DNA sequence matching in bioinformatics.
