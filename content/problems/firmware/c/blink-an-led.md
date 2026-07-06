+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Blink an LED'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 1
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

Write a program to blink an LED connected to GPIO pin 13 once every second.

Assume a function `void gpio_set(int pin, int value)` is available, where `value` is `0` (LOW) or `1` (HIGH), and a `delay_ms(int ms)` function is provided.

Your code should toggle the LED in an infinite loop.
