+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'UART Send String'
difficulty = 'medium'
language = 'c'
topic_weight = 2
subtopic_weight = 2
weight = 2
initial_code = '''void uart_putc(char c);

void uart_send_string(const char *str) {
    // Send each character until the null terminator
}
'''

[[test_cases]]
input = '"Hello"'
expected = 'String transmitted'
+++

## Problem Statement

Implement a function `uart_send_string` that transmits a null-terminated string over UART one character at a time. Use the provided blocking function `void uart_putc(char c)` to send each individual character. Do not use any standard library string functions.

## Theory and Concepts

- **UART communication**: Universal Asynchronous Receiver-Transmitter is a serial protocol for data exchange between devices. Characters are sent one bit at a time.
- **Blocking I/O**: `uart_putc` waits until the character has been transmitted before returning. This simplifies the code at the cost of tying up the CPU during transmission.
- **Null-terminated iteration**: The function reads characters from the string until it encounters the `'\0'` terminator.

## Real World Application

UART is one of the most common communication interfaces in embedded systems — used for debug logging, sensor data output, configuring modules via AT commands, and communicating with Wi-Fi/Bluetooth chips. Transmitting strings (human-readable messages, formatted data, command responses) is a frequent requirement in firmware development.
