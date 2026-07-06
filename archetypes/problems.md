+++
date = '{{ .Date }}'
draft = false
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 1
weight = 1
initial_code = '''// Starter code for {{ .File.ContentBaseName }}

'''

[[test_cases]]
input = ''
expected = 'Expected output description'
+++

Describe the problem here. Markdown is supported.
