+++
date = '2026-07-06T12:04:00+05:30'
draft = false
title = 'String Length Without strlen'
difficulty = 'easy'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 1
initial_code = '''int my_strlen(const char *s) {
    // Return the length of the string without using strlen
}

int main(void) {
    const char *msg = "Hello";
    int len = my_strlen(msg);

    // Expected len = 5

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Length = 5'
+++

Implement `my_strlen` that returns the number of characters in a null-terminated string without using the standard library function `strlen`.
