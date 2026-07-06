+++
date = '2026-07-06T14:31:00+05:30'
draft = false
title = 'typedef for Function Signatures'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 14
weight = 5
initial_code = '''#include <stdio.h>

// Typedef for a comparison function
typedef int (*comparator)(const void *, const void *);

int compare_ints(const void *a, const void *b) {
    int ia = *(const int *)a;
    int ib = *(const int *)b;
    return (ia > ib) - (ia < ib);
}

void sort_ints(int *arr, int n, comparator cmp) {
    // Simple bubble sort using comparator
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (cmp(&arr[j], &arr[j + 1]) > 0) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main(void) {
    int data[] = {5, 2, 8, 1, 9};
    int n = sizeof(data) / sizeof(data[0]);

    sort_ints(data, n, compare_ints);

    for (int i = 0; i < n; i++) {
        printf("%d ", data[i]);
    }
    printf("\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '1 2 5 8 9'
+++

## Problem Statement

Use `typedef` to define a function pointer type for a comparator function. Implement a sorting function that accepts this comparator type and uses it to order elements. This mirrors how `qsort` works in the standard library.

## Theory and Concepts

- `typedef int (*comparator)(const void *, const void *)` creates an alias for the comparator function pointer type.
- This makes function parameters that accept callbacks much more readable.
- The comparator pattern is used by `qsort` and `bsearch` in the C standard library.
- The `const void *` parameters allow the comparator to work with any data type.
- The function returns negative, zero, or positive for less-than, equal, or greater-than.

## Real World Application

This pattern is used throughout C libraries for generic algorithms — sorting, searching, and filtering. Creating typedefs for callback signatures makes APIs self-documenting and improves code readability in event-driven systems.
