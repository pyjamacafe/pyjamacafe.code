+++
date = '2026-07-06T14:11:00+05:30'
draft = false
title = 'Designated Initializers'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 16
weight = 3
initial_code = '''#include <stdio.h>

struct widget {
    int id;
    const char *name;
    float price;
};

int main(void) {
    // Designated initializers (C99+)
    struct widget w1 = {.id = 1, .name = "Gadget", .price = 9.99f};
    struct widget w2 = {.price = 19.99f, .name = "Widget", .id = 2};

    // Array designated initializer
    int arr[10] = {[0] = 100, [5] = 200, [9] = 300};

    // Print
    printf("%d: %s ($%.2f)\\n", w1.id, w1.name, w1.price);
    printf("arr[0]=%d, arr[5]=%d, arr[9]=%d\\n", arr[0], arr[5], arr[9]);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Designated initializers demonstrated'
+++

## Problem Statement

Use designated initializers (C99 feature) to initialize a struct by field name (in any order) and to initialize specific elements of an array. Show that uninitialized fields/elements are zero-initialized.

## Theory and Concepts

- Designated initializers specify which member to initialize: `.field_name = value`.
- Members not mentioned are zero-initialized.
- Designated initializers can appear in any order — useful for self-documenting code.
- Array designated initializers: `[index] = value` — useful for sparse arrays and lookup tables.
- Nested designated initializers: `.nested.field = value` (C99).
- This feature is available in C99 and later (not in C++).

## Real World Application

Designated initializers make struct initialization self-documenting and order-independent — crucial for structs with many fields (configuration, hardware registers). Array designated initializers are used for interrupt vector tables, lookup tables, and initialization of memory-mapped I/O.
