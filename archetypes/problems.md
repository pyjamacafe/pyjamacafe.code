+++
date = '{{ .Date }}'
draft = false
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
difficulty = 'easy'
initial_code = '''// Starter code for {{ .File.ContentBaseName }}

'''

[[test_cases]]
input = ''
expected = 'Expected output description'
+++

Describe the problem here. Markdown is supported.
