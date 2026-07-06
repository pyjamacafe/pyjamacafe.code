+++
date = '2026-07-06T14:10:00+05:30'
draft = false
title = 'Static vs Automatic Initialization'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 16
weight = 2
initial_code = '''#include <stdio.h>

int global;           // Zero-initialized (static storage)
static int sglobal;   // Zero-initialized (static storage)

void demo(void) {
    static int s_local = 0;  // Initialized once at program start
    int auto_local = 0;      // Re-initialized each call

    s_local++;
    auto_local++;

    printf("auto=%d, static=%d\\n", auto_local, s_local);
}

int main(void) {
    printf("global=%d, sglobal=%d\\n", global, sglobal);

    demo();
    demo();
    demo();

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'auto initialised each call, static initialised once'
+++

## Problem Statement

Write a function with both a `static` local variable and an automatic local variable initialized to 0. Call it three times and observe that the automatic variable resets each time while the `static` variable retains its value.

## Theory and Concepts

- **Static storage duration** (file-scope and `static` locals): initialized once at program startup. If no explicit initializer, they are zero-initialized.
- **Automatic storage duration** (regular locals): initialized each time the block is entered. Without an explicit initializer, they contain garbage.
- Static locals are initialized only once, when the program starts (or when the function is first called, depending on the implementation).
- Static initialization can use constant expressions; automatic initialization can use any expression.

## Real World Application

Understanding initialization rules prevents bugs in multi-call functions. Static locals are used for caches, counters, and one-time initialization. Automatic variables must always be initialized before reading, especially in embedded systems where startup values are unpredictable.
