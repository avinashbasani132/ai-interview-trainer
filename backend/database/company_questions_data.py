"""
company_questions_data.py
=========================
Comprehensive, structured repository of online-researched interview questions for all 33 major tech companies:
- 15 Product MNCs: Google, Microsoft, Amazon, Apple, Meta, Netflix, Adobe, Oracle, IBM, Intel, Cisco, NVIDIA, Salesforce, SAP, Tesla
- 10 Service MNCs: Infosys, TCS, Wipro, Accenture, Capgemini, Cognizant, Deloitte, HCL, Tech Mahindra, LTIMindtree
- 8 Tech Startups: Zoho, Freshworks, Flipkart, PhonePe, Paytm, Swiggy, Zomato, Razorpay

Each company contains structured questions across all 5 recruitment rounds:
1. Aptitude (Quantitative, Logical, Verbal with MCQ options)
2. Technical MCQ (Company-specific tech stack, CS fundamentals, OS, DBMS, Concurrency)
3. Coding (DSA problem statement, constraints, example input/output)
4. Technical AI (System Design, Scalability, Core Engineering concepts)
5. HR / Behavioral (Company values, Leadership principles, Team dynamics)
"""

COMPANY_QUESTIONS_DATA = {
    # ==========================================
    # 1. PRODUCT GIANTS (15 Companies)
    # ==========================================
    "Google": {
        "Aptitude": [
            {
                "topic": "Probability & Combinatorics",
                "question_text": "In Google Data Centers, a server cluster has a 0.02 failure rate per day. What is the probability that exactly 2 out of 100 independent servers fail on a given day (using Poisson approximation with lambda = 2)?",
                "option_a": "0.135",
                "option_b": "0.271",
                "option_c": "0.180",
                "option_d": "0.324",
                "correct_option": "B"
            },
            {
                "topic": "Algorithm Complexity",
                "question_text": "If an algorithm runs in T(n) = 2T(n/2) + O(n log n), what is its asymptotic upper bound according to the Master Theorem?",
                "option_a": "O(n log n)",
                "option_b": "O(n log^2 n)",
                "option_c": "O(n^2)",
                "option_d": "O(n)",
                "correct_option": "B"
            },
            {
                "topic": "Graph & Network Flow",
                "question_text": "In a Google network flow graph with source s and sink t, if the capacity of minimum s-t cut is 45 Gbps, what is the maximum feasible data flow rate according to the Max-Flow Min-Cut Theorem?",
                "option_a": "30 Gbps",
                "option_b": "45 Gbps",
                "option_c": "90 Gbps",
                "option_d": "Infinite",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Distributed Systems & Concurrency",
                "question_text": "How does Google Spanner achieve external consistency (strict serializability) across globally distributed datacenters without continuous distributed 2PC locking?",
                "option_a": "Using Raft consensus exclusively with NTP clocks",
                "option_b": "Using TrueTime API with GPS receivers and atomic clocks to bound clock uncertainty",
                "option_c": "By assigning all write transactions to a single leader datacenter",
                "option_d": "By relying on eventual consistency with vector clocks",
                "correct_option": "B"
            },
            {
                "topic": "Operating Systems & Memory",
                "question_text": "Which page replacement algorithm is immune to Belady's Anomaly?",
                "option_a": "FIFO (First In First Out)",
                "option_b": "LRU (Least Recently Used)",
                "option_c": "Second Chance Algorithm",
                "option_d": "Random Page Replacement",
                "correct_option": "B"
            },
            {
                "topic": "Compilers & Virtual Machines",
                "question_text": "In Google V8 JavaScript Engine, what is the role of the Ignition interpreter and TurboFan compiler pipeline?",
                "option_a": "Ignition compiles JS directly to WebAssembly; TurboFan runs the garbage collector",
                "option_b": "Ignition generates efficient bytecode quickly with low startup time; TurboFan optimizes hot functions into machine code using runtime feedback",
                "option_c": "TurboFan compiles all code ahead-of-time (AOT) before browser launch",
                "option_d": "Ignition executes AST tree directly without bytecode",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Median of Two Sorted Arrays",
                "topic": "Binary Search / Arrays",
                "difficulty": "Hard",
                "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log(min(m,n))) runtime complexity.",
                "example_input": "nums1 = [1,3], nums2 = [2]",
                "example_output": "2.0"
            }
        ],
        "Technical AI": [
            {
                "topic": "System Design & Scalability",
                "question_text": "Design a globally distributed URL shortener service (like Google URL Shortener / bit.ly) handling 500 million new URLs per month and 100:1 read-to-write ratio. How do you design the key generation service, avoid hash collisions, and ensure sub-10ms read latency globally?",
                "expected_answer": "Discuss Base62 encoding, pre-generated unique token keys via Zookeeper or distributed counter ranges, multi-tier caching with Redis/Memcached, CDN edge locations, and database partitioning by hash key."
            }
        ],
        "HR": [
            {
                "question_text": "Tell me about a time you encountered ambiguity in a technical project where requirements were vague or conflicting. How did you navigate this 'Googliness' aspect of autonomous problem solving?",
                "evaluation_criteria": "Assesses comfort with ambiguity, structured stakeholder communication, intellectual humility, and data-driven execution."
            }
        ]
    },

    "Microsoft": {
        "Aptitude": [
            {
                "topic": "Permutations & Graph Logic",
                "question_text": "In Azure Virtual Network routing, 7 nodes are connected such that every node connects to at least 4 other nodes. Does there always exist a Hamiltonian Path in this graph?",
                "option_a": "Always Yes (Dirac's Theorem)",
                "option_b": "Never",
                "option_c": "Only if graph is bipartite",
                "option_d": "Depends on initial node weight",
                "correct_option": "A"
            },
            {
                "topic": "Time & Rate",
                "question_text": "Pipeline A processes 10,000 Azure telemetry events in 15 minutes, Pipeline B in 20 minutes, and Pipeline C in 30 minutes. If all three run in parallel, how long will it take to process 10,000 events?",
                "option_a": "6.67 minutes",
                "option_b": "5.00 minutes",
                "option_c": "8.25 minutes",
                "option_d": "7.50 minutes",
                "correct_option": "A"
            },
            {
                "topic": "Probability Distribution",
                "question_text": "An Azure virtual machine SLA offers 99.9% uptime. For a cluster of 3 independent VMs running a critical workload where at least 1 must stay alive, what is the downtime probability?",
                "option_a": "1 in 1,000",
                "option_b": "1 in 1,000,000",
                "option_c": "1 in 1,000,000,000",
                "option_d": "3 in 1,000",
                "correct_option": "C"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "OOP & .NET / C# Architecture",
                "question_text": "In C# / .NET memory management, what is the key difference between the Large Object Heap (LOH) and Generation 0/1/2 heaps?",
                "option_a": "LOH is allocated on the stack rather than unmanaged memory",
                "option_b": "LOH handles objects > 85,000 bytes and is not compacted by default to avoid heavy memory copies",
                "option_c": "LOH is garbage collected every second regardless of generation thresholds",
                "option_d": "LOH only stores value types (structs)",
                "correct_option": "B"
            },
            {
                "topic": "Database Indexing",
                "question_text": "In SQL Server / Azure SQL, what is the primary structural difference between a Clustered Index and a Non-Clustered Index?",
                "option_a": "A clustered index stores data physically sorted at leaf nodes; non-clustered leaf nodes contain row locators/pointers",
                "option_b": "You can have up to 249 clustered indexes per table",
                "option_c": "Non-clustered indexes do not use B-Trees",
                "option_d": "Clustered indexes cannot be defined on primary keys",
                "correct_option": "A"
            },
            {
                "topic": "Operating Systems & Synchronization",
                "question_text": "In Windows OS kernel architecture, what is the difference between a Fast Mutex and a standard Executive Resource (ERESOURCE)?",
                "option_a": "Fast Mutex supports multiple concurrent readers and exclusive writers",
                "option_b": "Fast Mutex is strictly mutually exclusive with low overhead; ERESOURCE supports shared reader / exclusive writer synchronization",
                "option_c": "ERESOURCE cannot run in kernel mode",
                "option_d": "Fast Mutex disables hardware interrupts permanently",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Lowest Common Ancestor in Binary Tree",
                "topic": "Trees & Recursion",
                "difficulty": "Medium",
                "description": "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q. The LCA is defined between two nodes p and q as the lowest node in T that has both p and q as descendants.",
                "example_input": "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1",
                "example_output": "3"
            }
        ],
        "Technical AI": [
            {
                "topic": "Cloud & Distributed Messaging",
                "question_text": "Explain how you would design a reliable asynchronous message processing pipeline using Azure Service Bus or Kafka. How do you handle dead-letter queues, idempotent consumer processing, and transient network partitions?",
                "expected_answer": "Covers at-least-once vs exactly-once delivery semantics, deduplication IDs, correlation filters, backoff retries with dead-letter queue routing, and circuit breaker patterns."
            }
        ],
        "HR": [
            {
                "question_text": "Microsoft values a Growth Mindset where failure is viewed as a learning opportunity. Describe a project or technical initiative of yours that did not go as planned. What did you learn and how did you adapt?",
                "evaluation_criteria": "Evaluates growth mindset, self-awareness, accountability, and resilience."
            }
        ]
    },

    "Amazon": {
        "Aptitude": [
            {
                "topic": "Cost Optimization & Profit Analysis",
                "question_text": "An Amazon Fulfillment Center processes orders with fixed storage cost $400/day and variable pick-pack cost $1.50 per unit. If price charged per fulfillment is $3.50, what is the minimum unit volume required daily to break even?",
                "option_a": "150 units",
                "option_b": "200 units",
                "option_c": "250 units",
                "option_d": "300 units",
                "correct_option": "B"
            },
            {
                "topic": "Logistics Permutation",
                "question_text": "A delivery driver must visit 5 distinct hubs in a city. If Hub 1 must always be visited before Hub 5, how many valid visiting sequences are possible?",
                "option_a": "60",
                "option_b": "120",
                "option_c": "24",
                "option_d": "48",
                "correct_option": "A"
            },
            {
                "topic": "Inventory Turnover",
                "question_text": "Amazon warehouse turns over $1,200,000 worth of stock annually with an average monthly inventory valuation of $100,000. What is the annual inventory turnover ratio?",
                "option_a": "6",
                "option_b": "12",
                "option_c": "15",
                "option_d": "24",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Microservices & Distributed Design",
                "question_text": "In Amazon DynamoDB, which partitioning key design best prevents 'hot partition' throttling under high-frequency writes?",
                "option_a": "Using a low-cardinality partition key like countryCode ('US')",
                "option_b": "Adding a randomized or calculated salt suffix to the partition key (e.g. orderId_1...orderId_N)",
                "option_c": "Disabling Global Secondary Indexes (GSIs)",
                "option_d": "Using monotonically increasing timestamps as partition keys",
                "correct_option": "B"
            },
            {
                "topic": "Object-Oriented Design Principles",
                "question_text": "Which SOLID design principle is violated when a subclass throws 'NotSupportedException' for methods inherited from its base interface?",
                "option_a": "Single Responsibility Principle",
                "option_b": "Liskov Substitution Principle",
                "option_c": "Open-Closed Principle",
                "option_d": "Dependency Inversion Principle",
                "correct_option": "B"
            },
            {
                "topic": "Cloud Storage & Consistency",
                "question_text": "What data consistency model does Amazon S3 guarantee for PUT and DELETE requests of objects across all regions?",
                "option_a": "Eventual consistency with 15-minute convergence",
                "option_b": "Strong read-after-write consistency",
                "option_c": "Causal consistency only",
                "option_d": "Read uncommitted",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Course Schedule (Cycle Detection in Directed Graph)",
                "topic": "Graphs & Topological Sort",
                "difficulty": "Medium",
                "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take bi first if you want to take ai. Return true if you can finish all courses, otherwise false.",
                "example_input": "numCourses = 2, prerequisites = [[1,0]]",
                "example_output": "true"
            }
        ],
        "Technical AI": [
            {
                "topic": "High-Throughput E-Commerce Architecture",
                "question_text": "Design Amazon's Flash Sale / Lightning Deal checkout system. When 100,000 users attempt to purchase 500 inventory units simultaneously within 2 seconds, how do you prevent overselling while keeping response latencies under 50ms without database row locking bottlenecks?",
                "expected_answer": "Utilize in-memory Redis atomic operations (`DECR` with Lua scripts), queue-based token buckets, rate limiters, optimistic locking with DynamoDB conditional writes, and decoupled order processing via SQS/Kafka."
            }
        ],
        "HR": [
            {
                "question_text": "Give an example of a time when you had to make a high-stakes decision without complete data to deliver results quickly. How does this demonstrate 'Bias for Action' and 'Customer Obsession'?",
                "evaluation_criteria": "Evaluates Amazon Leadership Principles (Bias for Action, Customer Obsession, Ownership, Are Right A Lot) using the STAR framework."
            }
        ]
    },

    "Apple": {
        "Aptitude": [
            {
                "topic": "Hardware & Data Rates",
                "question_text": "An Apple Silicon M-series chip memory bus transfers data over a 256-bit bus at 6400 MT/s (MegaTransfers/sec). What is the peak theoretical unified memory bandwidth in GB/s?",
                "option_a": "102.4 GB/s",
                "option_b": "204.8 GB/s",
                "option_c": "409.6 GB/s",
                "option_d": "512.0 GB/s",
                "correct_option": "B"
            },
            {
                "topic": "Binary Sequences",
                "question_text": "How many 8-bit binary strings contain at least three consecutive 1s?",
                "option_a": "107",
                "option_b": "118",
                "option_c": "128",
                "option_d": "144",
                "correct_option": "A"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Systems & Concurrency (GCD/C++)",
                "question_text": "In macOS / iOS Grand Central Dispatch (GCD), what condition produces an immediate dispatch deadlock?",
                "option_a": "Calling dispatch_async on a concurrent queue",
                "option_b": "Calling dispatch_sync on the current serial queue from within the same serial queue",
                "option_c": "Creating more than 64 dispatch queues",
                "option_d": "Using dispatch_semaphore with value 1",
                "correct_option": "B"
            },
            {
                "topic": "Memory Management & ARC",
                "question_text": "In Swift / Objective-C Automatic Reference Counting (ARC), how does an 'unowned' reference differ from a 'weak' reference?",
                "option_a": "'weak' references do not become nil when deallocated",
                "option_b": "'unowned' assumes the referenced object is never nil during access and does not use optional wrapping",
                "option_c": "'unowned' increases the retain count by 1",
                "option_d": "'weak' references can only point to structs",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "LRU Cache Implementation",
                "topic": "Hash Table / Doubly Linked List",
                "difficulty": "Medium",
                "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get(key) and put(key, value) operations in O(1) time complexity.",
                "example_input": "LRUCache cache = new LRUCache(2); cache.put(1, 1); cache.put(2, 2); cache.get(1); cache.put(3, 3); cache.get(2);",
                "example_output": "[null, null, null, 1, null, -1]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Client-Server Sync & Privacy",
                "question_text": "Design an end-to-end encrypted push notification and device sync protocol for 1 billion Apple devices (e.g. iCloud Keychain sync). How do you handle multi-device key agreement, off-line message buffering, and zero-knowledge storage?",
                "expected_answer": "Covers Signal protocol / Double Ratchet key exchange, secure enclave hardware keys, APNS batching, push-to-sync triggers, and end-to-end cryptographic verification."
            }
        ],
        "HR": [
            {
                "question_text": "Apple is known for unmatched attention to detail and uncompromising quality. Describe a project where you refused to take shortcuts and pushed the quality bar above expectations.",
                "evaluation_criteria": "Examines craftsmanship, technical rigor, cross-functional pride in product, and user-centric empathy."
            }
        ]
    },

    "Meta": {
        "Aptitude": [
            {
                "topic": "Social Graph Analytics",
                "question_text": "In a social network graph of 1,000 users, every user is friends with exactly 6 other users. How many total friendship edges exist in this undirected graph?",
                "option_a": "6,000",
                "option_b": "3,000",
                "option_c": "1,500",
                "option_d": "12,000",
                "correct_option": "B"
            },
            {
                "topic": "Combinatorial Probability",
                "question_text": "If 4 friends randomly choose one of 7 Meta Quest VR games to play simultaneously, what is the probability that all 4 choose completely distinct games?",
                "option_a": "0.350",
                "option_b": "0.499",
                "option_c": "0.583",
                "option_d": "0.714",
                "correct_option": "A"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Frontend Performance & React Internals",
                "question_text": "In React 18 / Fiber Architecture, what is the fundamental advantage of Concurrent Rendering over the legacy Stack Reconciler?",
                "option_a": "It uses direct DOM mutation without Virtual DOM diffing",
                "option_b": "It can pause, resume, and abandon rendering tasks based on priority without blocking the main UI thread",
                "option_c": "It forces all state updates to execute synchronously",
                "option_d": "It replaces JavaScript with WebAssembly for all components",
                "correct_option": "B"
            },
            {
                "topic": "Graph & Cache Architecture",
                "question_text": "Meta's TAO (The Associations and Objects) distributed data store is designed primarily for:",
                "option_a": "Relational OLAP queries across petabyte tables",
                "option_b": "Low-latency reads and writes of graph nodes (objects) and directed edges (associations) across global Memcached clusters",
                "option_c": "Video transcoding queues",
                "option_d": "Cold archiving of static images",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Minimum Remove to Make Valid Parentheses",
                "topic": "String / Stack",
                "difficulty": "Medium",
                "description": "Given a string s of '(' , ')' and lowercase English characters, remove the minimum number of parentheses ( '(' or ')', in any positions ) so that the resulting parentheses string is valid and return any valid string.",
                "example_input": "s = 'lee(t(c)o)de)'",
                "example_output": "'lee(t(c)o)de'"
            }
        ],
        "Technical AI": [
            {
                "topic": "Real-Time Social Feeds",
                "question_text": "Design the Meta News Feed generation and ranking system for 2 billion active users. Compare Push (fan-out on write) vs Pull (fan-out on read) for high-follower celebrities vs regular users, and explain how ranking ML models score posts in real-time.",
                "expected_answer": "Examines hybrid fanout architecture, precomputed feed caches in TAO/Redis, feature extraction stores, two-stage ranking pipeline (candidate generation + deep ranking model), and aggregation."
            }
        ],
        "HR": [
            {
                "question_text": "Meta's core value is 'Move Fast and Build Awesome Things'. Describe a scenario where moving fast required you to balance immediate velocity with long-term software maintainability.",
                "evaluation_criteria": "Evaluates speed vs technical debt management, calculated risk-taking, and continuous delivery."
            }
        ]
    },

    "Netflix": {
        "Aptitude": [
            {
                "topic": "Bandwidth & Video Compression",
                "question_text": "A 4K HDR stream requires 25 Mbps bandwidth. If a CDN node has a 100 Gbps egress uplink running at 80% safe capacity limit, what is the maximum number of concurrent 4K streams it can serve?",
                "option_a": "2,400",
                "option_b": "3,200",
                "option_c": "4,000",
                "option_d": "5,000",
                "correct_option": "B"
            },
            {
                "topic": "Cache Eviction Math",
                "question_text": "A Netflix CDN cache has a 92% hit ratio. If cache lookups take 2ms and origin fetches take 80ms, what is the effective average request latency?",
                "option_a": "6.24 ms",
                "option_b": "8.24 ms",
                "option_c": "10.15 ms",
                "option_d": "12.00 ms",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Fault Tolerance & Microservices",
                "question_text": "What is the primary role of Netflix's Chaos Monkey / Chaos Engineering principle in a production cloud environment?",
                "option_a": "To run automated unit tests before Git commits",
                "option_b": "To randomly terminate production instances and inject network failures to verify automated recovery and resilience",
                "option_c": "To encrypt video assets using rotating symmetric keys",
                "option_d": "To auto-scale clusters when CPU exceeds 90%",
                "correct_option": "B"
            },
            {
                "topic": "Resilience & Circuit Breakers",
                "question_text": "In Netflix Hystrix / Resilience4j architecture, when a downstream microservice failure rate exceeds 50%, what does the Circuit Breaker transition to?",
                "option_a": "CLOSED (Normal traffic execution)",
                "option_b": "OPEN (Short-circuits calls immediately without invoking downstream)",
                "option_c": "HALF-OPEN (Permits all traffic with logging)",
                "option_d": "TERMINATED",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Sliding Window Maximum",
                "topic": "Monotonic Deque",
                "difficulty": "Hard",
                "description": "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Return the max sliding window in O(N) time.",
                "example_input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
                "example_output": "[3,3,5,5,6,7]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Video Streaming & Adaptive Bitrate",
                "question_text": "Design Netflix's Open Connect CDN and Dynamic Adaptive Streaming over HTTP (DASH) pipeline. How does the player dynamically adapt resolution during network congestion without rebuffering?",
                "expected_answer": "Explains video chunking (2-4 second segments), manifest files, ABR algorithms (buffer-based vs throughput-based), edge CDN caching, and TLS termination."
            }
        ],
        "HR": [
            {
                "question_text": "Netflix's culture emphasizes 'Freedom and Responsibility' and 'Context, Not Control'. How do you make critical engineering decisions independently while remaining transparent with team peers?",
                "evaluation_criteria": "Tests high autonomy, radical candor, accountability, and alignment with high-performance culture."
            }
        ]
    },

    "Adobe": {
        "Aptitude": [
            {
                "topic": "Geometry & Pixel Transformation",
                "question_text": "An image with resolution 3840 x 2160 is downsampled by a factor of 2 along both dimensions and encoded with 24-bit RGB color depth. What is the uncompressed frame size in MegaBytes (MB)?",
                "option_a": "4.94 MB",
                "option_b": "5.93 MB",
                "option_c": "6.22 MB",
                "option_d": "7.41 MB",
                "correct_option": "B"
            },
            {
                "topic": "Vector Geometry",
                "question_text": "Two 2D Bézier curve control points P0(0,0), P1(2,4), P2(4,0) define a quadratic curve. What is the coordinate of the curve at parameter t = 0.5?",
                "option_a": "(2, 1)",
                "option_b": "(2, 2)",
                "option_c": "(2, 3)",
                "option_d": "(1.5, 2)",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Computer Graphics & Data Structures",
                "question_text": "Which spatial data structure is most efficient for ray tracing bounding volume hierarchies and 2D vector path clipping in graphic software?",
                "option_a": "B+ Tree",
                "option_b": "BVH / Quadtree / KD-Tree",
                "option_c": "Splay Tree",
                "option_d": "Disjoint Set Union",
                "correct_option": "B"
            },
            {
                "topic": "Document Object Models & PDF",
                "question_text": "In PostScript / PDF rendering pipelines, what rasterization technique calculates pixel coverage to eliminate jagged edges on diagonal vector lines?",
                "option_a": "Subpixel Anti-Aliasing & Supersampling (SSAA)",
                "option_b": "Nearest Neighbor interpolation",
                "option_c": "Floyd-Steinberg Dithering",
                "option_d": "Color quantization",
                "correct_option": "A"
            }
        ],
        "Coding": [
            {
                "title": "Word Search II",
                "topic": "Trie & Backtracking",
                "difficulty": "Hard",
                "description": "Given an m x n board of characters and a list of strings words, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells.",
                "example_input": "board = [['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], words = ['oath','pea','eat','rain']",
                "example_output": "['eat','oath']"
            }
        ],
        "Technical AI": [
            {
                "topic": "Collaborative Canvas Architecture",
                "question_text": "Design Adobe Creative Cloud's real-time collaborative document editing engine (like Figma or Photoshop Web). How do Operational Transformation (OT) or CRDTs resolve concurrent modifications on vector layer trees?",
                "expected_answer": "Addresses state synchronization, tree-based CRDTs, undo/redo stacks in collaborative settings, WebGL/WebGPU rendering pipeline, and WebSockets."
            }
        ],
        "HR": [
            {
                "question_text": "Adobe values creativity and genuine customer empathy. Describe how your work has directly elevated end-user experience and design aesthetics.",
                "evaluation_criteria": "Tests product sensibility, attention to UX fidelity, and customer collaboration."
            }
        ]
    },

    "NVIDIA": {
        "Aptitude": [
            {
                "topic": "Parallel Computation & FLOPS",
                "question_text": "A GPU streaming multiprocessor has 128 FP32 cores operating at a base clock of 1.5 GHz. What is its theoretical peak compute performance in TFLOPS (assuming 2 operations per FMA instruction per clock)?",
                "option_a": "0.192 TFLOPS",
                "option_b": "0.384 TFLOPS",
                "option_c": "0.768 TFLOPS",
                "option_d": "1.536 TFLOPS",
                "correct_option": "B"
            },
            {
                "topic": "Memory Bus Bandwidth",
                "question_text": "An H100 GPU uses 80GB HBM3 memory with a 5120-bit bus clocked at 3.2 Gbps effective. What is the peak theoretical memory bandwidth?",
                "option_a": "1.02 TB/s",
                "option_b": "2.04 TB/s",
                "option_c": "3.35 TB/s",
                "option_d": "4.00 TB/s",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "CUDA & Parallel Architecture",
                "question_text": "In NVIDIA CUDA programming, what causes 'warp divergence' on SIMT (Single Instruction, Multiple Threads) architectures?",
                "option_a": "Threads within the same 32-thread warp taking different execution paths in conditional branch statements (if/else)",
                "option_b": "Accessing global memory via unified memory pointers",
                "option_c": "Using atomic operations on shared memory",
                "option_d": "Exceeding register memory allocation limits",
                "correct_option": "A"
            },
            {
                "topic": "GPU Shared Memory Architecture",
                "question_text": "In CUDA shared memory, what is a 'bank conflict'?",
                "option_a": "Multiple threads accessing different memory banks simultaneously",
                "option_b": "Multiple threads in the same warp requesting different 32-bit words that map to the exact same shared memory bank, forcing serialized access",
                "option_c": "Overflowing global GPU DRAM buffer",
                "option_d": "Running out of PCIe lanes",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Trapping Rain Water",
                "topic": "Two Pointers / Monotonic Stack",
                "difficulty": "Hard",
                "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
                "example_input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
                "example_output": "6"
            }
        ],
        "Technical AI": [
            {
                "topic": "GPU Accelerated Inference Pipeline",
                "question_text": "Design a low-latency LLM serving engine using TensorRT-LLM and vLLM. How do PagedAttention, KV-cache quantization (FP8/INT4), and continuous batching maximize GPU memory bandwidth utilization?",
                "expected_answer": "Explains memory fragmentation issues with KV cache, continuous batching iteration scheduling, kernel fusion via CUDA, and multi-GPU tensor parallelism (NCCL)."
            }
        ],
        "HR": [
            {
                "question_text": "NVIDIA is at the forefront of AI innovation where speed of execution and technical perfection are paramount. Tell me about a time you optimized a system or algorithm to achieve 10x or greater performance gains.",
                "evaluation_criteria": "Examines performance mindset, deep hardware-software synergy, and perseverance."
            }
        ]
    },

    "Tesla": {
        "Aptitude": [
            {
                "topic": "Kinematics & Sensor Timing",
                "question_text": "A vehicle traveling at 72 km/h detects an obstacle using cameras running at 30 fps. If sensor perception and actuator brake delay takes 4 frames, how far does the vehicle travel before braking starts?",
                "option_a": "1.33 meters",
                "option_b": "2.67 meters",
                "option_c": "3.50 meters",
                "option_d": "4.00 meters",
                "correct_option": "B"
            },
            {
                "topic": "Battery Energy Math",
                "question_text": "An electric car battery pack holds 75 kWh. If average consumption is 150 Wh/km, what is the maximum theoretical range in kilometers?",
                "option_a": "350 km",
                "option_b": "450 km",
                "option_c": "500 km",
                "option_d": "600 km",
                "correct_option": "C"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Real-Time Embedded Systems",
                "question_text": "In Hard Real-Time embedded OS environments, what is the primary consequence of Priority Inversion?",
                "option_a": "A high-priority task is blocked indefinitely by a low-priority task holding a shared resource when preempted by a medium-priority task",
                "option_b": "Memory allocation fails due to stack overflow",
                "option_c": "The CPU frequency is throttled due to thermals",
                "option_d": "DMA interrupts are dropped",
                "correct_option": "A"
            },
            {
                "topic": "Automotive Networks & CAN Bus",
                "question_text": "How does Controller Area Network (CAN Bus) arbitration resolve simultaneous message transmissions from two ECUs without packet collisions?",
                "option_a": "Using CSMA/CD with exponential backoff",
                "option_b": "Bitwise non-destructive arbitration where dominant '0' bits overwrite recessive '1' bits based on message identifier priority",
                "option_c": "Round-robin token ring passing",
                "option_d": "Central master clock polling",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Meeting Rooms II",
                "topic": "Intervals / Min-Heap",
                "difficulty": "Medium",
                "description": "Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.",
                "example_input": "intervals = [[0,30],[5,10],[15,20]]",
                "example_output": "2"
            }
        ],
        "Technical AI": [
            {
                "topic": "Fleet Telemetry & Over-the-Air Architecture",
                "question_text": "Design the real-time vehicle telemetry ingestion platform for 5 million Tesla vehicles sending sensor logs every 500ms. How do you handle cellular network dropouts, stream processing at scale, and fast edge firmware updates?",
                "expected_answer": "MQTT/gRPC edge gateway, Apache Kafka/Flink stream pipelines, time-series DB (ClickHouse/Timescale), delta OTA packages with cryptographic signing and rollback protection."
            }
        ],
        "HR": [
            {
                "question_text": "Tesla is known for an intense, mission-driven engineering culture. Describe a demanding situation where you had to work under tight constraints to deliver critical features on deadline.",
                "evaluation_criteria": "Assesses first-principles problem solving, grit, urgency, and mission alignment."
            }
        ]
    },

    "Salesforce": {
        "Aptitude": [
            {
                "topic": "Data Cardinality & Joins",
                "question_text": "Table A has 5,000 CRM contacts and Table B has 10,000 Opportunity records. If each contact matches on average 3 opportunities, how many rows will an INNER JOIN query produce?",
                "option_a": "5,000",
                "option_b": "15,000",
                "option_c": "50,000",
                "option_d": "10,000",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Multi-Tenant Cloud Architecture",
                "question_text": "In a shared multi-tenant database architecture (like Salesforce Force.com), how are tenant data isolation and governor limits enforced?",
                "option_a": "By deploying a separate virtual machine per tenant",
                "option_b": "Using metadata-driven shared schemas with universal Tenant_ID filters on all queries and strict per-transaction CPU/query runtime limits",
                "option_c": "By storing all tenant data unindexed in NoSQL documents",
                "option_d": "Through client-side encryption only",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Design Hit Counter",
                "topic": "Queue / Circular Array",
                "difficulty": "Medium",
                "description": "Design a hit counter which counts the number of hits received in the past 5 minutes (300 seconds). Each function should operate in O(1) time.",
                "example_input": "hitCounter.hit(1); hitCounter.hit(2); hitCounter.hit(3); hitCounter.getHits(4); hitCounter.hit(300); hitCounter.getHits(300); hitCounter.getHits(301);",
                "example_output": "[null, null, null, 3, null, 4, 3]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Enterprise Multi-Tenant Event Architecture",
                "question_text": "Design an enterprise platform event bus capable of broadcasting 10 billion change data capture (CDC) events daily with strict ordering per tenant and replay capability up to 72 hours.",
                "expected_answer": "Apache Pulsar/Kafka with tenant topic partitioning, replay offsets, schema registry for schema evolution, and fine-grained role-based access control (RBAC)."
            }
        ],
        "HR": [
            {
                "question_text": "Salesforce champions Trust, Customer Success, and Equality ('Ohana'). Tell me about a time you mentored a peer or fostered inclusivity in an engineering team.",
                "evaluation_criteria": "Tests values alignment, leadership through empathy, and collaboration."
            }
        ]
    },

    "Oracle": {
        "Aptitude": [
            {
                "topic": "Database Transaction Math",
                "question_text": "A database WAL (Write-Ahead Logging) buffer is flushed every 50ms or when reaching 64KB. If incoming write traffic generates 2MB/s of log data, how many flushes occur in 1 second?",
                "option_a": "20 flushes",
                "option_b": "31 flushes",
                "option_c": "50 flushes",
                "option_d": "64 flushes",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Database Internals & Isolation Levels",
                "question_text": "Under the READ COMMITTED isolation level using Multi-Version Concurrency Control (MVCC), which concurrency anomaly is STILL possible?",
                "option_a": "Dirty Read",
                "option_b": "Non-Repeatable Read",
                "option_c": "Dirty Write",
                "option_d": "Cascading Abort",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Validate Binary Search Tree",
                "topic": "Binary Search Tree / Recursion",
                "difficulty": "Medium",
                "description": "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
                "example_input": "root = [2,1,3]",
                "example_output": "true"
            }
        ],
        "Technical AI": [
            {
                "topic": "High-Availability DB Clustering",
                "question_text": "Explain the architecture of Oracle RAC (Real Application Clusters) vs active-passive replication. How does cache fusion enable shared-disk concurrency across multiple database nodes?",
                "expected_answer": "Details shared disk storage, global cache service (GCS), block shipping over high-speed interconnects, and distributed lock management."
            }
        ],
        "HR": [
            {
                "question_text": "Enterprise clients rely on 99.999% uptime for core databases. How do you approach code quality, regression testing, and root-cause analysis when diagnosing production defects?",
                "evaluation_criteria": "Evaluates technical accountability, systematic debugging methodology, and enterprise customer responsibility."
            }
        ]
    },

    "IBM": {
        "Aptitude": [
            {
                "topic": "Logical Sets & Syllogism",
                "question_text": "All Cloud nodes are Linux instances. Some Linux instances run Containers. No Container is unmonitored. Which conclusion is definitively true?",
                "option_a": "All Cloud nodes run Containers",
                "option_b": "Some Linux instances are monitored",
                "option_c": "All Linux instances are Cloud nodes",
                "option_d": "No Cloud node is monitored",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Enterprise Architecture & Hybrid Cloud",
                "question_text": "In Kubernetes / Red Hat OpenShift, what controller ensures a specific pod runs on every eligible node in the cluster?",
                "option_a": "Deployment",
                "option_b": "DaemonSet",
                "option_c": "StatefulSet",
                "option_d": "ReplicaSet",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Number of Islands",
                "topic": "BFS / DFS / Matrix",
                "difficulty": "Medium",
                "description": "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
                "example_input": "grid = [['1','1','0','0','0'],['1','1','0','0','0'],['0','0','1','0','0'],['0','0','0','1','1']]",
                "example_output": "3"
            }
        ],
        "Technical AI": [
            {
                "topic": "Hybrid Cloud Data Modernization",
                "question_text": "Design a hybrid cloud migration pipeline connecting on-premise mainframe systems (z/OS) with Red Hat OpenShift cloud microservices while ensuring zero downtime data synchronization.",
                "expected_answer": "Addresses Change Data Capture (CDC via Debezium/Kafka), API mediation gateways, two-phase commits vs SAGA pattern, and latency mitigation."
            }
        ],
        "HR": [
            {
                "question_text": "IBM values dedication to every client's success and innovation that matters for our company and for the world. Describe a scenario where you translated complex technical concepts to non-technical stakeholders.",
                "evaluation_criteria": "Tests communication clarity, client orientation, and cross-functional leadership."
            }
        ]
    },

    "Intel": {
        "Aptitude": [
            {
                "topic": "Microprocessor Architecture & Pipelining",
                "question_text": "A non-pipelined processor executes an instruction in 5 clock cycles of 2ns each (10ns total). In a 5-stage pipelined version with 2.2ns clock cycle time, what is the speedup factor for 1,000 instructions?",
                "option_a": "3.84x",
                "option_b": "4.52x",
                "option_c": "4.98x",
                "option_d": "5.20x",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Computer Organization & Caching",
                "question_text": "In multi-core CPU architectures, what protocol is standard for maintaining cache coherence between L1/L2 caches?",
                "option_a": "Raft Protocol",
                "option_b": "MESI / MOESI protocol",
                "option_c": "Two-Phase Locking",
                "option_d": "Paxos",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Bitwise AND of Numbers Range",
                "topic": "Bit Manipulation",
                "difficulty": "Medium",
                "description": "Given two integers left and right that represent the range [left, right], return the bitwise AND of all numbers in this range, inclusive.",
                "example_input": "left = 5, right = 7",
                "example_output": "4"
            }
        ],
        "Technical AI": [
            {
                "topic": "Memory Hierarchy & Branch Prediction",
                "question_text": "Explain how modern out-of-order processors use branch prediction (TAGE branch predictor) and speculative execution. What is the root architectural mechanism behind Spectre/Meltdown hardware cache timing vulnerabilities?",
                "expected_answer": "Explains speculative execution transient windows, microarchitectural side channels, cache line timing measurements (Flush+Reload), and hardware mitigations (fence instructions, kernel page table isolation)."
            }
        ],
        "HR": [
            {
                "question_text": "Intel values fearless innovation and extreme discipline. Describe a challenging engineering bottleneck you solved by digging deep into underlying hardware or low-level details.",
                "evaluation_criteria": "Evaluates analytical depth, root-cause methodology, and discipline."
            }
        ]
    },

    "Cisco": {
        "Aptitude": [
            {
                "topic": "Networking Subnetting & CIDR",
                "question_text": "How many usable host IP addresses are available in the subnet 192.168.10.0/27?",
                "option_a": "28",
                "option_b": "30",
                "option_c": "32",
                "option_d": "62",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Networking Protocols & TCP/IP",
                "question_text": "In the TCP congestion control state machine, what event causes TCP Reno to drop ssthresh (slow start threshold) to half the current Congestion Window (cwnd) and reset cwnd to 1 MSS?",
                "option_a": "Receiving 3 duplicate ACKs",
                "option_b": "Retransmission Timeout (RTO)",
                "option_c": "Receiving a SYN-ACK packet",
                "option_d": "Closing the socket via FIN",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Network Delay Time (Dijkstra's Algorithm)",
                "topic": "Graph / Shortest Path",
                "difficulty": "Medium",
                "description": "You are given a network of n nodes labeled from 1 to n. You are also given times, a list of travel times as directed edges times[i] = (ui, vi, wi). Return the minimum time it takes for all n nodes to receive a signal sent from node k.",
                "example_input": "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",
                "example_output": "2"
            }
        ],
        "Technical AI": [
            {
                "topic": "Software-Defined Networking (SDN)",
                "question_text": "Design the control plane and data plane architecture for a high-performance Software-Defined WAN (SD-WAN). How does OpenFlow / P4 enable programmable packet forwarding at 100 Gbps line rate?",
                "expected_answer": "Separation of control/data planes, TCAM hardware lookup tables, BGP EVPN routing, QoS traffic steering based on jitter/packet loss, and zero-trust tunneling."
            }
        ],
        "HR": [
            {
                "question_text": "Cisco is connecting everyone and everything securely. Tell me about a time you handled a high-pressure network outage or mission-critical incident under tight SLA deadlines.",
                "evaluation_criteria": "Tests crisis management, calm under pressure, collaboration, and post-mortem ownership."
            }
        ]
    },

    "SAP": {
        "Aptitude": [
            {
                "topic": "Enterprise Resource Planning Math",
                "question_text": "An ERP manufacturing run consumes 300 units of Raw Material A and 150 units of B per batch. If available inventory has 2,400 units of A and 1,050 units of B, what is the maximum number of full batches that can be produced?",
                "option_a": "6 batches",
                "option_b": "7 batches",
                "option_c": "8 batches",
                "option_d": "9 batches",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "In-Memory Databases (SAP HANA)",
                "question_text": "What is the primary performance reason SAP HANA uses Columnar Storage rather than Row-oriented storage for enterprise OLAP aggregations?",
                "option_a": "It completely eliminates the need for primary keys",
                "option_b": "It allows reading only required columns into CPU cache and enables high data compression ratios via dictionary encoding",
                "option_c": "It stores data directly on magnetic tape",
                "option_d": "It runs without transactional ACID guarantees",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Group Anagrams",
                "topic": "Hash Map / String",
                "difficulty": "Medium",
                "description": "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
                "example_input": "strs = ['eat','tea','tan','ate','nat','bat']",
                "example_output": "[['bat'],['nat','tan'],['ate','eat','tea']]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Global Supply Chain Transaction Pipeline",
                "question_text": "Design an in-memory transactional processing engine for global supply chain order fulfillment capable of processing 50,000 ACID transactions per second with instant analytical reporting.",
                "expected_answer": "Columnar in-memory structures, MVCC with delta merge mechanisms, write-optimized L1/L2 deltas, distributed snapshot isolation, and disaster recovery replication."
            }
        ],
        "HR": [
            {
                "question_text": "SAP drives digital transformation for the world's largest enterprises. Describe how you ensure backward compatibility and seamless integration when updating mission-critical systems.",
                "evaluation_criteria": "Tests thoroughness, stakeholder empathy, risk management, and enterprise delivery standards."
            }
        ]
    },

    # ==========================================
    # 2. SERVICE GIANTS (10 Companies)
    # ==========================================
    "TCS": {
        "Aptitude": [
            {
                "topic": "Time, Speed & Distance",
                "question_text": "A train running at 54 km/hr crosses an electric pole in 12 seconds and a platform in 28 seconds. What is the length of the platform?",
                "option_a": "200 meters",
                "option_b": "240 meters",
                "option_c": "280 meters",
                "option_d": "320 meters",
                "correct_option": "B"
            },
            {
                "topic": "Averages & Mixtures",
                "question_text": "In an IT company, the average salary of all 500 employees is Rs. 45,000. If the average salary of 100 managers is Rs. 85,000, what is the average salary of the remaining engineers?",
                "option_a": "Rs. 32,000",
                "option_b": "Rs. 35,000",
                "option_c": "Rs. 38,000",
                "option_d": "Rs. 40,000",
                "correct_option": "B"
            },
            {
                "topic": "Permutation & Combination (NQT Hotspot)",
                "question_text": "In how many ways can the letters of the word 'LEADER' be arranged such that the vowels always appear together?",
                "option_a": "72",
                "option_b": "108",
                "option_c": "144",
                "option_d": "216",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Java Fundamentals & JVM",
                "question_text": "In Java, what is the key difference between String, StringBuffer, and StringBuilder?",
                "option_a": "String is mutable, StringBuffer is immutable, StringBuilder is thread-safe",
                "option_b": "String is immutable, StringBuffer is thread-safe (synchronized), StringBuilder is non-thread-safe (faster)",
                "option_c": "StringBuilder is allocated on the stack; StringBuffer on the heap",
                "option_d": "There is no difference in runtime execution",
                "correct_option": "B"
            },
            {
                "topic": "DBMS & Normalization",
                "question_text": "A database table is in Third Normal Form (3NF) if and only if it is in 2NF and:",
                "option_a": "Every non-prime attribute is non-transitively dependent on the primary key",
                "option_b": "It has no multi-valued dependencies",
                "option_c": "All attributes are atomic values",
                "option_d": "It contains no foreign keys",
                "correct_option": "A"
            },
            {
                "topic": "SQL Queries & Aggregations",
                "question_text": "What is the result of the SQL query: SELECT COUNT(*), COUNT(salary) FROM Employee WHERE department_id = 10; if one employee has NULL salary?",
                "option_a": "Both counts are identical",
                "option_b": "COUNT(*) counts all rows including NULLs; COUNT(salary) excludes rows where salary IS NULL",
                "option_c": "COUNT(*) returns 0",
                "option_d": "SQL error thrown due to NULL handling",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Find Second Largest Element in Array",
                "topic": "Arrays",
                "difficulty": "Easy",
                "description": "Given an array of integers nums, find the second largest distinct element without sorting the array. Return -1 if no second largest exists.",
                "example_input": "nums = [12, 35, 1, 10, 34, 1]",
                "example_output": "34"
            }
        ],
        "Technical AI": [
            {
                "topic": "Full-Stack Web Architecture & REST",
                "question_text": "Explain the architectural flow of a 3-tier Spring Boot / Node.js application connected to a relational database. How do you implement connection pooling (HikariCP), JWT authentication middleware, and global exception handling?",
                "expected_answer": "Explains Controller-Service-Repository pattern, connection pool sizing, stateless JWT verification via interceptors/middleware, and ControllerAdvice / standard HTTP error codes."
            }
        ],
        "HR": [
            {
                "question_text": "TCS works across diverse global client locations, shift timings, and technological domains. How adaptable are you to transitioning to new technology stacks or relocation based on business requirements?",
                "evaluation_criteria": "Tests adaptability, teamwork, continuous learning, and positive client-service mindset."
            }
        ]
    },

    "Infosys": {
        "Aptitude": [
            {
                "topic": "Logical Cryptarithmetic & Puzzles",
                "question_text": "If POINT + ZERO = NUMBER where each letter represents a unique digit from 0 to 9, what is the maximum possible value for N in the sum?",
                "option_a": "1",
                "option_b": "2",
                "option_c": "9",
                "option_d": "0",
                "correct_option": "A"
            },
            {
                "topic": "Data Interpretation",
                "question_text": "A bar chart shows Infosys project revenues growing from $100M in Year 1 to $144M in Year 3. What is the Compound Annual Growth Rate (CAGR)?",
                "option_a": "18%",
                "option_b": "20%",
                "option_c": "22%",
                "option_d": "24%",
                "correct_option": "B"
            },
            {
                "topic": "Number Series",
                "question_text": "Find the next number in the pattern: 2, 6, 12, 20, 30, 42, ?",
                "option_a": "52",
                "option_b": "56",
                "option_c": "60",
                "option_d": "64",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Object Oriented Programming (OOP)",
                "question_text": "In C++ / Java, which mechanism demonstrates Compile-Time (Static) Polymorphism?",
                "option_a": "Method Overriding with Virtual functions",
                "option_b": "Method Overloading and Operator Overloading",
                "option_c": "Interface Implementation",
                "option_d": "Dynamic casting",
                "correct_option": "B"
            },
            {
                "topic": "SQL & Query Optimization",
                "question_text": "Which SQL statement finds the 3rd highest salary from an Employee table?",
                "option_a": "SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 2;",
                "option_b": "SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
                "option_c": "SELECT salary FROM Employee WHERE rownum = 3;",
                "option_d": "SELECT TOP 3 salary FROM Employee;",
                "correct_option": "A"
            },
            {
                "topic": "Data Structures & Time Complexity",
                "question_text": "What is the worst-case time complexity of searching for an element in an Unbalanced Binary Search Tree (BST)?",
                "option_a": "O(1)",
                "option_b": "O(log N)",
                "option_c": "O(N)",
                "option_d": "O(N log N)",
                "correct_option": "C"
            }
        ],
        "Coding": [
            {
                "title": "Palindrome String Verification",
                "topic": "Strings / Two Pointers",
                "difficulty": "Easy",
                "description": "Given a string s, return true if it is a palindrome after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, otherwise false.",
                "example_input": "s = 'A man, a plan, a canal: Panama'",
                "example_output": "true"
            }
        ],
        "Technical AI": [
            {
                "topic": "Microservices Communication & APIs",
                "question_text": "Compare REST APIs vs GraphQL vs gRPC. When should an enterprise modernization project migrate from legacy monolithic SOAP services to event-driven microservices?",
                "expected_answer": "Compares transport protocols (HTTP/1.1 vs HTTP/2 vs Protobuf), payload overhead, over/under-fetching in REST vs GraphQL, and asynchronous messaging via Kafka/RabbitMQ."
            }
        ],
        "HR": [
            {
                "question_text": "Infosys values Learnability ('the ability to derive meaning from experience and apply that learning to novel situations'). Give an example of a technical tool or framework you mastered independently from scratch.",
                "evaluation_criteria": "Tests learnability, self-motivation, problem-solving, and communication structure."
            }
        ]
    },

    "Wipro": {
        "Aptitude": [
            {
                "topic": "Work & Wages",
                "question_text": "A alone can complete a project in 16 days, and B in 24 days. With the help of C, they finish the work in 8 days. If total compensation is Rs. 7,200, what is C's share?",
                "option_a": "Rs. 1,200",
                "option_b": "Rs. 1,500",
                "option_c": "Rs. 1,800",
                "option_d": "Rs. 2,400",
                "correct_option": "A"
            },
            {
                "topic": "Pipes & Cisterns",
                "question_text": "Pipe A fills a tank in 10 hours and Pipe B in 15 hours. Both are opened together, but Pipe A is closed 2 hours before the tank is full. How long did it take to fill the tank?",
                "option_a": "6.8 hours",
                "option_b": "7.2 hours",
                "option_c": "8.0 hours",
                "option_d": "9.5 hours",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Data Structures & Trees",
                "question_text": "In a Complete Binary Tree of depth h with root at level 1, what is the maximum number of nodes it can contain?",
                "option_a": "2^h - 1",
                "option_b": "2^(h-1)",
                "option_c": "2^h + 1",
                "option_d": "h^2",
                "correct_option": "A"
            },
            {
                "topic": "C++ Pointers & Memory",
                "question_text": "What is the output of `int a = 10; int *p = &a; (*p)++; printf('%d', a);` in C?",
                "option_a": "10",
                "option_b": "11",
                "option_c": "Address of a",
                "option_d": "Compilation error",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Count Vowels and Consonants",
                "topic": "Strings",
                "difficulty": "Easy",
                "description": "Given a string s, count and return the number of vowels and consonants present in the string ignoring spaces and special symbols.",
                "example_input": "s = 'Hello World'",
                "example_output": "Vowels: 3, Consonants: 7"
            }
        ],
        "Technical AI": [
            {
                "topic": "Cloud Deployment & CI/CD",
                "question_text": "Explain how an automated CI/CD pipeline works using GitHub Actions or Jenkins, Docker, and Kubernetes. What is the difference between Blue-Green deployment and Canary deployment?",
                "expected_answer": "Details linting/testing stages, Docker containerization, registry push, rolling updates, Blue-Green instant routing swap, and Canary percentage traffic slicing."
            }
        ],
        "HR": [
            {
                "question_text": "The Spirit of Wipro emphasizes 'Be passionate about clients' success' and 'Treat each person with respect'. How do you handle disagreements within a project team to ensure collaborative success?",
                "evaluation_criteria": "Tests conflict resolution, emotional intelligence, teamwork, and empathy."
            }
        ]
    },

    "Accenture": {
        "Aptitude": [
            {
                "topic": "Critical Reasoning & Coding-Decoding",
                "question_text": "In a certain code, 'DEVELOPER' is written as 'EFWFMPQFS'. How is 'INNOVATION' written in the same code rule?",
                "option_a": "JOOPWBUJPO",
                "option_b": "JOOPWBUIOP",
                "option_c": "JOOPVAUJPO",
                "option_d": "JOOPWAUJPO",
                "correct_option": "A"
            },
            {
                "topic": "Logical Flow & Syllogisms",
                "question_text": "Statement: All AI models are Algorithms. Some Algorithms are Deterministic. Conclusion 1: Some AI models are Deterministic. Conclusion 2: All Algorithms are AI models.",
                "option_a": "Only Conclusion 1 follows",
                "option_b": "Only Conclusion 2 follows",
                "option_c": "Neither follows definitively",
                "option_d": "Both follow",
                "correct_option": "C"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Cloud Infrastructure & Security",
                "question_text": "Which cloud computing model provides virtualized compute instances, storage, and networking where the customer manages the OS, middleware, and applications?",
                "option_a": "SaaS (Software as a Service)",
                "option_b": "PaaS (Platform as a Service)",
                "option_c": "IaaS (Infrastructure as a Service)",
                "option_d": "FaaS (Function as a Service)",
                "correct_option": "C"
            },
            {
                "topic": "Web Security & Authentication",
                "question_text": "What attack occurs when malicious scripts are injected into trusted web applications and executed in a victim's browser session?",
                "option_a": "SQL Injection (SQLi)",
                "option_b": "Cross-Site Scripting (XSS)",
                "option_c": "Distributed Denial of Service (DDoS)",
                "option_d": "Man-In-The-Middle (MITM)",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Sum of Binary Digits / Count Set Bits",
                "topic": "Bit Manipulation",
                "difficulty": "Easy",
                "description": "Write a function that takes an integer n and returns the number of '1' bits it has (also known as the Hamming weight).",
                "example_input": "n = 11 (binary 1011)",
                "example_output": "3"
            }
        ],
        "Technical AI": [
            {
                "topic": "Enterprise Cloud Migration",
                "question_text": "Discuss the 6 R's of Cloud Migration (Rehost, Replatform, Repurchase, Refactor, Retire, Retain). How would you assess a legacy retail client system for cloud readiness?",
                "expected_answer": "Explains migration strategies, total cost of ownership (TCO), microservices breakdown, security boundaries, and data migration pipelines."
            }
        ],
        "HR": [
            {
                "question_text": "Accenture delivers on the promise of technology and human ingenuity. Tell me about a scenario where you took initiative to automate a repetitive task or improve process efficiency.",
                "evaluation_criteria": "Assesses innovation, proactiveness, problem identification, and measurable impact."
            }
        ]
    },

    "Capgemini": {
        "Aptitude": [
            {
                "topic": "Game Theory & Pseudo-Code",
                "question_text": "What is the output of the pseudo-code: Set Integer a = 5, b = 10; a = a ^ b; b = a ^ b; a = a ^ b; Print a, b?",
                "option_a": "5, 10",
                "option_b": "10, 5",
                "option_c": "15, 15",
                "option_d": "0, 0",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Database Keys & Integrity",
                "question_text": "Which constraint ensures that a column cannot contain NULL values and must uniquely identify every record in a relational table?",
                "option_a": "UNIQUE Key",
                "option_b": "PRIMARY KEY",
                "option_c": "FOREIGN KEY",
                "option_d": "CHECK Constraint",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Reverse Words in a String",
                "topic": "Strings",
                "difficulty": "Medium",
                "description": "Given an input string s, reverse the order of the words.",
                "example_input": "s = 'the sky is blue'",
                "example_output": "'blue is sky the'"
            }
        ],
        "Technical AI": [
            {
                "topic": "DevOps & Microservices Monitoring",
                "question_text": "Explain the Three Pillars of Observability: Metrics, Logs, and Distributed Tracing (Prometheus, ELK/OpenSearch, Jaeger/Zipkin). How do you detect and isolate a slow microservice in a request chain?",
                "expected_answer": "Trace IDs / span correlation headers (W3C Trace Context), Prometheus metrics alerting on P99 latencies, centralized structured logging, and APM dashboard drill-down."
            }
        ],
        "HR": [
            {
                "question_text": "Capgemini values Honesty, Boldness, Trust, and Team Spirit. Describe an instance where you worked with a cross-cultural team to deliver a milestone.",
                "evaluation_criteria": "Examines team spirit, cross-cultural competence, and reliable commitment."
            }
        ]
    },

    "Cognizant": {
        "Aptitude": [
            {
                "topic": "Quantitative Reasoning & Series",
                "question_text": "Find the missing term in the sequence: 7, 14, 42, 168, 840, ?",
                "option_a": "4200",
                "option_b": "5040",
                "option_c": "6720",
                "option_d": "3360",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Web Technologies & REST",
                "question_text": "Which HTTP method is defined as idempotent according to the HTTP/1.1 specification?",
                "option_a": "POST",
                "option_b": "PUT",
                "option_c": "PATCH (when used for non-idempotent operations)",
                "option_d": "None of the above",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Contains Duplicate",
                "topic": "Hash Set",
                "difficulty": "Easy",
                "description": "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
                "example_input": "nums = [1,2,3,1]",
                "example_output": "true"
            }
        ],
        "Technical AI": [
            {
                "topic": "Enterprise Data Lakes & ETL",
                "question_text": "Explain how modern ETL/ELT data pipelines process batch and streaming data into a Data Lake (e.g. Apache Spark, Databricks, Snowflake). How is schema evolution handled?",
                "expected_answer": "Details Medallion architecture (Bronze, Silver, Gold), Delta Lake ACID transactions, Parquet file format partitioning, and Spark distributed workers."
            }
        ],
        "HR": [
            {
                "question_text": "Cognizant engineers modern businesses. Tell me about how you stay current with rapidly evolving AI tools, technologies, and developer workflows.",
                "evaluation_criteria": "Evaluates learning agility, proactive upskilling, and tech enthusiasm."
            }
        ]
    },

    "Deloitte": {
        "Aptitude": [
            {
                "topic": "Financial Aptitude & Percentage",
                "question_text": "A technology consulting client has annual IT expenditures of $12M. Cloud migration reduces server hosting costs by 30%, but increases software licensing by 10%. If hosting was 60% of total spend and licensing was 40%, what is the net annual savings?",
                "option_a": "$1.20M",
                "option_b": "$1.68M",
                "option_c": "$1.80M",
                "option_d": "$2.16M",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Cybersecurity & Identity Management",
                "question_text": "What is the primary architectural purpose of the OAuth 2.0 authorization framework?",
                "option_a": "To authenticate user passwords directly on resource servers",
                "option_b": "To enable third-party applications to obtain limited access to an HTTP service via delegated access tokens without sharing credentials",
                "option_c": "To encrypt disk storage at rest using AES-256",
                "option_d": "To replace HTTPS TLS certificates",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Longest Common Prefix",
                "topic": "Strings",
                "difficulty": "Easy",
                "description": "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
                "example_input": "strs = ['flower','flow','flight']",
                "example_output": "'fl'"
            }
        ],
        "Technical AI": [
            {
                "topic": "Zero Trust Security & Enterprise Governance",
                "question_text": "Design a Zero-Trust architecture for a global financial institution. How do micro-segmentation, continuous identity verification, and least-privilege RBAC protect against lateral attacker movement?",
                "expected_answer": "Explains 'Never Trust, Always Verify', mutual TLS (mTLS) service mesh, identity-aware proxies, conditional access policies, and automated SIEM threat detection."
            }
        ],
        "HR": [
            {
                "question_text": "Deloitte values integrity, professional excellence, and leadership. Describe a situation where you had to uphold high ethical standards or project transparency under pressure.",
                "evaluation_criteria": "Tests professional ethics, accountability, executive communication, and client trust."
            }
        ]
    },

    "HCL": {
        "Aptitude": [
            {
                "topic": "Ratio & Mixture",
                "question_text": "A software team has developers and QA testers in the ratio 5:3. If 6 new QA testers join and 2 developers leave, the new ratio becomes 1:1. How many developers were originally on the team?",
                "option_a": "15",
                "option_b": "20",
                "option_c": "25",
                "option_d": "30",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Operating Systems & Process Management",
                "question_text": "Which condition is NOT one of Coffman's four necessary conditions for a system deadlock to occur?",
                "option_a": "Mutual Exclusion",
                "option_b": "Hold and Wait",
                "option_c": "Preemption of resources allowed",
                "option_d": "Circular Wait",
                "correct_option": "C"
            }
        ],
        "Coding": [
            {
                "title": "Rotate Array by K Positions",
                "topic": "Arrays",
                "difficulty": "Medium",
                "description": "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Do it in-place in O(1) extra space.",
                "example_input": "nums = [1,2,3,4,5,6,7], k = 3",
                "example_output": "[5,6,7,1,2,3,4]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Enterprise Infrastructure Automation",
                "question_text": "Explain Infrastructure as Code (IaC) principles using Terraform and Ansible. How do state files, plan execution locks, and immutable infrastructure patterns prevent configuration drift?",
                "expected_answer": "Declarative vs imperative config, remote state locking with DynamoDB/S3, drift detection pipelines, and blue/green VM image burning via Packer."
            }
        ],
        "HR": [
            {
                "question_text": "HCL champions 'Ideapreneurship' where grassroots innovation drives customer value. Describe an innovative idea or technical improvement you proposed and implemented.",
                "evaluation_criteria": "Evaluates innovation, ownership, proactive mindset, and execution ability."
            }
        ]
    },

    "Tech Mahindra": {
        "Aptitude": [
            {
                "topic": "Speed & Distance",
                "question_text": "A network signal travels along a 600km fiber optic link at 200,000 km/s. What is the one-way propagation delay in milliseconds?",
                "option_a": "1.5 ms",
                "option_b": "3.0 ms",
                "option_c": "4.5 ms",
                "option_d": "6.0 ms",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Telecommunications & Cloud Networks",
                "question_text": "In 5G and modern cloud-native telecom architectures, what does Network Function Virtualization (NFV) replace?",
                "option_a": "Replacing dedicated hardware appliances with software microservices running on standard commodity servers",
                "option_b": "Replacing optical fiber with copper cables",
                "option_c": "Eliminating IP addressing",
                "option_d": "Running all network towers on Bluetooth",
                "correct_option": "A"
            }
        ],
        "Coding": [
            {
                "title": "Valid Anagram",
                "topic": "Hash Map / Frequency Array",
                "difficulty": "Easy",
                "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
                "example_input": "s = 'anagram', t = 'nagaram'",
                "example_output": "true"
            }
        ],
        "Technical AI": [
            {
                "topic": "5G Edge Computing & IoT Stream Pipeline",
                "question_text": "Design a Multi-Access Edge Computing (MEC) streaming pipeline for real-time connected vehicle telemetry processing 1 million events per second with sub-5ms latency requirements.",
                "expected_answer": "Edge-deployed Kafka nodes, MQTT brokers, containerized inference at the radio cell site, time-series aggregation, and hybrid cloud synchronization."
            }
        ],
        "HR": [
            {
                "question_text": "Tech Mahindra focuses on 'Rise'—driving positive change. How do you handle constructive feedback from peers and managers to elevate your performance?",
                "evaluation_criteria": "Tests coachability, emotional maturity, continuous improvement, and resilience."
            }
        ]
    },

    "LTIMindtree": {
        "Aptitude": [
            {
                "topic": "Simple & Compound Interest",
                "question_text": "A cloud modernization project funding of Rs. 50,00,000 yields compound interest at 10% per annum compounded annually. What is the total interest accrued at the end of 2 years?",
                "option_a": "Rs. 10,00,000",
                "option_b": "Rs. 10,50,000",
                "option_c": "Rs. 11,00,000",
                "option_d": "Rs. 11,50,000",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Data Modeling & NoSQL",
                "question_text": "In MongoDB, what indexing technique allows high-performance queries on geospatial coordinates (latitude and longitude)?",
                "option_a": "Compound B-Tree Index",
                "option_b": "2dsphere Index",
                "option_c": "Hashed Index",
                "option_d": "Text Index",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Maximum Subarray (Kadane's Algorithm)",
                "topic": "Dynamic Programming / Arrays",
                "difficulty": "Medium",
                "description": "Given an integer array nums, find the subarray with the largest sum, and return its sum in O(N) time.",
                "example_input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
                "example_output": "6"
            }
        ],
        "Technical AI": [
            {
                "topic": "Enterprise Cloud Architecture",
                "question_text": "Design a multi-region active-active cloud architecture for an enterprise e-commerce platform using AWS Global Accelerator, DynamoDB Global Tables, and Route53 DNS latency routing.",
                "expected_answer": "Global traffic management, cross-region conflict resolution, asynchronous vs synchronous replication, and regional failover drills."
            }
        ],
        "HR": [
            {
                "question_text": "LTIMindtree focuses on driving customer success with agile digital expertise. Describe how you prioritize tasks when managing multiple competing deadlines.",
                "evaluation_criteria": "Evaluates time management, structured prioritization (Eisenhower matrix), and stakeholder communication."
            }
        ]
    },

    # ==========================================
    # 3. HIGH-GROWTH STARTUPS (8 Companies)
    # ==========================================
    "Zoho": {
        "Aptitude": [
            {
                "topic": "Number Theory & Modulo Math",
                "question_text": "What is the remainder when 3^2026 is divided by 5?",
                "option_a": "1",
                "option_b": "2",
                "option_c": "4",
                "option_d": "3",
                "correct_option": "C"
            },
            {
                "topic": "Analytical Puzzles",
                "question_text": "In Zoho Creator, 5 engineers can develop 5 custom forms in 5 hours. At the same rate, how many hours will it take 20 engineers to develop 20 custom forms?",
                "option_a": "20 hours",
                "option_b": "5 hours",
                "option_c": "1 hour",
                "option_d": "4 hours",
                "correct_option": "B"
            },
            {
                "topic": "Clock Angles (Zoho Written Test Hotspot)",
                "question_text": "What is the angle between the hour hand and minute hand of a clock at 3:30?",
                "option_a": "70 degrees",
                "option_b": "75 degrees",
                "option_c": "80 degrees",
                "option_d": "85 degrees",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "C Pointers & Operator Precedence (Zoho Signature)",
                "question_text": "What is the output of `int arr[] = {10, 20, 30}; int *p = arr; printf('%d ', *p++); printf('%d', *p);` in C?",
                "option_a": "10 10",
                "option_b": "10 20",
                "option_c": "20 20",
                "option_d": "11 20",
                "correct_option": "B"
            },
            {
                "topic": "C & Memory Management",
                "question_text": "In C / C++, what happens when you attempt to access memory after calling free(ptr) on it (Dangling Pointer)?",
                "option_a": "The memory is automatically reallocated by the OS",
                "option_b": "Undefined Behavior (may return stale data, crash with Segmentation Fault, or cause security vulnerabilities)",
                "option_c": "It always throws a compile-time error",
                "option_d": "The pointer is automatically set to NULL",
                "correct_option": "B"
            },
            {
                "topic": "Storage Classes & Scope",
                "question_text": "What is the scope and lifetime of a `static` variable declared inside a C function?",
                "option_a": "Global scope and dynamic heap lifetime",
                "option_b": "Local function scope and program duration lifetime (persists value across function calls)",
                "option_c": "Block scope and destroyed on function exit",
                "option_d": "File scope and stack allocated",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Spiral Matrix Printing",
                "topic": "Matrix / 2D Arrays",
                "difficulty": "Medium",
                "description": "Given an m x n matrix, return all elements of the matrix in spiral order (clockwise direction from top-left).",
                "example_input": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
                "example_output": "[1,2,3,6,9,8,7,4,5]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Low-Level Design (LLD): Call Taxi Booking Application",
                "question_text": "Design the Low-Level Object-Oriented architecture for Zoho's Call Taxi Booking System. Structure classes for Taxi, Booking, Location (Points A-F), calculate travel costs based on Rs.100 base + Rs.10/km, assign nearest available taxi with lowest prior earnings, and print taxi trip sheets.",
                "expected_answer": "Details class structure (Taxi, BookingRecord, TaxiManager), Euclidean/point distance calculation, greedy nearest taxi selection with lowest total earnings tiebreaker, and transaction tracking."
            }
        ],
        "HR": [
            {
                "question_text": "Zoho is celebrated for deep engineering culture, self-reliance, and long-term product thinking. What motivates you to write clean, modular code from first principles?",
                "evaluation_criteria": "Evaluates passion for core engineering fundamentals, long-term ownership, humility, and dedication."
            }
        ]
    },

    "Freshworks": {
        "Aptitude": [
            {
                "topic": "Customer Ticket Sizing & Throughput",
                "question_text": "A Freshdesk customer support portal receives 1,800 tickets daily. An AI triage agent resolves 40% automatically. If each human agent can process 30 tickets/day, how many human agents are required?",
                "option_a": "24 agents",
                "option_b": "36 agents",
                "option_c": "40 agents",
                "option_d": "60 agents",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Ruby / Node.js & Multi-Tenancy",
                "question_text": "In multi-tenant SaaS architectures, how do connection poolers (e.g. PgBouncer) protect relational databases against connection starvation from hundreds of microservice instances?",
                "option_a": "By assigning each incoming HTTP request its own permanent TCP database connection",
                "option_b": "By maintaining a small pool of reusable database connections and multiplexing transactions across active clients",
                "option_c": "By converting all SQL queries into flat JSON files",
                "option_d": "By disabling database transactions",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Top K Frequent Elements",
                "topic": "Hash Map / Min-Heap / Bucket Sort",
                "difficulty": "Medium",
                "description": "Given an integer array nums and an integer k, return the k most frequent elements in O(N log k) or O(N) time.",
                "example_input": "nums = [1,1,1,2,2,3], k = 2",
                "example_output": "[1,2]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Omnichannel Real-Time Chat & Ticketing Engine",
                "question_text": "Design Freshchat's real-time messaging gateway handling 100,000 concurrent agent-customer WebSocket connections with offline message delivery, typing indicators, and CRM webhook dispatches.",
                "expected_answer": "WebSocket connection managers with Redis Pub/Sub backplane, heartbeat ping/pongs, persistent message store (Cassandra/Postgres), and idempotent webhook dispatch queues."
            }
        ],
        "HR": [
            {
                "question_text": "Freshworks values 'Happy Employees make Happy Customers' (KISS - Keep It Simple & Silly, Speed of execution). Describe how you simplify complex code or products to make them delightful for end users.",
                "evaluation_criteria": "Tests product sensibility, simplicity, team empathy, and user obsession."
            }
        ]
    },

    "Flipkart": {
        "Aptitude": [
            {
                "topic": "Big Billion Days Discount Logic",
                "question_text": "During Big Billion Days, a smartphone listed at Rs. 40,000 has successive discounts of 20% and 10%, followed by an instant bank cashback of Rs. 2,000. What is the final price paid by the customer?",
                "option_a": "Rs. 26,800",
                "option_b": "Rs. 28,000",
                "option_c": "Rs. 26,000",
                "option_d": "Rs. 27,200",
                "correct_option": "A"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Distributed Locking & Concurrency",
                "question_text": "When implementing distributed locks with Redis (Redlock algorithm), why must lock leases have an auto-expiration TTL?",
                "option_a": "To reduce Redis RAM usage",
                "option_b": "To prevent deadlocks if the holding process crashes before explicitly releasing the lock",
                "option_c": "To enforce round-robin execution",
                "option_d": "Because Redis cannot store keys permanently",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Search in Rotated Sorted Array",
                "topic": "Binary Search",
                "difficulty": "Medium",
                "description": "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums in O(log N) time.",
                "example_input": "nums = [4,5,6,7,0,1,2], target = 0",
                "example_output": "4"
            }
        ],
        "Technical AI": [
            {
                "topic": "Low-Level Design (LLD): Flipkart Locker & Delivery Service",
                "question_text": "Design the Low-Level Object-Oriented architecture for Flipkart Automated Smart Lockers. Structure the classes, interfaces, concurrency controls for locker allocation, pin verification, and package pickup.",
                "expected_answer": "Details class hierarchy (Locker, Slot, PackageSize, OTPService, LockerManager), state pattern for slot states (Available, Allocated, Delivered, Maintenance), and thread safety for concurrent allocations."
            }
        ],
        "HR": [
            {
                "question_text": "Flipkart operates with high ownership and customer-first innovation. Describe a time you went above and beyond your immediate role responsibilities to unblock a project.",
                "evaluation_criteria": "Examines ownership, cross-functional initiative, customer centricity, and grit."
            }
        ]
    },

    "PhonePe": {
        "Aptitude": [
            {
                "topic": "UPI Transaction Volume Math",
                "question_text": "PhonePe processes 120 million UPI transactions in 24 hours. Peak traffic during evening hours is 3x the average hourly rate. What is the peak Transactions Per Second (TPS)?",
                "option_a": "1,388 TPS",
                "option_b": "2,777 TPS",
                "option_c": "4,166 TPS",
                "option_d": "5,555 TPS",
                "correct_option": "C"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "FinTech Transactions & Idempotency",
                "question_text": "In UPI payment gateway integrations, how is double-debit prevented when network timeouts occur between the client app and the banking switch?",
                "option_a": "By rejecting all retried requests automatically",
                "option_b": "Using unique client-generated Idempotency Keys stored with transaction state locks in the database",
                "option_c": "By processing transactions without database persistence",
                "option_d": "By running all payments synchronously on a single thread",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Subarray Sum Equals K",
                "topic": "Hash Map / Prefix Sum",
                "difficulty": "Medium",
                "description": "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k in O(N) time.",
                "example_input": "nums = [1,1,1], k = 2",
                "example_output": "2"
            }
        ],
        "Technical AI": [
            {
                "topic": "High-Throughput Payment Gateway Architecture",
                "question_text": "Design PhonePe's UPI payment processing engine handling 10,000 TPS. How do you ensure high availability across banking NPCI endpoints, transaction reconciliation, and zero ledger discrepancies?",
                "expected_answer": "SAGA orchestrator for distributed transactions, double-entry accounting ledger with append-only immutable logs, rate limiters, circuit breakers for failing bank APIs, and reconciliation workers."
            }
        ],
        "HR": [
            {
                "question_text": "In FinTech, a single software bug can lead to financial loss or regulatory non-compliance. How do you approach testing, security reviews, and edge-case validation?",
                "evaluation_criteria": "Tests rigor, attention to security, high technical integrity, and accountability."
            }
        ]
    },

    "Paytm": {
        "Aptitude": [
            {
                "topic": "FinTech Wallet Cashback Math",
                "question_text": "A user receives a 5% cashback on a Paytm wallet top-up up to a maximum cashback of Rs. 150. If the user tops up with Rs. 4,000, what is the effective discount percentage received?",
                "option_a": "5.00%",
                "option_b": "4.25%",
                "option_c": "3.75%",
                "option_d": "3.50%",
                "correct_option": "C"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Database Concurrency & Isolation",
                "question_text": "To prevent the 'Lost Update' anomaly when two users simultaneously deduct balances from a shared wallet account, which SQL locking approach is most appropriate?",
                "option_a": "SELECT * FROM Wallet WHERE id = ? FOR UPDATE; (Pessimistic Locking)",
                "option_b": "SELECT * FROM Wallet WHERE id = ? (Dirty Read)",
                "option_c": "No locking needed",
                "option_d": "Dropping the index on the Wallet table",
                "correct_option": "A"
            }
        ],
        "Coding": [
            {
                "title": "Coin Change (Minimum Coins Required)",
                "topic": "Dynamic Programming",
                "difficulty": "Medium",
                "description": "You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.",
                "example_input": "coins = [1,2,5], amount = 11",
                "example_output": "3 (11 = 5 + 5 + 1)"
            }
        ],
        "Technical AI": [
            {
                "topic": "Real-Time Fraud Detection Engine",
                "question_text": "Design Paytm's real-time fraud detection engine evaluating transactions within 50ms. How do feature stores, streaming anomaly rules (e.g. 5 transactions in 10 seconds from new location), and ML score inference interoperate?",
                "expected_answer": "Apache Flink stream processing, Redis feature cache for user historical aggregates, asynchronous scoring pipeline with rule engine fallback, and automated OTP step-up authentication."
            }
        ],
        "HR": [
            {
                "question_text": "Paytm has transformed Indian digital payments through agility and rapid prototyping. Describe how you balance building MVP features quickly while writing scalable code.",
                "evaluation_criteria": "Tests startup velocity, architectural foresight, and pragmatism."
            }
        ]
    },

    "Swiggy": {
        "Aptitude": [
            {
                "topic": "Delivery Optimization & Routing",
                "question_text": "A Swiggy delivery partner delivers orders from 3 nearby restaurants to 3 customers located along a straight road at coordinates x = 2km, 5km, and 9km. Where should a central cloud kitchen be placed to minimize the sum of distances to all 3 customers?",
                "option_a": "At x = 2km",
                "option_b": "At x = 5km (Median)",
                "option_c": "At x = 5.33km (Mean)",
                "option_d": "At x = 9km",
                "correct_option": "B"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "Geospatial Indexing & Algorithms",
                "question_text": "What spatial indexing system divides the earth's surface into a hierarchical grid of hexagonal cells for efficient geospatial grouping and distance lookups in ride-sharing and food delivery platforms?",
                "option_a": "Uber H3 / Google S2",
                "option_b": "B+ Tree",
                "option_c": "Red-Black Tree",
                "option_d": "Fibonacci Heap",
                "correct_option": "A"
            }
        ],
        "Coding": [
            {
                "title": "Task Scheduler with Cooling Time",
                "topic": "Greedy / Priority Queue",
                "difficulty": "Medium",
                "description": "Given a characters array tasks, representing the tasks a CPU needs to do, and a non-negative integer n representing the cooldown period, return the least number of intervals the CPU will take to finish all tasks.",
                "example_input": "tasks = ['A','A','A','B','B','B'], n = 2",
                "example_output": "8"
            }
        ],
        "Technical AI": [
            {
                "topic": "Hyperlocal Order Dispatch & Batching System",
                "question_text": "Design Swiggy's delivery partner assignment and order batching algorithm. When multiple orders arrive from the same restaurant cluster, how does the system match orders to delivery executives in real-time to minimize delivery latency and fuel cost?",
                "expected_answer": "Bipartite matching (Hungarian algorithm) over localized H3 hex cells, dynamic ETA estimations via road routing graphs, batching heuristics, and real-time Kafka event streams."
            }
        ],
        "HR": [
            {
                "question_text": "Swiggy's values include 'Consumer Comes First', 'Always Be Curious', and 'Display High Integrity'. Tell me about a time you optimized a feature based on direct user feedback.",
                "evaluation_criteria": "Tests user empathy, curiosity, agility, and cross-functional alignment."
            }
        ]
    },

    "Zomato": {
        "Aptitude": [
            {
                "topic": "Order Surge & Commission Math",
                "question_text": "Zomato charges a restaurant a 20% commission on orders. During heavy rains, a surge fee of Rs. 40 is added directly to the delivery partner. If an order total with food items is Rs. 800 (plus Rs. 40 surge fee), what is Zomato's net revenue from this order?",
                "option_a": "Rs. 160",
                "option_b": "Rs. 168",
                "option_c": "Rs. 200",
                "option_d": "Rs. 120",
                "correct_option": "A"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "High-Volume Search & Ranking",
                "question_text": "In Elasticsearch / Lucene, how does an Inverted Index allow instantaneous full-text restaurant dish searches across millions of menus?",
                "option_a": "By scanning documents sequentially from disk",
                "option_b": "By mapping every unique word/token to a sorted list of document IDs (posting list) where it appears",
                "option_c": "By storing records in a linked list",
                "option_d": "By hashing the entire document text into a single integer",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Longest Substring Without Repeating Characters",
                "topic": "Sliding Window / Hash Set",
                "difficulty": "Medium",
                "description": "Given a string s, find the length of the longest substring without repeating characters in O(N) time.",
                "example_input": "s = 'abcabcbb'",
                "example_output": "3 ('abc')"
            }
        ],
        "Technical AI": [
            {
                "topic": "Live Order Tracking & Live Driver Location",
                "question_text": "Design Zomato's live order GPS tracking system streaming real-time driver coordinates to the customer mobile app every 3 seconds. How do you handle coordinate map-matching, battery optimization, and low-latency rendering?",
                "expected_answer": "gRPC/MQTT mobile push, Kalman filter for GPS noise smoothing, map-matching against OpenStreetMap road networks, Redis geospatial indexes, and WebSocket connection multiplexing."
            }
        ],
        "HR": [
            {
                "question_text": "Zomato encourages candid feedback, continuous improvement, and ownership. Describe an experience where you challenged a conventional idea to implement a more effective technical solution.",
                "evaluation_criteria": "Assesses constructive boldness, intellectual honesty, problem solving, and team collaboration."
            }
        ]
    },

    "Razorpay": {
        "Aptitude": [
            {
                "topic": "Payment Gateway Fee Structure",
                "question_text": "Razorpay charges a merchant 2% MDR (Merchant Discount Rate) + 18% GST on the MDR amount. On a payment transaction of Rs. 10,000, what is the net settlement amount credited to the merchant?",
                "option_a": "Rs. 9,764",
                "option_b": "Rs. 9,800",
                "option_c": "Rs. 9,760",
                "option_d": "Rs. 9,820",
                "correct_option": "A"
            }
        ],
        "Technical MCQ": [
            {
                "topic": "API Design & Webhook Reliability",
                "question_text": "When sending transactional webhooks to merchant servers, how does Razorpay guarantee message authenticity and protect against tampering?",
                "option_a": "By sending plain text JSON without headers",
                "option_b": "By signing the webhook request payload with an HMAC-SHA256 signature using the merchant's secret key",
                "option_c": "By requiring merchants to disable HTTPS firewalls",
                "option_d": "By sending merchant passwords in query parameters",
                "correct_option": "B"
            }
        ],
        "Coding": [
            {
                "title": "Merge Intervals",
                "topic": "Intervals / Sorting",
                "difficulty": "Medium",
                "description": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
                "example_input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
                "example_output": "[[1,6],[8,10],[15,18]]"
            }
        ],
        "Technical AI": [
            {
                "topic": "Developer-First API Gateway & Idempotent Webhook Dispatcher",
                "question_text": "Design Razorpay's high-reliability Webhook Delivery Engine handling 50 million webhooks daily. How do you implement exponential backoff retries, dead-letter storage, rate limiting per merchant endpoint, and cryptographic signature headers?",
                "expected_answer": "Covers asynchronous worker queues (RabbitMQ/Kafka), retry scheduler with exponential jitter backoff, circuit breaker for merchant server downtime, HMAC signature headers, and merchant analytics dashboard."
            }
        ],
        "HR": [
            {
                "question_text": "Razorpay takes immense pride in developer experience and world-class product reliability. Describe how you design clean APIs and write documentation that developers love.",
                "evaluation_criteria": "Examines developer empathy, architectural clarity, design taste, and high engineering standards."
            }
        ]
    }
}
