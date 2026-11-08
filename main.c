/* KMP Trainer backend - pure C - PURE KMP ONLY, NO NAIVE, NO BRUTE FORCE
   Build: gcc -o kmp_backend main.c      Run (inside backend folder): ./kmp_backend
   It trains the agent, measures the three obstacles, and writes ../frontend/data.js */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "problem.h"

#define NUM_PATTERNS 8
#define SLOTS 3            /* patterns the agent may arm per line */
#define ROUNDS 200         /* training rounds */
#define LOG_LEN 150
#define DECOYS 6
#define BUDGET 400         /* comparisons per line */
#define TIGHT_BUDGET 250   /* comparisons on tight lines */
#define MAX_HARD 50
#define TEST_LOGS 100
#define SAMPLES 40         /* cost samples sent to the frontend */
#define REPEATS 5          /* repeats so random agents give stable rates */
#define BIG 1000000

char patterns[NUM_PATTERNS][16] = {"DISK_ERR", "RM_RF", "AAAAAAAAAB", "SYN_SYN_SYN_X",
                                   "DROP TABLE", "VOLT_DROP", "FAN_FAIL", "OVERHEAT"};
int weight[NUM_PATTERNS] = {4, 2, 6, 8, 10, 15, 25, 30};
double score[NUM_PATTERNS];
double scoreLevel[3][NUM_PATTERNS];
int lastCost, roundCost;

char hardLog[MAX_HARD][LOG_LEN + 1];
int hardThreat[MAX_HARD], hardCount = 0;
char testLog[TEST_LOGS][LOG_LEN + 1];
int testThreat[TEST_LOGS];
char evalLog[TEST_LOGS][LOG_LEN + 1];
int evalThreat[TEST_LOGS], evalN;

char obsName[3][24] = {"Decoy Haystack", "Comparison Budget", "Hard-Case Replay"};
char obsTask[3][130] = {
    "Find the real threat in a log flooded with near-match decoys, using at most 400 comparisons.",
    "Find the threat in a noisy log with a tight budget of 250 comparisons. Search order matters.",
    "Catch threats an untrained agent missed earlier. Hard logs come back until they are caught."};
int obsBudget[3] = {BUDGET, TIGHT_BUDGET, BUDGET};

/* Prefix table: lps[i] = longest prefix of the pattern that is also a suffix ending at i */
void buildLPS(char pat[], int m, int lps[]) {
    int len = 0, i = 1;
    lps[0] = 0;
    while (i < m) {
        if (pat[i] == pat[len]) { len++; lps[i] = len; i++; }
        else if (len > 0) len = lps[len - 1];
        else { lps[i] = 0; i++; }
    }
}

/* KMP search ONLY: returns start position or -1; counts comparisons; stops at 'limit' */
int kmpSearch(char text[], char pat[], int limit) {
    int n = strlen(text), m = strlen(pat), lps[32], i = 0, j = 0;
    buildLPS(pat, m, lps);
    lastCost = 0;
    while (i < n && lastCost < limit) {
        lastCost++;
        if (text[i] == pat[j]) { i++; j++; if (j == m) return i - m; }
        else if (j > 0) j = lps[j - 1];
        else i++;
    }
    return -1;
}

/* Normal log: random noise, DECOYS fake near-matches, one real threat */
void makeLog(char log[], int threat) {
    int i, d, k, p, len;
    for (i = 0; i < LOG_LEN; i++) log[i] = 'A' + rand() % 26;
    log[LOG_LEN] = '\0';
    for (d = 0; d < DECOYS; d++) {
        k = rand() % NUM_PATTERNS;
        len = strlen(patterns[k]) - 1;
        p = rand() % (LOG_LEN - len);
        for (i = 0; i < len; i++) log[p + i] = patterns[k][i];
    }
    len = strlen(patterns[threat]);
    p = rand() % (LOG_LEN - len);
    for (i = 0; i < len; i++) log[p + i] = patterns[threat][i];
}

