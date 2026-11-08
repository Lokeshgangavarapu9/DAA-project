/* problem.h - the problem statement lives in C, and the backend exports it to the frontend. */

char problemTitle[] = "Real-time threat detection in a noisy, decoy-filled log stream under a strict comparison budget";

char problemText[] =
    "A monitoring system watches 8 known threat signatures (hardware faults such as OVERHEAT and cyber attacks "
    "such as DROP TABLE). Each log line has 150 characters, hides one real threat, and is flooded with near-match "
    "decoys. The system may arm only 3 patterns per line and may spend only 400 character comparisons (250 on "
    "tight lines). The AI agent must learn which patterns to search first so that KMP finds the threat before "
    "the budget runs out, and it must keep replaying the hard cases it missed until it stops missing them.";

char problemWhy[] =
    "KMP searches one pattern at a time, so many patterns mean many scans. Pattern matching is the bottleneck of "
    "intrusion detection (reported as over 70 percent of running time in one study), Aho-Corasick needs large "
    "data structures, and KMP is competitive on small rule sets and small hardware. Choosing what to search "
    "first is the hard part, and that is what the agent is trained on.";

#define REFS 7

char refTitle[REFS][200] = {
    "Knuth, Morris, Pratt (1977). Fast Pattern Matching in Strings. SIAM Journal on Computing 6(2), 323-350.",
    "Baker, Prasanna (2005). A computationally efficient engine for flexible intrusion detection. IEEE Trans. VLSI 13(10).",
    "Chalmers University of Technology. Fixed-string multiple pattern matching for intrusion detection (research paper).",
    "A lightweight portable intrusion detection communication system for auditing applications (KMP vs Aho-Corasick on Raspberry Pi).",
    "Kwok, Kwok. Design and Evaluation of Parallel String Matching Algorithms for Network Intrusion Detection Systems.",
    "Kaelbling, Littman, Moore (1996). Reinforcement Learning: A Survey.",
    "GrepSeek: Training Search Agents for Direct Corpus Interaction (arXiv, 2026)."
};

char refUrl[REFS][120] = {
    "https://doi.org/10.1137/0206024",
    "https://manuscript.isc.ac/Inventory/49/763208.htm",
    "https://research.chalmers.se/publication/514052/file/514052_Fulltext.pdf",
    "https://peeref.com/works/19692442",
    "https://dl.ifip.org/index.html/db/conf/npc/npc2007/KwokK07.pdf",
    "https://arxiv.org/pdf/cs/9605103",
    "https://arxiv.org/pdf/2605.29307"
};
