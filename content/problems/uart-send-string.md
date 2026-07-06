+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'UART Send String'
difficulty = 'medium'
language = 'c'
initial_code = '''void uart_putc(char c);

void uart_send_string(const char *str) {
    // Send each character until the null terminator
}
'''

[[test_cases]]
input = '"Hello"'
expected = 'String transmitted'
+++

Implement a function that sends a null-terminated string over UART one character at a time.

Use the provided blocking function `void uart_putc(char c)`.

Do not use any standard library string functions.
