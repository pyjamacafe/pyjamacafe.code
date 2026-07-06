+++
date = '2026-07-06T12:03:00+05:30'
draft = false
title = 'Linked List Node Creation'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 2
initial_code = '''#include <stdlib.h>

struct node {
    int data;
    struct node *next;
};

struct node *create_node(int value) {
    // Allocate a new node, set data to value, next to NULL
    // Return pointer to the new node
}

int main(void) {
    struct node *head = create_node(10);

    // head->data should be 10, head->next should be NULL

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Node created: data=10 next=NULL'
+++

## Problem Statement

Implement `create_node` that dynamically allocates a `struct node` on the heap, sets its `data` field to the given `value`, sets the `next` pointer to `NULL`, and returns a pointer to the newly created node. If allocation fails, return `NULL`.

## Theory and Concepts

- **Self-referential structures**: A struct that contains a pointer to its own type is the basis for linked data structures.
- **Dynamic allocation of structs**: Use `malloc(sizeof(struct node))` to allocate a node. The `sizeof` operator ensures the correct amount of memory is reserved.
- **Arrow operator**: `ptr->member` is shorthand for `(*ptr).member`. It accesses a member of a struct through a pointer.
- **Linked list fundamentals**: Each node stores data and a pointer to the next node. A `NULL` next pointer marks the end of the list.

## Real World Application

Linked lists appear in OS kernel data structures (task queues, free lists), memory allocators (free blocks), file systems (directory entries), and as the building block for more complex structures like stacks, queues, and adjacency lists for graphs. Mastering node creation is the first step toward building any linked data structure.
