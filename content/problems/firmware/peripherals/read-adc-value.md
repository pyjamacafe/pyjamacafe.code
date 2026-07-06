+++
date = '2026-07-05T22:00:00+05:30'
draft = false
title = 'Read an ADC Value'
difficulty = 'easy'
language = 'c'
topic_weight = 1
subtopic_weight = 3
weight = 1
initial_code = '''#include <stdint.h>

uint16_t adc_read(int channel);

float read_voltage(void) {
    uint16_t raw = adc_read(0);
    float voltage = 0.0f;

    // Convert raw 12-bit ADC value to voltage (0.0 - 3.3V)

    return voltage;
}
'''

[[test_cases]]
input = '2048'
expected = 'ADC voltage in range'
+++

Read an analog value from ADC channel 0 and scale it to a voltage between 0 and 3.3 V.

Assume the ADC is 12-bit (0–4095). Use `uint16_t adc_read(int channel)` to get the raw ADC value.

Return the scaled voltage as a `float`.
