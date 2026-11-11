var BACKEND = {
  problem: {title:"Real-time threat detection in a noisy, decoy-filled log stream under a strict comparison budget",
    text:"A monitoring system watches 8 known threat signatures (hardware faults such as OVERHEAT and cyber attacks such as DROP TABLE). Each log line has 150 characters, hides one real threat, and is flooded with near-match decoys. The system may arm only 3 patterns per line and may spend only 400 character comparisons (250 on tight lines). The AI agent must learn which patterns to search first so that KMP finds the threat before the budget runs out, and it must keep replaying the hard cases it missed until it stops missing them.",
    why:"KMP searches one pattern at a time, so many patterns mean many scans. Pattern matching is the bottleneck of intrusion detection (reported as over 70 percent of running time in one study), Aho-Corasick needs large data structures, and KMP is competitive on small rule sets and small hardware. Choosing what to search first is the hard part, and that is what the agent is trained on."},
  refs: [
    {t:"Knuth, Morris, Pratt (1977). Fast Pattern Matching in Strings. SIAM Journal on Computing 6(2), 323-350.", u:"https://doi.org/10.1137/0206024"},
    {t:"Baker, Prasanna (2005). A computationally efficient engine for flexible intrusion detection. IEEE Trans. VLSI 13(10).", u:"https://manuscript.isc.ac/Inventory/49/763208.htm"},
    {t:"Chalmers University of Technology. Fixed-string multiple pattern matching for intrusion detection (research paper).", u:"https://research.chalmers.se/publication/514052/file/514052_Fulltext.pdf"},
    {t:"A lightweight portable intrusion detection communication system for auditing applications (KMP vs Aho-Corasick on Raspberry Pi).", u:"https://peeref.com/works/19692442"},
    {t:"Kwok, Kwok. Design and Evaluation of Parallel String Matching Algorithms for Network Intrusion Detection Systems.", u:"https://dl.ifip.org/index.html/db/conf/npc/npc2007/KwokK07.pdf"},
    {t:"Kaelbling, Littman, Moore (1996). Reinforcement Learning: A Survey.", u:"https://arxiv.org/pdf/cs/9605103"},
    {t:"GrepSeek: Training Search Agents for Direct Corpus Interaction (arXiv, 2026).", u:"https://arxiv.org/pdf/2605.29307"}
  ],
  patterns: ["DISK_ERR","RM_RF","AAAAAAAAAB","SYN_SYN_SYN_X","DROP TABLE","VOLT_DROP","FAN_FAIL","OVERHEAT"],
  weights: [4,2,6,8,10,15,25,30],
  obstacles: [
    {name:"Decoy Haystack", task:"Find the real threat in a log flooded with near-match decoys, using at most 400 comparisons.", budget:400,
      rate:[23,36,57],
      kmp:[142,167,148,127,156,135,111,110,115,143,124,109,114,106,137,113,126,121,119,167,152,143,214,154,141,103,111,117,99,117,120,98,160,131,134,128,165,126,150,110] },
    {name:"Comparison Budget", task:"Find the threat in a noisy log with a tight budget of 250 comparisons. Search order matters.", budget:250,
      rate:[22,29,46],
      kmp:[81,133,58,31,77,123,125,137,150,76,63,109,61,20,57,82,95,85,127,40,86,132,16,76,36,103,61,104,84,112,95,133,42,58,156,14,24,105,119,30] },
    {name:"Hard-Case Replay", task:"Catch threats an untrained agent missed earlier. Hard logs come back until they are caught.", budget:400,
      rate:[33,57,64],
      kmp:[81,133,58,77,123,125,150,63,109,61,57,95,40,132,16,76,36,103,61,112,95,133,42,156,14,119,30,60,90,96,113,107,55,54,28,14,98,117,56,33] }
  ]
};
