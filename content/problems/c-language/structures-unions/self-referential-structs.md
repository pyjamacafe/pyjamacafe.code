+++
date = '2026-07-06T13:59:00+05:30'
draft = false
title = 'Self-referential Structures (Linked List)'
difficulty = 'hard'
language = 'c'
topic_weight = 0
subtopic_weight = 13
weight = 3
initial_code = '''#include <stdio.h>
#include <stdlib.h>

struct node {
    int data;
    struct node *next;
};

void print_list(const struct node *head) {
    while (head != NULL) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\\n");
}

int main(void) {
    struct node *n1 = malloc(sizeof(struct node));
    struct node *n2 = malloc(sizeof(struct node));
    struct node *n3 = malloc(sizeof(struct node));

    n1->data = 10; n1->next = n2;
    n2->data = 20; n2->next = n3;
    n3->data = 30; n3->next = NULL;

    print_list(n1);

    free(n1); free(n2); free(n3);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = '10 -> 20 -> 30 -> NULL'
+++

## Problem Statement

Implement a singly linked list node using a self-referential structure. Create three nodes, link them together (`n1 → n2 → n3 → NULL`), and write a function to traverse and print the list.

## Theory and Concepts

- A self-referential struct contains a pointer to its own type: `struct node { int data; struct node *next; }`.
- Each node stores data and a pointer to the next node; `NULL` marks the end.
- Traversal: start at `head`, follow `next` pointers until `NULL`.
- Insertion and deletion require careful pointer manipulation (updating the `next` of the previous node).
- Linked lists allow O(1) insertion/deletion at known positions but O(n) random access.

## Real World Application

Linked lists are used in OS kernel task queues, memory allocator free lists, hash table bucket chains, undo/redo functionality in editors, and as the foundation for stacks, queues, and adjacency lists in graph algorithms.
