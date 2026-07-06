+++
date = '2026-07-06T13:32:00+05:30'
draft = false
title = 'Scope and Lifetime in Functions'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 6
weight = 6
initial_code = '''#include <stdio.h>

int global = 10;  // File scope, static duration

void demo_scope(void) {
    int local = 20;        // Block scope, automatic
    static int persist = 0; // Block scope, static duration

    persist++;
    local++;
    global++;

    printf("local=%d, persist=%d, global=%d\\n", local, persist, global);
}

int main(void) {
    demo_scope();
    demo_scope();
    demo_scope();

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'local=21 persist=1 global=11 ... local=21 persist=3 global=13'
+++

## Problem Statement

Write a function that demonstrates different variable scopes and lifetimes: a `static` local variable that persists across calls, an automatic (regular) local variable that is re-initialized each call, and a global variable. Call the function three times and observe how each variable behaves.

## Theory and Concepts

- **Automatic variables** (default locals): scope is the enclosing block, lifetime is the function call. Created each time the block is entered, destroyed on exit.
- **Static local variables**: scope is the enclosing block, but lifetime is the entire program. They retain their value between function calls and are initialized only once.
- **Global variables**: scope is the file (or the entire program with `extern`), lifetime is the entire program.
- Block scope can be nested — inner blocks can shadow outer variables.

## Real World Application

Static locals are used for function-local caches, call counters, random seed initialization, and singleton-like patterns. Understanding scope and lifetime is critical for avoiding use-after-return bugs and unintended variable sharing.
