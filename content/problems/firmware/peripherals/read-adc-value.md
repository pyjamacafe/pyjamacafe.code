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

## Problem Statement

Read an analog value from ADC channel 0 and scale it to a voltage between 0.0 and 3.3 V. The ADC is 12-bit, so raw values range from 0 to 4095. Use the provided function `uint16_t adc_read(int channel)` to obtain the raw value. Compute `voltage = (raw / 4095.0) * 3.3` and return it as a `float`.

## Theory and Concepts

- **ADC resolution**: A 12-bit ADC produces 2¹² = 4096 discrete digital values. Each step represents 3.3 V / 4095 ≈ 0.8 mV.
- **Scaling**: The raw integer value must be converted to the corresponding voltage using the reference voltage and maximum digital value.
- **Floating-point arithmetic**: `float` is used for the result. Note the use of `4095.0` (a float literal) to force floating-point division instead of integer truncation.

## Real World Application

ADC reading is used in sensor interface firmware — measuring temperature (thermistors, thermocouples), light intensity (photodiodes), battery voltage, potentiometer position (joysticks, knobs), current sensing (motor drivers), and audio input. Scaling raw ADC values to engineering units is a daily task in embedded firmware development.
