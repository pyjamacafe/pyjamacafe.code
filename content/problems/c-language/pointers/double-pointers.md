+++
date = '2026-07-06T13:47:00+05:30'
draft = false
title = 'Pointers to Pointers'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 10
weight = 3
initial_code = '''#include <stdio.h>
#include <stdlib.h>

void allocate_array(int **arr, int size) {
    *arr = (int *)malloc(size * sizeof(int));
    for (int i = 0; i < size; i++) {
        (*arr)[i] = i * 10;
    }
}

int main(void) {
    int *data = NULL;
    allocate_array(&data, 5);

    for (int i = 0; i < 5; i++) {
        printf("%d ", data[i]);
    }
    printf("\\n");

    free(data);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = '0 10 20 30 40'
+++

## Problem Statement

Write a function `allocate_array` that receives a pointer-to-pointer (`int **`) and dynamically allocates and initializes an array. The function modifies the caller's pointer (allocates memory via `malloc`). Print the array values in `main`.

## Theory and Concepts

- `int **p` is a pointer to a pointer — it stores the address of a pointer variable.
- To modify a pointer variable inside a function, pass its address (`int **`).
- `*arr = malloc(...)` assigns the allocated memory to the caller's pointer.
- `(*arr)[i]` dereferences to the array and indexes into it.
- Double pointers are also used for arrays of strings (`char **argv`), 2D arrays, and linked list head modification.

## Real World Application

Double pointers are used in allocation functions (modifying caller's pointer), command-line argument handling (`argv`), implementing data structures where the head pointer may change (linked list insert/delete), and multi-level indirection in complex systems.