/* Decoy Haystack: the whole line is the threat's own decoy repeated, real threat hidden in the second half */
void makeFlood(char log[], int threat) {
    int i, len = strlen(patterns[threat]), p;
    for (i = 0; i < LOG_LEN; i++) log[i] = patterns[threat][i % (len - 1)];
    log[LOG_LEN] = '\0';
    p = LOG_LEN / 2 + rand() % (LOG_LEN / 2 - len);
    for (i = 0; i < len; i++) log[p + i] = patterns[threat][i];
}

int pickThreat() {
    int r = rand() % 100, k = 0, sum = weight[0];
    while (r >= sum) { k++; sum += weight[k]; }
    return k;
}

/* The agent: explores randomly with chance eps, otherwise arms its best-scored patterns */
void chooseSlots(double eps, int chosen[]) {
    int s, k, best, used[NUM_PATTERNS];
    for (k = 0; k < NUM_PATTERNS; k++) used[k] = 0;
    for (s = 0; s < SLOTS; s++) {
        if ((rand() % 1000) / 1000.0 < eps) {
            best = rand() % NUM_PATTERNS;
            while (used[best]) best = rand() % NUM_PATTERNS;
        } else {
            best = -1;
            for (k = 0; k < NUM_PATTERNS; k++)
                if (!used[k] && (best == -1 || score[k] > score[best])) best = k;
        }
        used[best] = 1;
        chosen[s] = best;
    }
}

/* Comparison Budget: all searches share 'budget'. Returns 1 if the threat is caught. PURE KMP ONLY */
int playRound(char log[], int threat, int chosen[], int learn, int budget) {
    int s, pos, left = budget, caught = 0;
    roundCost = 0;
    for (s = 0; s < SLOTS && left > 0 && !caught; s++) {
        pos = kmpSearch(log, patterns[chosen[s]], left);
        left -= lastCost;
        roundCost += lastCost;
        if (pos >= 0 && chosen[s] == threat) caught = 1;
        if (learn) {
            if (pos >= 0 && chosen[s] == threat) score[chosen[s]] += 1.0;
            else score[chosen[s]] -= 0.05;
        }
    }
    if (learn && !caught) score[threat] += 0.5;
    return caught;
}

/* Catch rate (%) of an agent level on the current evalLog set - PURE KMP */
double rate(int level, int budget) {
    int t, rep, k, caught = 0, chosen[SLOTS];
    for (k = 0; k < NUM_PATTERNS; k++) score[k] = scoreLevel[level][k];
    for (rep = 0; rep < REPEATS; rep++)
        for (t = 0; t < evalN; t++) {
            chooseSlots(level == 0 ? 1.0 : 0.0, chosen);
            caught += playRound(evalLog[t], evalThreat[t], chosen, 0, budget);
        }
    return caught * 100.0 / (REPEATS * evalN);
}

void loadNormal() {
    int t;
    for (t = 0; t < TEST_LOGS; t++) { strcpy(evalLog[t], testLog[t]); evalThreat[t] = testThreat[t]; }
    evalN = TEST_LOGS;
}

void loadFlood() {
    int t;
    srand(555);
    for (t = 0; t < TEST_LOGS; t++) { evalThreat[t] = testThreat[t]; makeFlood(evalLog[t], evalThreat[t]); }
    evalN = TEST_LOGS;
}

/* Hard logs = test logs an untrained (random) agent missed */
void loadHard() {
    int t, k, chosen[SLOTS];
    srand(2024);
    for (k = 0; k < NUM_PATTERNS; k++) score[k] = 0;
    evalN = 0;
    for (t = 0; t < TEST_LOGS; t++) {
        chooseSlots(1.0, chosen);
        if (!playRound(testLog[t], testThreat[t], chosen, 0, BUDGET)) {
            strcpy(evalLog[evalN], testLog[t]);
            evalThreat[evalN] = testThreat[t];
            evalN++;
        }
    }
    if (evalN == 0) loadNormal();
}

