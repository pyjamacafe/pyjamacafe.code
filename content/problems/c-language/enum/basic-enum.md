+++
date = '2026-07-06T14:07:00+05:30'
draft = false
title = 'Basic Enum Usage'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 15
weight = 1
initial_code = '''#include <stdio.h>

enum color { RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA };

int main(void) {
    enum color c = GREEN;

    printf("GREEN = %d\\n", c);

    // Using enum in a switch
    switch (c) {
        case RED:    printf("Red\\n"); break;
        case GREEN:  printf("Green\\n"); break;
        case BLUE:   printf("Blue\\n"); break;
        default:     printf("Other\\n"); break;
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'GREEN = 1, Green'
+++

## Problem Statement

Define an enumeration for colors and use a variable of the enum type. Print the integer value of an enumerator and use the enum in a `switch` statement to print the color name.

## Theory and Concepts

- `enum name { CONSTANT1, CONSTANT2, ... }` defines an enumerated type.
- Enumerators are integer constants starting from 0 by default (incrementing by 1).
- Enum variables are integers — they can hold any value of the underlying type, not just the named constants.
- Enums improve code readability compared to raw integer constants.
- The underlying type of an enum is `int` (or a compatible integer type).

## Real World Application

Enums are used for state machines (`STATE_IDLE`, `STATE_RUNNING`, `STATE_ERROR`), error codes (`ERR_SUCCESS`, `ERR_TIMEOUT`, `ERR_INVALID`), configuration modes (`MODE_FAST`, `MODE_NORMAL`, `MODE_LOW_POWER`), and any set of named integer constants.
