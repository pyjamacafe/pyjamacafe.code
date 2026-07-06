+++
date = '2026-07-06T14:21:00+05:30'
draft = false
title = 'String Comparison'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 12
weight = 3
initial_code = '''#include <stdio.h>

int my_strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(unsigned char *)s1 - *(unsigned char *)s2;
}

int main(void) {
    const char *a = "apple";
    const char *b = "apple";
    const char *c = "apples";
    const char *d = "banana";

    printf("cmp(apple, apple): %d\\n", my_strcmp(a, b));
    printf("cmp(apple, apples): %d\\n", my_strcmp(a, c));
    printf("cmp(apple, banana): %d\\n", my_strcmp(a, d));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'cmp results: 0, negative, positive'
+++

## Problem Statement

Implement `my_strcmp` that compares two strings lexicographically. Return 0 if equal, negative if first < second, positive if first > second. Compare the standard library behavior by testing with equal strings, a prefix, and completely different strings.

## Theory and Concepts

- String comparison proceeds character by character using their ASCII values.
- `strcmp` returns 0 for equality, negative if s1 < s2, positive if s1 > s2.
- The comparison stops at the first differing character or the null terminator.
- For case-insensitive comparison, use `strcasecmp` (POSIX) or convert each char before comparing.
- Always use `strcmp` instead of `==` for string equality (== compares pointer addresses, not contents).

## Real World Application

String comparison is used in command parsing (checking user input against known commands), sorting algorithms, dictionary lookups, searching in databases, and implementing search functionality in any text-based application.
