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

Implement `create_node` that dynamically allocates a `struct node`, sets its `data` field to the given `value`, sets `next` to `NULL`, and returns a pointer to it.
