# KMP Trainer - Real-Time Threat Detection in a Noisy, Decoy-Filled Log Stream

An academic B.Tech **Design and Analysis of Algorithms (DAA) + Artificial Intelligence (AI)** research and implementation project.

## Project Overview

A real-time network monitoring system watches **8 known threat signatures** (hardware faults like `OVERHEAT`, `FAN_FAIL`, `VOLT_DROP` and cyber attacks like `DROP TABLE`, `RM_RF`). 

Each log line contains 150 characters, hides 1 real threat, and is flooded with near-match decoys. The system is constrained to:
- Arm **only 3 patterns** per line.
- Spend at most **400 character comparisons** (250 on tight lines).
- Utilize **Knuth-Morris-Pratt (KMP)** algorithm exclusively.

The AI agent must learn which patterns to search **first** so that KMP locates the threat before the comparison budget runs out. Missing cases undergo **Hard-Case Replay** until the agent catches them.

---

## Core Algorithmic Proofs

1. **KMP Efficiency**:
   - Time Complexity: $\mathcal{O}(n + m)$ preprocessing and matching with zero back-tracking.
   - Ideal for low-memory, streaming hardware and repetitive decoy patterns compared to naive $\mathcal{O}(n \cdot m)$ search.
2. **Search Priority & Learning**:
   - Order of pattern selection is critical under budget constraints.
   - Training progression improves threat detection from untrained (`DemoGPT-S`) $\to$ 20 rounds (`DemoGPT-M`) $\to$ 200 rounds (`DemoGPT-L`).

---

## Obstacles

1. **Decoy Haystack**: Real threat hidden in a log flooded with near-match decoys (Budget: 400 comparisons).
2. **Comparison Budget**: Strict budget where arming order determines success or failure (Budget: 250 comparisons).
3. **Hard-Case Replay**: Missed threats recur until properly classified (Budget: 400 comparisons).

---

## Project Structure

```
├── main.c        # C simulation backend benchmarking KMP vs Naive search
├── problem.h     # Problem definition, threat signatures, and weights
├── data.js       # Generated metrics and obstacle configurations
├── app.js        # Interactive simulation controller and auto-retry engine
├── style.css     # Academic dashboard styling
├── index.html    # Single-page application shell
└── README.md     # Documentation
```

---

## How to Run

### 1. Compile and Run the C Backend (Optional to regenerate data)
```bash
gcc -o kmp_backend main.c
./kmp_backend
```

### 2. Launch the Web Dashboard
Serve the directory with any standard HTTP server:
```bash
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.
