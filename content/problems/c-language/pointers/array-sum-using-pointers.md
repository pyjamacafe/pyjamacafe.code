+++
date = '2026-07-06T12:01:00+05:30'
draft = false
title = 'Array Sum Using Pointer Arithmetic'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 2
initial_code = '''int array_sum(const int *arr, int len) {
    // Use pointer arithmetic to compute sum of all elements
    int sum = 0;

    // Your code here

    return sum;
}

int main(void) {
    int numbers[] = {1, 2, 3, 4, 5};
    int total = array_sum(numbers, 5);

    // Expected total = 15

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Sum = 15'
+++

Implement `array_sum` using pointer arithmetic (not array indexing). Traverse the array using pointer increment and accumulate the total.
