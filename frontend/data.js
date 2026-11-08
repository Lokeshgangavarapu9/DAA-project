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
      rate:[28,56,56], naiveRate:42,
      kmp:[108,141,133,128,103,143,131,159,115,123,144,131,202,98,159,121,167,104,162,108,137,149,146,151,140,140,143,153,109,116,109,103,139,128,246,163,176,125,170,111],
      naive:[182,409,397,218,175,275,222,307,325,236,249,222,970,168,307,345,323,176,276,317,238,254,282,291,241,238,212,461,184,196,210,176,242,246,1190,278,840,215,330,188]},
    {name:"Comparison Budget", task:"Find the threat in a noisy log with a tight budget of 250 comparisons. Search order matters.", budget:250,
      rate:[20,40,40], naiveRate:39,
      kmp:[117,104,149,123,28,109,61,102,46,18,133,35,125,80,88,114,148,141,94,103,98,20,118,130,94,26,27,144,9,157,121,23,89,26,117,149,74,132,144,32],
      naive:[125,104,173,123,28,109,61,103,46,18,140,35,125,82,88,114,148,147,94,126,103,20,134,130,101,26,27,144,9,163,121,23,89,26,133,155,74,132,144,32]},
    {name:"Hard-Case Replay", task:"Catch threats an untrained agent missed earlier. Hard logs come back until they are caught.", budget:400,
      rate:[30,54,54], naiveRate:56,
      kmp:[117,149,28,109,61,46,18,133,125,80,88,114,148,141,103,98,20,118,130,94,27,144,9,157,23,89,26,117,149,74,132,144,32,90,59,36,123,98,75,123],
      naive:[125,173,28,109,61,46,18,140,125,82,88,114,148,147,126,103,20,134,130,101,27,144,9,163,23,89,26,133,155,74,132,144,32,90,59,36,123,99,75,123]}
  ]
};
