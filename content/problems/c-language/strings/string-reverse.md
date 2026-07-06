+++
date = '2026-07-06T12:05:00+05:30'
draft = false
title = 'String Reverse In-place'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 2
initial_code = '''void reverse_string(char *s) {
    // Reverse the string s in-place
}

int main(void) {
    char str[] = "hello";
    reverse_string(str);

    // After reverse, str should be "olleh"

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Reversed string: olleh'
+++

## Problem Statement

Write `reverse_string` that reverses a null-terminated string in-place. Use two pointers — one starting at the beginning of the string and one at the last character before the null terminator — and swap characters as they move toward each other.

## Theory and Concepts

- **Two-pointer technique**: Place one pointer at the start and another at the end (last non-null character). Swap the characters they point to, then move the pointers toward each other until they meet.
- **In-place modification**: The reversal happens within the same array without allocating extra memory.
- **String length**: To find the end pointer, you first need to determine the string length (by finding the null terminator).

## Real World Application

String reversal appears in text processing utilities, palindrome checking, encoding transformations, and as a step in more complex algorithms (e.g., reversing words in a sentence). The two-pointer swapping pattern is also used in array reversal, linked list reversal, and in-place data transformations in graphics and audio processing.
