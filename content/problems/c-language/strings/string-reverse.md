+++
date = '2026-07-06T12:05:00+05:30'
draft = false
title = 'String Reverse In-place'
difficulty = 'medium'
language = 'c'
topic_weight = 0
subtopic_weight = 3
weight = 2
initial_code = '''void reverse_string(char *s) {
    // Reverse the string s in-place
}

int main(void) {
    char str[] = "hello";
    reverse_string(str);

    // After reverse, str should be "olleh"

    return 0;
}
'''

[[test_cases]]
input = ''
expected = 'Reversed string: olleh'
+++

Write `reverse_string` that reverses a null-terminated string in-place by swapping characters from both ends using two pointers.
