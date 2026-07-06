+++
date = '2026-07-06T12:00:00+05:30'
draft = false
title = 'Swap Two Variables Using Pointers'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 1
initial_code = '''void swap(int *a, int *b) {
    // Swap the values of a and b using pointers
}

int main(void) {
    int x = 10, y = 20;
    swap(&x, &y);

    // After swap, x should be 20 and y should be 10

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Swap successful: x=20 y=10'
+++

## Problem Statement

Write a function `swap` that takes two integer pointers and swaps the values they point to. The function should modify the original variables passed from `main`. After calling `swap(&x, &y)`, the variable `x` should hold the original value of `y` and `y` should hold the original value of `x`.

## Theory and Concepts

- **Pointers**: A pointer stores the memory address of a variable. Passing a pointer to a function allows the function to read and modify the original variable.
- **Dereferencing**: The `*` operator accesses the value stored at the address held by a pointer.
- **Call by reference**: In C, all arguments are passed by value. To modify a variable inside a function, you pass its address (a pointer) and dereference it.

## Real World Application

Swapping values is a fundamental building block in sorting algorithms (bubble sort, quick sort), data structure manipulation (reversing arrays, rotating trees), and low-level memory operations. Any time you need to exchange two values in-place, this pattern applies.
