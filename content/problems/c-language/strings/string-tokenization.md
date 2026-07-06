+++
date = '2026-07-06T14:22:00+05:30'
draft = false
title = 'String Tokenization'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 12
weight = 4
initial_code = '''#include <stdio.h>

int count_words(const char *str) {
    int count = 0;
    int in_word = 0;

    while (*str) {
        if (*str == ' ' || *str == '\\t' || *str == '\\n') {
            in_word = 0;
        } else if (!in_word) {
            in_word = 1;
            count++;
        }
        str++;
    }
    return count;
}

int main(void) {
    const char *sentence = "The quick brown fox jumps";
    printf("Words: %d\\n", count_words(sentence));
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Words: 5'
+++

## Problem Statement

Write a function `count_words` that counts the number of words in a string (separated by spaces, tabs, or newlines). Implement simple tokenization by tracking whether the current position is inside a word or between words.

## Theory and Concepts

- Tokenization splits a string into tokens based on delimiters.
- Whitespace characters (space, tab, newline, carriage return, form feed, vertical tab) separate words.
- State machine approach: track whether we're currently inside a word (flag).
- The standard library provides `strtok` for tokenization, but it modifies the input string (not thread-safe).
- A custom tokenizer gives you control over delimiter handling and avoids modifying the original string.

## Real World Application

Tokenization is used in command-line parsers, configuration file readers (INI, CSV), log file analysis, compiler lexers, and any application that needs to split text into meaningful components (words, tokens, fields).
