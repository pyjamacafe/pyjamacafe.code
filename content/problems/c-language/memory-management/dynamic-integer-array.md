+++
date = '2026-07-06T12:02:00+05:30'
draft = false
title = 'Dynamic Integer Array'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 2
weight = 1
initial_code = '''#include <stdlib.h>

int *create_array(int n, int initial_value) {
    // Allocate memory for an array of n integers
    // Initialise each element to initial_value
    // Return pointer to the allocated array
}

int main(void) {
    int *arr = create_array(5, 42);

    // arr[0] through arr[4] should all be 42

    free(arr);
    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Array allocated and initialised correctly'
+++

Write `create_array` that allocates an array of `n` integers using `malloc`, initialises every element to `initial_value`, and returns the pointer. Handle the case where `malloc` might fail.
