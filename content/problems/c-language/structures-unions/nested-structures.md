+++
date = '2026-07-06T13:58:00+05:30'
draft = false
title = 'Nested Structures'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 13
weight = 2
initial_code = '''#include <stdio.h>

struct address {
    const char *street;
    const char *city;
    int zip;
};

struct person {
    const char *name;
    int age;
    struct address addr;
};

int main(void) {
    struct person p = {
        "Charlie",
        30,
        {"123 Main St", "Springfield", 12345}
    };

    printf("Name: %s\\n", p.name);
    printf("City: %s\\n", p.addr.city);
    printf("Zip: %d\\n", p.addr.zip);

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Nested structure fields printed'
+++

## Problem Statement

Define two structures where one contains the other as a field (`struct address` inside `struct person`). Initialize a fully nested instance with a single brace-enclosed initializer and access the nested fields using the `.` operator twice (e.g., `p.addr.city`).

## Theory and Concepts

- Structures can contain other structures as members (nesting).
- Nested member access: `outer.inner.field`.
- Initialization uses nested braces: `{name, age, {street, city, zip}}`.
- There is no limit to nesting depth (but readability suffers beyond 2–3 levels).
- Self-referential structures (containing a pointer to their own type) are the basis for linked lists and trees.

## Real World Application

Nested structures model real-world hierarchical data — a `car` has an `engine`, an `engine` has a `pistons` array; a `customer` record contains an `address`, and that address contains a `country`. This mirrors how data is organized in databases and JSON/XML.
