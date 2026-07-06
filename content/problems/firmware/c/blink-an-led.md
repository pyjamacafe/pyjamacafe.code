+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Blink an LED'
difficulty = 'easy'
language = 'c'
topic_weight = 2
subtopic_weight = 2
weight = 1
initial_code = '''#include <stdint.h>

void gpio_set(int pin, int value);
void delay_ms(int ms);

int main(void) {
    // Configure GPIO pin 13 as output

    while (1) {
        // Turn LED on, wait, turn off, wait
    }

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'LED toggling detected'
+++

## Problem Statement

Write a program to blink an LED connected to GPIO pin 13 once every second. Use the provided helper functions `gpio_set(int pin, int value)` (where `value` is `0` for LOW or `1` for HIGH) and `delay_ms(int ms)`. The LED should be turned on for 500 ms, then off for 500 ms, repeating indefinitely.

## Theory and Concepts

- **GPIO control**: General Purpose Input/Output pins can be set HIGH or LOW to control external devices like LEDs.
- **Infinite loops**: Embedded firmware often runs in a continuous loop with no exit condition.
- **Blocking delays**: `delay_ms` pauses execution for a given number of milliseconds. While simple, blocking delays tie up the CPU — real systems use timers or RTOS scheduling.

## Real World Application

LED blinking is the embedded equivalent of "Hello, World". It is used for status indicators on virtually every electronic device — power lights, network activity LEDs, error codes, and user notifications. The pattern of toggling a GPIO pin in a timed loop extends to controlling relays, buzzers, and other digital actuators.
