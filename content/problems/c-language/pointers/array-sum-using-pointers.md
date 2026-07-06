+++
date = '2026-07-06T12:01:00+05:30'
draft = false
title = 'Array Sum Using Pointer Arithmetic'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 2
initial_code = '''int array_sum(const int *arr, int len) {
    // Use pointer arithmetic to compute sum of all elements
    int sum = 0;

    // Your code here

    return sum;
}

int main(void) {
    int numbers[] = {1, 2, 3, 4, 5};
    int total = array_sum(numbers, 5);

    // Expected total = 15

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Sum = 15'
+++

## Problem Statement

Implement `array_sum` that computes the sum of all elements in an integer array using pointer arithmetic instead of array indexing. Traverse the array by incrementing a pointer and accumulate the total. The function receives a pointer to the first element and the length of the array.

## Theory and Concepts

- **Pointer arithmetic**: Adding an integer `n` to a pointer advances it by `n × sizeof(element)` bytes. Incrementing a `int*` moves it to the next integer in memory.
- **Array–pointer duality**: An array name decays to a pointer to its first element. `arr[i]` is equivalent to `*(arr + i)`.
- **Const qualification**: `const int *arr` means the data being pointed to cannot be modified through that pointer — a good practice for read-only input parameters.

## Real World Application

Pointer arithmetic is heavily used in systems programming, network packet parsing, image processing (pixel buffers), and any scenario where you need to traverse raw memory buffers efficiently. Understanding this concept is essential for working with low-level APIs, embedded firmware, and performance-critical loops.
