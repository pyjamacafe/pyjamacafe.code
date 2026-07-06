+++
date = '2026-07-06T13:22:00+05:30'
draft = false
title = 'Switch Statement'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 5
weight = 2
initial_code = '''#include <stdio.h>

int main(void) {
    int day = 3;  // 1=Mon ... 7=Sun

    switch (day) {
        case 1: printf("Monday\\n"); break;
        case 2: printf("Tuesday\\n"); break;
        case 3: printf("Wednesday\\n"); break;
        case 4: printf("Thursday\\n"); break;
        case 5: printf("Friday\\n"); break;
        case 6:
        case 7: printf("Weekend\\n"); break;
        default: printf("Invalid day\\n");
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Wednesday'
+++

## Problem Statement

Use a `switch` statement to print the day of the week based on a numeric input (1–7). Demonstrate fall-through by having Saturday and Sunday map to the same case ("Weekend"). Include a `default` branch for invalid input.

## Theory and Concepts

- `switch (expression)` branches to the matching `case` label.
- The expression must be an integer type (`int`, `char`, `enum`).
- `break` exits the switch; without it, execution falls through to the next case.
- `default` handles values that don't match any case (optional).
- Multiple cases can share the same code by stacking them: `case 6: case 7: printf("Weekend"); break;`.

## Real World Application

Switch statements are used for command parsing (handling different opcodes), state machines (IDLE → RUNNING → ERROR), menu navigation, and dispatching events based on type codes in protocols and drivers.
