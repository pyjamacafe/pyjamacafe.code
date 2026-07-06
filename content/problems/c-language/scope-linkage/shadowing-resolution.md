+++
date = '2026-07-06T14:26:00+05:30'
draft = false
title = 'Name Shadowing and Resolution'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 8
weight = 5
initial_code = '''#include <stdio.h>

int value = 100;  // Global

void outer_function(void) {
    int value = 200;  // Shadows global

    {
        int value = 300;  // Shadows outer block
        printf("Innermost: %d\\n", value);
    }

    printf("Outer block: %d\\n", value);
}

int main(void) {
    outer_function();
    printf("Global: %d\\n", value);

    // To access the shadowed global (not possible from within the function)
    // Use a trick: create a pointer to the global before it gets shadowed
    extern int value;  // Refers to the global
    printf("Global (extern): %d\\n", value);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Scope resolution demonstrated'
+++

## Problem Statement

Create a global variable and shadow it in nested blocks with the same name. Print the value at each level to show which declaration is in scope. Use `extern` to access the global from within `main` (though it is not shadowed there).

## Theory and Concepts

- Name shadowing occurs when an inner scope declares a name that already exists in an outer scope.
- The innermost declaration takes precedence — the outer declaration is hidden (shadowed).
- Shadowing can make code confusing — the same name refers to different variables in different scopes.
- Once the inner block exits, the outer declaration becomes visible again.
- There is no way in standard C to access a shadowed global from within a function that shadows it (unlike C++'s `::name`).

## Real World Application

Shadowing is a common source of bugs — modifying a local variable when you intended to modify the global. Many coding standards (e.g., MISRA C) forbid variable shadowing. Compiler warnings (`-Wshadow`) can help detect it.
