+++
date = '2026-07-06T13:57:00+05:30'
draft = false
title = 'Basic Structures'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 13
weight = 1
initial_code = '''#include <stdio.h>
#include <string.h>

struct student {
    int id;
    char name[50];
    float gpa;
};

int main(void) {
    struct student s1;
    s1.id = 1001;
    strcpy(s1.name, "Alice");
    s1.gpa = 3.8f;

    struct student s2 = {1002, "Bob", 3.5f};

    printf("Student 1: %d, %s, %.1f\\n", s1.id, s1.name, s1.gpa);
    printf("Student 2: %d, %s, %.1f\\n", s2.id, s2.name, s2.gpa);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Student records printed'
+++

## Problem Statement

Define a `struct student` with fields for ID (int), name (char array), and GPA (float). Create two instances — one by assigning fields individually, one with a brace-enclosed initializer. Print both records.

## Theory and Concepts

- A `struct` groups related data fields into a single composite type.
- Fields are accessed with `.` (dot) operator: `s1.id`.
- Structures can be initialized with braces: `struct student s2 = {1002, "Bob", 3.5f}`.
- Assignment of structs is allowed: `s1 = s2` copies all fields.
- Structures are passed by value to functions (the entire struct is copied).
- Use pointers to structs (`->` operator) to avoid copying large structs.

## Real World Application

Structures are used everywhere in C — representing points, rectangles, sensor readings, configuration parameters, network packets, file metadata, and database records. They are the primary mechanism for creating user-defined data types.
