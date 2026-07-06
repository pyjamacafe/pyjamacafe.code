+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Circular Buffer'
difficulty = 'medium'
language = 'c'
topic_weight = 2
subtopic_weight = 2
weight = 3
initial_code = '''#include <stdint.h>

#define BUFFER_SIZE 16

static uint8_t buffer[BUFFER_SIZE];
static uint8_t head = 0;
static uint8_t tail = 0;

int buffer_put(uint8_t byte) {
    // Return -1 if full, otherwise add byte
}

int buffer_get(uint8_t *byte) {
    // Return -1 if empty, otherwise read byte
}
'''

[[test_cases]]
input = 'put 1, put 2, get, get'
expected = 'Circular buffer OK'
+++

## Problem Statement

Implement a circular (ring) buffer for bytes with a fixed size of 16. Provide two functions: `buffer_put(uint8_t byte)` adds a byte to the buffer and returns `0` on success or `-1` if the buffer is full; `buffer_get(uint8_t *byte)` reads the next byte into the provided pointer and returns `0` on success or `-1` if the buffer is empty. Use the `head` and `tail` indices provided in the starter code.

## Theory and Concepts

- **Circular buffer**: A fixed-size buffer that wraps around when the end is reached, reusing memory at the start. It is implemented with two pointers (or indices): `head` for writing and `tail` for reading.
- **Empty vs full distinction**: A circular buffer is empty when `head == tail` and full when `(head + 1) % size == tail` (sacrificing one slot) or by tracking a count separately.
- **Static buffers**: The buffer and indices are declared `static` to persist across function calls while keeping them local to the translation unit.

## Real World Application

Circular buffers are used in UART/SPI/I2C receive and transmit drivers, audio processing pipelines, keyboard and touch input queues, logging systems, and any producer-consumer scenario where data arrives asynchronously and must be processed in order without dynamic memory allocation.
