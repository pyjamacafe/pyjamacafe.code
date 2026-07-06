+++
date = '2026-07-06T14:15:00+05:30'
draft = false
title = 'const-correctness in Functions'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 17
weight = 4
initial_code = '''#include <stdio.h>

// Good: const tells caller the data won't be modified
void print_array(const int *arr, int len) {
    for (int i = 0; i < len; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

// Also modifies: no const
void scale_array(int *arr, int len, int factor) {
    for (int i = 0; i < len; i++) {
        arr[i] *= factor;
    }
}

int main(void) {
    int data[] = {1, 2, 3, 4, 5};
    int n = sizeof(data) / sizeof(data[0]);

    print_array(data, n);
    scale_array(data, n, 10);
    print_array(data, n);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '1 2 3 4 5 \\n 10 20 30 40 50'
+++

## Problem Statement

Write one function that takes a `const int *` parameter (read-only access) and another that takes a regular `int *` (modifiable). The first prints the array; the second scales it by a factor. Call both to demonstrate const-correctness.

## Theory and Concepts

- Const-correctness means using `const` for parameters that the function does not modify.
- Benefits: self-documenting code (readers know what will be modified), compiler catches unintended modifications, enables optimizations.
- If a function takes `const int *`, the caller knows their data won't be changed — even if they pass a non-const variable.
- If a function takes `int *`, the caller should assume the data may be modified.
- Passing a `const int *` to a function expecting `int *` generates a warning (discards const qualifier).

## Real World Application

Const-correctness is a coding standard in most C projects. Standard library functions follow this pattern: `strlen(const char *)` does not modify, `strcpy(char *, const char *)` modifies the first argument, const on the second.
