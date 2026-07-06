+++
date = '2026-07-06T14:02:00+05:30'
draft = false
title = 'sizeof and Structure Padding'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 13
weight = 6
initial_code = '''#include <stdio.h>
#include <stddef.h>

struct packed_struct {
    char a;  // 1 byte
    int b;   // 4 bytes
    char c;  // 1 byte
};

struct ordered_struct {
    int b;   // 4 bytes
    char a;  // 1 byte
    char c;  // 1 byte
};

int main(void) {
    printf("Packed struct size: %zu\\n", sizeof(struct packed_struct));
    printf("Ordered struct size: %zu\\n", sizeof(struct ordered_struct));
    printf("Offsets: a=%zu, b=%zu, c=%zu\\n",
           offsetof(struct packed_struct, a),
           offsetof(struct packed_struct, b),
           offsetof(struct packed_struct, c));

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Struct padding demonstrated'
+++

## Problem Statement

Define two structs with the same members but in different order. Use `sizeof` and `offsetof` to show how member ordering affects the total struct size due to alignment padding. Explain why reordering members can reduce waste.

## Theory and Concepts

- The compiler may add padding between members to satisfy alignment requirements.
- Alignment: an `int` (4 bytes) must be at an address divisible by 4.
- `offsetof(type, member)` returns the byte offset of a member within the struct.
- Reordering members from largest to smallest minimizes padding (the "large-to-small" rule).
- The struct's total size is padded to be a multiple of the largest member's alignment.
- `#pragma pack` can force packed layout (at the cost of alignment-optimized access).

## Real World Application

Structure padding matters in memory-constrained systems (embedded devices with KB of RAM), network protocols (packed structs for wire format), file format parsing, and when sharing binary data between different compilers or architectures.
