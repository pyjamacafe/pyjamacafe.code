+++
date = '2026-07-06T13:51:00+05:30'
draft = false
title = 'Multidimensional Arrays'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 11
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int matrix[3][4] = {
        { 1,  2,  3,  4},
        { 5,  6,  7,  8},
        { 9, 10, 11, 12}
    };

    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            printf("%3d ", matrix[i][j]);
        }
        printf("\\n");
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = '3×4 matrix printed'
+++

## Problem Statement

Declare and initialize a 3×4 two-dimensional array (matrix). Use nested loops to print it in row-major order (each row on a separate line). Modify elements and re-print to verify changes.

## Theory and Concepts

- A 2D array is an array of arrays: `int matrix[3][4]` has 3 rows, each with 4 ints.
- Memory layout is row-major: all of row 0, then row 1, then row 2.
- Access: `matrix[row][col]` — the compiler computes `*(*(matrix + row) + col)`.
- When passed to a function, the inner dimension must be specified: `void print(int m[][4], int rows)`.
- Higher dimensions follow the same pattern: `int cube[3][4][5]`.

## Real World Application

Multidimensional arrays are used for image pixels (2D), video frames (3D), spreadsheet grids, transformation matrices in graphics, convolution kernels in signal processing, and game boards (chess, tic-tac-toe).
