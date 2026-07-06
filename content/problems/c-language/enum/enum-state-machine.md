+++
date = '2026-07-06T14:27:00+05:30'
draft = false
title = 'Enum for State Machines'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 15
weight = 3
initial_code = '''#include <stdio.h>

enum state {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_ERROR,
    STATE_COUNT
};

const char *state_name(enum state s) {
    switch (s) {
        case STATE_IDLE:    return "Idle";
        case STATE_RUNNING: return "Running";
        case STATE_PAUSED:  return "Paused";
        case STATE_ERROR:   return "Error";
        default:            return "Unknown";
    }
}

int main(void) {
    enum state current = STATE_RUNNING;
    printf("Current state: %s (%d)\\n", state_name(current), current);
    printf("Number of states: %d\\n", STATE_COUNT);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Current state: Running (1), Number of states: 4'
+++

## Problem Statement

Define an enumeration for a finite state machine with states IDLE, RUNNING, PAUSED, and ERROR. Add a `STATE_COUNT` sentinel at the end to track the number of states. Write a function that converts an `enum state` to its string representation using `switch`.

## Theory and Concepts

- Enums are ideal for state machines — named constants make states self-documenting.
- A `STATE_COUNT` sentinel (always last) can be used for array sizes and bounds checking.
- `switch` on enum values is exhaustive — good compilers warn if a case is missing.
- Enum values are `int`, making them suitable for array indices.
- Prefer `enum` over `#define` for related integer constants — enums have debugger support and type checking.

## Real World Application

State machines using enums are everywhere — protocol handlers (TCP states), UI navigation, device driver states, game character AI, and transaction processing pipelines. The pattern is simple, reliable, and easy to debug.