void writeSamples(FILE *f) {
    int i, t;
    for (i = 0; i < SAMPLES; i++) {
        t = i % evalN;
        kmpSearch(evalLog[t], patterns[evalThreat[t]], BIG);
        fprintf(f, "%s%d", i ? "," : "", lastCost);
    }
}

int main() {
    int r, k, t, o, h, threat, replay, caught, chosen[SLOTS];
    char log[LOG_LEN + 1];
    double eps, r0, r1, r2;
    FILE *f;

    srand(777);
    for (t = 0; t < TEST_LOGS; t++) { testThreat[t] = pickThreat(); makeLog(testLog[t], testThreat[t]); }

    /* ---- TRAINING with Hard-Case Replay ---- */
    srand(42);
    for (k = 0; k < NUM_PATTERNS; k++) score[k] = 0;
    for (r = 0; r < ROUNDS; r++) {
        eps = 1.0 - 0.9 * r / ROUNDS;
        replay = (hardCount > 0 && rand() % 100 < 50);
        if (replay) {
            h = rand() % hardCount;
            strcpy(log, hardLog[h]);
            threat = hardThreat[h];
        } else {
            threat = pickThreat();
            makeLog(log, threat);
        }
        chooseSlots(eps, chosen);
        caught = playRound(log, threat, chosen, 1, BUDGET);
        if (!caught && !replay && hardCount < MAX_HARD) {
            strcpy(hardLog[hardCount], log);
            hardThreat[hardCount] = threat;
            hardCount++;
        }
        if (caught && replay) {
            strcpy(hardLog[h], hardLog[hardCount - 1]);
            hardThreat[h] = hardThreat[hardCount - 1];
            hardCount--;
        }
        if (r + 1 == 20) for (k = 0; k < NUM_PATTERNS; k++) scoreLevel[1][k] = score[k];
    }
    for (k = 0; k < NUM_PATTERNS; k++) scoreLevel[2][k] = score[k];

    /* ---- EXPORT FOR THE FRONTEND ---- */
    f = fopen("../frontend/data.js", "w");
    if (f == NULL) { printf("Cannot write ../frontend/data.js. Run this from the backend folder.\n"); return 1; }
    fprintf(f, "var BACKEND = {\n  problem: {title:\"%s\",\n    text:\"%s\",\n    why:\"%s\"},\n  refs: [\n", problemTitle, problemText, problemWhy);
    for (k = 0; k < REFS; k++) fprintf(f, "    {t:\"%s\", u:\"%s\"}%s\n", refTitle[k], refUrl[k], k < REFS - 1 ? "," : "");
    fprintf(f, "  ],\n  patterns: [");
    for (k = 0; k < NUM_PATTERNS; k++) fprintf(f, "%s\"%s\"", k ? "," : "", patterns[k]);
    fprintf(f, "],\n  weights: [");
    for (k = 0; k < NUM_PATTERNS; k++) fprintf(f, "%s%d", k ? "," : "", weight[k]);
    fprintf(f, "],\n  obstacles: [\n");
    for (o = 0; o < 3; o++) {
        if (o == 0) loadFlood(); else if (o == 1) loadNormal(); else loadHard();
        srand(2024 + o); r0 = rate(0, obsBudget[o]);
        srand(2024 + o); r1 = rate(1, obsBudget[o]);
        srand(2024 + o); r2 = rate(2, obsBudget[o]);
        printf("%-18s budget %3d  catch %%: untrained %.0f, 20 rounds %.0f, 200 rounds %.0f\n",
               obsName[o], obsBudget[o], r0, r1, r2);
        fprintf(f, "    {name:\"%s\", task:\"%s\", budget:%d,\n      rate:[%.0f,%.0f,%.0f],\n      kmp:[",
                obsName[o], obsTask[o], obsBudget[o], r0, r1, r2);
        writeSamples(f);
        fprintf(f, "] }%s\n", o < 2 ? "," : "");
    }
    fprintf(f, "  ]\n};\n");
    fclose(f);
    printf("Wrote ../frontend/data.js\n");
    return 0;
}