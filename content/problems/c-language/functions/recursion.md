+++
date = '2026-07-06T13:29:00+05:30'
draft = false
title = 'Recursion'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 3
initial_code = '''#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main(void) {
    printf("Factorial 5: %d\\n", factorial(5));
    printf("Fibonacci 10: %d\\n", fibonacci(10));
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Factorial 5: 120\\nFibonacci 10: 55'
+++

## Problem Statement

Implement two recursive functions: `factorial` (n! = n × (n−1)!) and `fibonacci` (F(n) = F(n−1) + F(n−2)). Ensure each has a proper base case to terminate the recursion. Print results for small inputs.

## Theory and Concepts

- Recursion: a function calls itself to solve a smaller subproblem.
- Every recursive function must have a base case that stops the recursion.
- Each recursive call adds a new stack frame — deep recursion can cause stack overflow.
- Recursion can be less efficient than iteration (function call overhead, repeated computation for Fibonacci).
- Tail recursion (recursive call at the very end) can be optimized by compilers into iteration.

## Real World Application

Recursion is used for tree traversal (file systems, expression trees), divide-and-conquer algorithms (quicksort, mergesort), fractal generation, backtracking puzzles (Sudoku, N-Queens), and recursive descent parsers.
