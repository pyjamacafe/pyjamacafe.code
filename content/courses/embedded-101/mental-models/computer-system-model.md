+++
date = '2026-07-10T10:00:00+05:30'
draft = false
title = 'Computer System Model'
difficulty = 'easy'
language = 'c'
topic_weight = -20
subtopic_weight = 1
weight = 2
initial_code = '''/*
 * Copyright © 2025 Typobrahe Education LLP (pyjamacafe.com)
 * All Rights Reserved.
 *
 * Description: Demonstrates load-store model — memory read, ALU operation, and peripheral output.
 */
#include <stdio.h>

int main(void) {
    int data = 42;          // write to memory (store)
    int result = data + 1;  // read from memory, ALU operation
    printf("%d\n", result); // output to peripheral (console)
    return 0;
}
'''
+++

## Problem Statement

Draw the block diagram of a computer system. Explain each component's role in executing a simple program like `int x = 5; int y = x + 3;`. Trace the flow of data through the system during each step of execution.

## Theory and Concepts

- **von Neumann architecture (stored-program concept)**: Instructions and data share the same memory space and bus. The CPU fetches instructions from memory, decodes them, and executes them using the ALU and registers. This is the universal model that virtually all general-purpose computers follow.
- **Harvard architecture**: Separate address spaces for instructions and data (used in most microcontrollers — e.g., AVR, PIC, 8051). Allows simultaneous access to instruction and data memory, improving throughput. Modern Cortex-M processors use a modified Harvard architecture (separate buses but unified address space).
- **Block diagram components**:
  - **CPU (Central Processing Unit)**: Contains the Control Unit (decodes instructions, generates control signals), ALU (Arithmetic Logic Unit — performs arithmetic/logic ops), and registers (fast internal storage for operands and results, e.g., Program Counter, Instruction Register, Accumulator).
  - **Memory**: Stores instructions (code) and data. Organized as a linear array of bytes, each with a unique address. Three levels: cache (SRAM, on-chip), main memory (DRAM), secondary storage (Flash/SSD/HDD).
  - **Input devices**: Keyboards, sensors, ADCs, network interfaces — bring data into the system.
  - **Output devices**: Displays, LEDs, DACs, actuators, network interfaces — send data out.
  - **System bus**: The communication highway connecting all components. Three sub-buses: address bus (carries memory addresses), data bus (carries data values), control bus (carries read/write signals, clock, interrupts).
  - **Clock**: Synchronizes all operations. Each clock cycle advances the state machine of the CPU.

## Real World Application

The von Neumann bottleneck — the single bus between CPU and memory — is the fundamental performance limit in most computers. In 2025, the gap between CPU speed and DRAM latency (the "memory wall") means a CPU may stall for hundreds of cycles waiting for data from main memory. This is why modern CPUs have multi-level caches (L1, L2, L3) — small, fast SRAM buffers that keep recently used data close to the processor. The Apple M3 Ultra has 192 MB of unified memory (HBM) accessible to CPU and GPU on a single die, effectively eliminating the bottleneck for graphics workloads. In embedded systems, Harvard architectures (like the ARM Cortex-M4) avoid the bottleneck by allowing the CPU to fetch the next instruction from Flash while simultaneously reading/writing data in SRAM.

===EXPLANATION===

The computer system model is the single most important abstraction in all of computing. Every programmer — whether writing a web app in Python or a bootloader in assembly — is ultimately interacting with this model. The CPU does not understand `printf("Hello")`; it understands machine code: load a value from address 0x1234 into register R0, add 1 to R0, store R0 to address 0x5678. Every high-level construct (functions, loops, objects) must be compiled down to this model. Understanding the model means you can reason about performance, memory usage, and correctness even without knowing the exact machine — because every machine is approximately this model.

<figure id="fig-1" class="fig-center">
  <img src="/images/embedded-101/mental-models/simple-cs-model.jpeg" alt="Simple Computer System Model">
  <figcaption><a href="#fig-1" class="fig-link">Figure 1:</a> Block diagram of a simple computer system model showing CPU, memory, and I/O connected via system bus</figcaption>
</figure>

