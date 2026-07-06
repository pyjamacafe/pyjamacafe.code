+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Circular Buffer'
difficulty = 'medium'
language = 'c'
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

Implement a simple circular (ring) buffer for bytes with a fixed size of 16.

Provide `int buffer_put(uint8_t byte)` and `int buffer_get(uint8_t *byte)` functions.

Return `0` on success and `-1` when the buffer is full or empty respectively.
