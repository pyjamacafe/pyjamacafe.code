+++
date = '2026-07-06T13:28:00+05:30'
draft = false
title = 'Function Prototypes and Scope'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 2
initial_code = '''#include <stdio.h>

// Function prototype (declaration)
float celsius_to_fahrenheit(float celsius);

int main(void) {
    float temp = celsius_to_fahrenheit(100.0f);
    printf("100 C = %.1f F\\n", temp);
    return 0;
}

// Function definition
float celsius_to_fahrenheit(float celsius) {
    return celsius * 9.0f / 5.0f + 32.0f;
}
'''

[[test_cases]]
input = ''
expected = '100 C = 212.0 F'
+++

## Problem Statement

Write a program that places a function prototype before `main` and the function definition after `main`. The function converts Celsius to Fahrenheit. Demonstrate that the prototype allows the compiler to know the function's signature before its definition.

## Theory and Concepts

- A function prototype declares the function's return type, name, and parameter types without providing the body.
- Prototypes enable the compiler to check argument types and return types when the function is called.
- If a function is used before its definition (or without a prototype), the compiler assumes it returns `int` and accepts any arguments (implicit declaration — banned in C99).
- Parameters in a prototype can omit names: `float convert(float, float)`.

## Real World Application

Prototypes are placed in header files to share function declarations across multiple source files. This enables separate compilation where each `.c` file includes headers declaring the functions it calls from other modules.