The intuition is that a computer is a data-processing factory. Memory is the warehouse (shelves of numbered boxes). The bus is the conveyor belt between the warehouse and the factory floor. The CPU is the factory floor: the Control Unit is the foreman reading the instruction manual, the ALU is the machinery that does the actual work (adding, comparing, shifting), and the registers are the workbench — small, fast, within arm's reach. Input devices bring raw materials (sensor readings, keystrokes); output devices ship finished products (LCD pixels, motor torques). The clock is the factory whistle: every tick, the foreman reads the next manual page and starts the next operation.

In embedded systems, this model takes on concrete form. On an STM32F4 microcontroller, reading `GPIOA->IDR` is a load from address 0x40020010 — the input data register for Port A. Writing `GPIOA->ODR = 0x01` is a store to address 0x40020014 — the output data register. These addresses are fixed in the chip's memory map (documented in the reference manual). The system bus connects the Cortex-M4 CPU to the GPIO peripheral block, the SRAM at address 0x20000000, and the Flash at address 0x08000000. The CPU does not "know" it's talking to a GPIO pin — it just reads and writes memory addresses. The peripheral hardware (address decoder, bus interface, I/O pad logic) translates those memory transactions into pin voltages. This is memory-mapped I/O, and it is the foundation of all embedded programming.

<figure id="fig-2" class="fig-center">
  <img src="/images/embedded-101/mental-models/simple-cs-mode-with-peripherial.jpeg" alt="Computer System Model With Peripherals">
  <figcaption><a href="#fig-2" class="fig-link">Figure 2:</a> Computer system model with peripheral devices connected to the system bus</figcaption>
</figure>

## Load-Store Model

The load-store model is central to understanding how CPUs interact with memory and peripherals. Inside the CPU, General Purpose Registers (such as R0, R1, R2 shown as the Register File) serve as temporary storage locations where the CPU performs operations. With the ability to execute arithmetic (addition, subtraction, multiplication, division), logic (comparison), and data movement operations, the CPU manipulates data stored within these registers. Data flows between the general purpose registers and memory over the system bus. The CPU places the desired memory address on the Address Bus and reads or writes data through the Data Bus. When data is transferred from memory to a register, it is called a **load** operation; moving data from a register to memory is a **store** operation. This seamless exchange between registers and memory is the fundamental mechanism by which all computation proceeds. Both instructions and data live in the same storage (in the von Neumann model), but they occupy different address ranges — the CPU fetches one or the other by placing the right address on the address bus.

## Storage, Data and Instructions

Memory operates at the level of individual bits. Each bit is composed of electrical elements representing either a presence (1 or "On" state) or absence (0 or "Off" state) of electrical charge. Eight bits form a Byte, and four Bytes combine to form a Word (32 bits). The CPU interacts with memory in chunks of 1, 2, or 4 Bytes depending on the architecture — direct bit-level access is not possible. How the CPU treats and interprets the fetched bits distinguishes between two crucial concepts: **data** and **instructions**. During a load or store instruction, the address bus carries a value corresponding to an address in the Data region of memory. Conversely, when the CPU is not performing a load or store, the address bus carries a value from the Code region, and the value on the data bus is interpreted as an instruction. This differentiation is fundamental to the proper functioning of the CPU.

<figure id="fig-3" class="fig-right">
  <img src="/images/embedded-101/mental-models/mem.jpeg" alt="Memory Organization">
  <figcaption><a href="#fig-3" class="fig-link">Figure 3:</a> Memory organization in the computer system model</figcaption>
</figure>

## Instructions

Modern CPUs use instructions that are 32 bits (4 Bytes) wide. These 32-bit patterns are composed of different combinations of on/off states that convey specific tasks to the CPU. The CPU determines the required operation by examining a predefined section of the instruction known as the **opcode** (typically 7 bits wide). The value of the opcode corresponds to a specific operation — for example, opcode 0x0 might denote an "add" operation, while 0x1 signifies a "move" operation. The additional parameters associated with the opcode are called the **operands**, which specify how data should be moved or what mathematical operation needs to be executed.

<figure id="fig-4" class="fig-center">
  <img src="/images/embedded-101/mental-models/instruction.jpeg" alt="Instruction Execution">
  <figcaption><a href="#fig-4" class="fig-link">Figure 4:</a> Instruction execution flow in the computer system model</figcaption>
