+++
date = '2026-07-06T13:26:00+05:30'
draft = false
title = 'Goto Statement'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 6
initial_code = '''#include <stdio.h>

int main(void) {
    // Cleanup pattern with goto
    int error = 0;

    if (/* some condition */) {
        error = 1;
        goto cleanup;
    }

    // ... more code ...

cleanup:
    // Cleanup code runs whether or not goto was taken
    printf("Cleanup executed\\n");

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Error handling with goto demonstrated'
+++

## Problem Statement

Write a program that simulates error handling using `goto` for a cleanup pattern. Allocate multiple resources (simulated by printing messages) and use `goto` to jump to cleanup code if any allocation fails. Show how `goto` can be used to avoid deeply nested error-handling `if` statements.

## Theory and Concepts

- `goto label;` transfers control unconditionally to the specified label.
- Labels are identifiers followed by a colon and can appear before any statement.
- `goto` is restricted: cannot jump into a variable-length array scope or into a different function.
- Common valid uses: breaking out of nested loops, unified cleanup in error paths.
- Overuse of `goto` leads to spaghetti code; use structured control flow when possible.

## Real World Application

`goto` is used in the Linux kernel for cleanup paths (goto out, goto err), in parser generators, and in code that needs to unwind multiple levels of resource acquisition. The single-exit-point pattern (`goto cleanup`) is widely accepted in systems programming.
