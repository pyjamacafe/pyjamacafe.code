+++
date = '2026-07-06T14:24:00+05:30'
draft = false
title = 'File Scope vs Block Scope'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 8
weight = 3
initial_code = '''#include <stdio.h>

int global = 1;  // File scope

static int file_static = 2;  // File scope, internal linkage

void show_scopes(void) {
    int auto_var = 3;  // Block scope

    static int static_local = 4;  // Block scope, static duration

    {
        int inner = 5;  // Innermost block scope
        printf("Inner block: %d\\n", inner);
    }

    printf("Auto: %d, Static local: %d\\n", auto_var, static_local);
}

int main(void) {
    printf("Global: %d, File static: %d\\n", global, file_static);
    show_scopes();
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'All scope types demonstrated'
+++

## Problem Statement

Demonstrate the four types of scope in C: file scope (global), file scope with static (internal linkage), block scope (automatic variable), and block scope with static duration (static local). Print each from the appropriate scope level.

## Theory and Concepts

- **File scope**: variables declared outside any function, visible from declaration to end of file.
- **Block scope**: variables declared inside `{}`, visible only within that block (including nested blocks).
- **Function scope**: only applies to `goto` labels — they are visible throughout the function.
- **Function prototype scope**: parameter names in a prototype are only visible within the prototype.
- Variables in inner scopes can shadow variables in outer scopes (same name, different variable).

## Real World Application

Understanding scope is essential for writing correct programs — it determines where a variable can be accessed, prevents accidental modification, and enables information hiding. Scope-related bugs (especially shadowing) are common in large codebases.
