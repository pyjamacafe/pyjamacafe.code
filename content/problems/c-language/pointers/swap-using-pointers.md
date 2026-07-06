+++
date = '2026-07-06T12:00:00+05:30'
draft = false
title = 'Swap Two Variables Using Pointers'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 1
weight = 1
initial_code = '''void swap(int *a, int *b) {
    // Swap the values of a and b using pointers
}

int main(void) {
    int x = 10, y = 20;
    swap(&x, &y);

    // After swap, x should be 20 and y should be 10

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Swap successful: x=20 y=10'
+++

Write a function `swap` that takes two integer pointers and swaps the values they point to. The function should modify the original variables passed from `main`.
