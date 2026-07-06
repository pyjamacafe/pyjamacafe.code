+++
date = '2026-07-06T14:04:00+05:30'
draft = false
title = 'typedef for Structs'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 14
weight = 2
initial_code = '''#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

typedef struct {
    Point top_left;
    Point bottom_right;
} Rectangle;

int main(void) {
    Point p1 = {10, 20};
    Rectangle rect = {{0, 0}, {100, 50}};

    printf("Point: (%d, %d)\\n", p1.x, p1.y);
    printf("Rectangle: (%d,%d)-(%d,%d)\\n",
           rect.top_left.x, rect.top_left.y,
           rect.bottom_right.x, rect.bottom_right.y);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Struct typedefs demonstrated'
+++

## Problem Statement

Define a `typedef` for a `struct` representing a 2D point, and another for a rectangle composed of two points. Create instances and access their fields. Show how `typedef` eliminates the need to write `struct` keyword each time.

## Theory and Concepts

- `typedef struct { fields } TypeName;` defines an anonymous struct and gives it a name.
- This is the most common use of `typedef` — it makes struct usage feel like a built-in type.
- Without `typedef`, you must write `struct Point p;` instead of `Point p;`.
- The struct tag can still be used for self-referential types (use `struct name` inside the struct).
- `typedef` structs are used extensively in the C standard library (`FILE`, `FILE *`).

## Real World Application

Typedef'd structs are standard practice in C — almost all libraries define types like `HANDLE`, `WINDOW`, `BUFFER`, etc. The `<stdint.h>` types (`uint32_t`, `int64_t`) are typedefs that abstract platform-specific integer sizes.