</figure>

Figure 5 shows the complete picture: the CPU connected to storage via address and data buses, with the register file, ALU, and control unit working in concert to fetch, decode, and execute instructions.

<figure id="fig-5" class="fig-center">
  <img src="/images/embedded-101/mental-models/simple_cpu_model.jpeg" alt="Simple CPU Model">
  <figcaption><a href="#fig-5" class="fig-link">Figure 5:</a> Simple CPU model showing the connection between CPU and storage with address and data buses</figcaption>
</figure>

References: Patterson & Hennessy, "Computer Organization and Design" §1.3–1.4; von Neumann, "First Draft of a Report on the EDVAC" (1945); ARM Cortex-M4 Technical Reference Manual, §3 (Memory Map). For the memory wall: Wulf & McKee, "Hitting the Memory Wall: Implications of the Obvious" (ACM SIGARCH, 1995).

===QUIZ===

## In the von Neumann architecture, what is the key defining characteristic that distinguishes it from the Harvard architecture?
- [ ] It uses vacuum tubes instead of transistors
- [x] Instructions and data share the same memory space and bus
- [ ] It separates instruction and data memory into distinct address spaces
- [ ] It has no ALU
Correct: B
Explanation: The von Neumann architecture (stored-program concept) stores both instructions and data in the same memory and uses a single bus to access them. The Harvard architecture separates instruction and data memory paths, allowing simultaneous access to both. Most embedded microcontrollers use a modified Harvard architecture for performance.

## What is the primary function of the system bus in a computer?
- [ ] To provide power to all components
- [x] To connect the CPU, memory, and I/O devices for data transfer
- [ ] To cool the processor
- [ ] To store the operating system
Correct: B
Explanation: The system bus is the communication backbone that connects the CPU, memory, and peripherals. It consists of three sub-buses: the address bus (selects which memory/peripheral to talk to), the data bus (carries the actual data), and the control bus (carries read/write signals, clock, and interrupt lines). Without the bus, no component can communicate with any other.

## In the load-store model, what is the difference between a load and a store operation?
- [ ] Load moves data from register to memory; store moves from memory to register
- [x] Load moves data from memory to a register; store moves data from a register to memory
- [ ] Load and store are the same operation
- [ ] Load is used only for instructions; store is used only for data
Correct: B
Explanation: A load operation transfers data from a memory address into a CPU register. A store operation transfers data from a CPU register out to a memory address. Both are fundamental data movement operations in RISC architectures.

## What is the "von Neumann bottleneck"?
- [ ] The limited number of CPU registers
- [x] The single shared bus between CPU and memory that limits performance
- [ ] The slow speed of the ALU
- [ ] The size of the instruction register
Correct: B
Explanation: In the von Neumann architecture, instructions and data share the same memory and bus. The single bus between CPU and memory becomes a bottleneck because the CPU must wait for data transfers over this shared path, often stalling for hundreds of cycles while waiting for data from DRAM.

## How does the CPU differentiate between data and instructions in memory?
- [ ] Data and instructions are stored in different colors of memory cells
- [x] During a load/store, the address bus points to the data region; otherwise, it carries addresses from the code region and the fetched value is treated as an instruction
- [ ] Instructions have a special prefix bit
- [ ] The CPU uses a separate instruction cache
Correct: B
Explanation: The CPU distinguishes data from instructions by context. When executing a load or store instruction, the address on the bus refers to a data address. At other times (normal instruction fetch), the address comes from the PC and the returned value is treated as an instruction to be decoded.

## What is Harvard architecture and how does it improve performance over von Neumann?
- [ ] It uses a single bus but faster clock speeds
- [x] It has separate address spaces for instructions and data, allowing simultaneous access to both
- [ ] It eliminates the need for memory
- [ ] It uses analog instead of digital signals
Correct: B
Explanation: Harvard architecture maintains separate address spaces and buses for instructions and data, allowing the CPU to fetch the next instruction from Flash while simultaneously reading or writing data in SRAM. This avoids the von Neumann bottleneck and is common in microcontrollers like AVR, PIC, and Cortex-M processors.
