# Agentic AI — Interview-Ready Knowledge Base
> Opinionated. No fluff. This is the version interviewers hire from.

---
## 1. Autonomous Agents — Core Concepts

### What Makes a System Truly "Agentic"?

A system is agentic when it can **pursue goals independently** — it perceives, decides, acts, and adapts without requiring a human in the loop for every step. Calling an LLM and getting text back is not agentic. Calling an LLM that calls a tool, evaluates the result, and decides the next action based on a goal is agentic.

**Core properties (non-negotiable):**
- **Autonomy** — initiates actions without human intervention
- **Perception** — awareness of environment state, tool outputs, or prior context
- **Reasoning** — ability to plan, decompose, and evaluate multi-step logic
- **Memory** — retention of state across steps
- **Action** — capability to invoke external tools or behaviors
- **Goal-directedness** — success is defined by outcome, not just output

If a system lacks any of these, it's a **pipeline**, not an agent.

### Agent Types

| Type | Description | When to Use | Avoid When |
|------|-------------|-------------|------------|
| **Reactive** | Responds directly to stimuli, no internal state | Simple trigger-action tasks | Multi-step reasoning needed |
| **Deliberative** | Plans ahead, builds explicit action sequences | Complex goals with known steps | Rapid real-time response needed |
| **Hybrid** | Combines reactive + deliberative layers | Production systems needing both speed and depth | Overkill for simple cases |
| **BDI (Belief-Desire-Intention)** | Models mental state: beliefs, desires, intentions | Enterprise agents with explicit reasoning traces | Lightweight builds |

BDI is the most architecturally rigorous. The agent maintains a **belief set** (what it thinks is true), a **desire set** (what it wants), and an **intention stack** (what it's committed to doing). This gives auditability and deliberate commitment — critical for regulated industries.

### The Agent Loop

```
Observe → Think → Act → Reflect
```

- **Observe** — gather current state: tool results, user input, memory
- **Think** — run reasoning (ReAct, CoT, or planner)
- **Act** — invoke tools, update state, emit output
- **Reflect** — evaluate whether goal is satisfied; decide to loop or exit

This is a **while loop with a termination condition**, not a linear chain. Agents that never terminate are a top-1 production failure mode.

### Single-Agent vs Multi-Agent

**Single-agent:** One agent owns the full loop. Simpler, easier to debug, lower cost. Works when tasks are decomposable but don't require distinct personas.

**Multi-agent:** Task distributed across specialized agents. Used when:
- Sub-tasks need different tool sets or expertise domains
- Parallel execution meaningfully reduces latency
- Role-based accountability is required

**The tradeoff:** Multi-agent systems are more expressive but exponentially harder to debug and cost-control. Adding agents should reduce complexity, not redistribute it.

---
## 2. Protocols — Deep Dive

### A) MCP (Model Context Protocol) — Anthropic

**What it is / the problem it solves:**
Anthropic's open protocol for connecting AI models to external data sources and tools in a **standardized server-client model**. Before MCP, every model-server integration was bespoke — each tool was wired individually. MCP solves the "one-off tool wiring" problem with a universal interface using JSON-RPC 2.0.

**How it works (architecture + flow):**
```
┌─────────────┐       MCP (JSON-RPC)      ┌─────────────┐
│  AI Model  │◄──────────────────────►│  MCP Host  │
│  (Client) │                       │  (Server) │
└─────────────┘                       └───────────┘
                                          │
                                   ┌──────┴──────┐
                                   │ Resources   │
                                   │ Tools      │
                                   └────────────┘
```
Tools are described with JSON schemas — the model decides which tool to invoke based on its description, not hard-coded routing.

**Practical setup:**
1. Run an MCP Host (e.g., `npx @anthropic-ai/mcp-server-filesystem`, or a custom host)
2. Configure the MCP manifest in your agent runtime (tools with `inputSchema`, `name`, `description`)
3. The model receives tool definitions in its context
4. Tool calls are resolved by the host at runtime

**Drawbacks and limitations:**
- **Immature tooling ecosystem** — fewer integrations than LangChain's 100+
- **Security surface** — trust boundaries between host and server matter
- **No built-in orchestration** — MCP is a tool protocol, not a coordination protocol
- **Debugging overhead** — JSON-RPC layer adds a trace hop

**When NOT to use it:**
- When you're already deep in LangGraph and integration cost > standardization benefit
- When your tool ecosystem is small and bespoke integrations are cheaper
- When you need multi-agent coordination (use A2A)

---
### B) A2A (Agent-to-Agent Protocol) — Google

**What it is / the problem it solves:**
Google's protocol for **inter-agent communication** — how agents share state, delegate tasks, and coordinate without monolithic shared memory or direct function calls. MCP connects models to tools; A2A connects agents to agents. This is the missing link for multi-agent choreography.

**How it works (architecture + flow):**
```
┌────────┐ A2A     ┌────────┐ A2A     ┌────────┐
│Agent A │◄──────►│Agent B │◄──────►│Agent C │
│(Task) │         │(Worker)│         │(Review)│
└────────┘         └────────┘         └────────┘
     │                               │
     └──── Shared Task Context / State ────┘
```
A2A uses a **task-oriented protocol**: Agent A creates a task, registers it in shared context, and agents subscribe to task types. Agents communicate via structured messages (not raw LLM outputs) — typed contracts between agents.

**Practical setup:**
1. Define agent capabilities as "skills" or "task types" in a registry
2. Agents discover each other via capability matching
3. Agent A sends task message to Agent B via A2A
4. Agent B performs work, returns result or delegates further
5. Agent A aggregates

**Drawbacks and limitations:**
- **Early-stage spec** — production deployments are rare
- **No inherent ordering guarantees** — multi-agent flows can race or deadlock
- **Requires capability registry** — adds infrastructure complexity
- **Still needs a planner** — A2A handles communication, not decomposition

**When NOT to use it:**
- When a supervisor pattern (single orchestrator) is sufficient
- When reliability and ordering are critical
- When you're building on LangGraph or AutoGen — they already provide coordination

---
### C) A2P (Agent-to-Person) — Human-in-the-Loop

**What it is / the problem it solves:**
Covers the **human handoff and escalation** problem — when an agent hits a situation it shouldn't resolve autonomously, how does it communicate with a human, wait for a decision, and resume?

**Patterns:**

| Pattern | Description | When to Use |
|---------|-------------|------------|
| **Approval gate** | Agent pauses before high-stakes action, awaits confirm | Financial transactions, sends, deployments |
| **Escalation with context** | Agent packages reasoning + options, presents to human | Ambiguous intent, edge cases |
| **Polling wait** | Agent loops with `awaiting_approval` state | Long-running workflows needing data |
| **Fallback to human** | Agent detects failure/low confidence, delegates | Novel inputs, low-accuracy tasks |

**Practical setup:**
```python
HIGH_STAKES_THRESHOLD = 0.85
response = agent.decide_action(user_intent)
if response.confidence < HIGH_STAKES_THRESHOLD or not response.is_reversible:
    escalate_to_human(
        reasoning=response.reasoning,
        options=response.options
    )
    state["status"] = "awaiting_approval"
    return state  # pause loop
```

**Drawbacks and limitations:**
- **Breaks autonomy** — over-using A2P defeats the purpose of an agent
- **Blocking waits** — agents can stall indefinitely
- **Human becomes bottleneck** — high-throughput systems can't poll humans for common flows

**When NOT to use it:**
- When tasks are fully automatable with acceptable risk
- When human latency would make the agent useless
- When guardrails can be encoded in logic

---
## 3. Frameworks — Use Cases, Drawbacks, "Why NOT"

### LangGraph

**Core design philosophy:** Stateful, graph-based orchestration. Applications are DAGs where nodes are steps and edges define state transitions. Where chains are linear pipelines, LangGraph is a **state machine with conditional branching**.

**Best use cases:**
- Complex multi-step workflows with branching logic
- Long-running state across many interactions
- Workflows requiring cycle detection and checkpointing
- Systems where you need to replay state

**How agents are built:**
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list
    intent: str

graph = StateGraph(AgentState)
graph.add_node("route", route_intent)
graph.add_node("research", research_agent)
graph.add_node("respond", respond_agent)
graph.add_edge("route", "research", condition=lambda s: s["intent"] == "research")
graph.add_edge("route", "respond", condition=lambda s: s["intent"] == "direct")
graph.add_edge("research", "respond")
graph.add_edge("respond", END)
```

**Real drawbacks:**
- **State management is complex** — shared mutable state across nodes needs careful schema design
- **Debugging is harder** — tracing state mutations across nodes is non-trivial
- **Over-engineering for simple flows** — if linear, LangGraph adds unnecessary graph complexity
- **Operational cost** — every state transition adds LLM calls and latency

**Why NOT choose LangGraph:** If your workflow is a linear pipeline, use **LangChain's LCEL**. LangGraph only pays off when branching, cycling, or checkpointing are genuinely required. For most agents, a well-designed LCEL chain with a supervisor pattern is simpler and cheaper.

---
### AutoGen (Microsoft)

**Core design philosophy:** Multi-agent conversation framework. Agents are conversational entities that send and receive messages, with group chat and collaborative solving. Premise: best outputs come from agents debating and refining each other.

**Best use cases:**
- Code generation where coder + reviewer iterate
- Research synthesis across different knowledge domains
- Tasks where multiple expert perspectives genuinely help

**How agents are built:**
```python
from autogen import ConversableAgent, GroupChat, GroupChatManager
coder = ConversableAgent("coder", system_message="Write production Python")
reviewer = ConversableAgent("reviewer", system_message="Review for correctness")
group_chat = GroupChat(agents=[coder, reviewer], messages=[])
manager = GroupChatManager(groupchat=group_chat)
coder.initiate_chat(manager, message="Write a rate limiter")
```

**Real drawbacks:**
- **Message explosion** — each message is an LLM call; cost scales super-linearly
- **Non-deterministic turn-taking** — agents can race or loop
- **Hard to debug** — verbose conversation traces, opaque failure modes
- **Overkill for linear workflows**

**Why NOT choose AutoGen:** **CrewAI** gives multi-agent collaboration with less conversational overhead. **LangGraph** gives more explicit control. AutoGen's strength is debate-based synthesis — if your use case isn't that, it adds cost and complexity for no benefit.

---
### CrewAI

**Core design philosophy:** Role-based collaborative agents. Agents get explicit roles (researcher, analyst, writer), a crew coordinates them in sequence or parallel. Design prioritizes clarity over flexibility.

**Best use cases:**
- Content pipelines (research → write → edit → publish)
- Structured analysis (collect → process → report)
- Workflows where role clarity is more important than dynamic debate

**How agents are built:**
```python
from crewai import Agent, Task, Crew
researcher = Agent(role="Researcher", goal="Find relevant data")
writer = Agent(role="Writer", goal="Write clear reports")
task1 = Task(description="Research market trends", agent=researcher)
task2 = Task(description="Write report", agent=writer, depends_on=[task1])
crew = Crew(agents=[researcher, writer], tasks=[task1, task2])
crew.kickoff()
```

**Real drawbacks:**
- **Sequential by default** — parallelism requires explicit configuration
- **Limited dynamic routing** — can't re-route based on intermediate results without custom code
- **Opinionated structure** — poor fit for fine-grained control needs
- **Less mature ecosystem** — fewer integrations than LangGraph

**Why NOT choose CrewAI:** LangGraph gives explicit graph control. AutoGen gives dynamic multi-agent debate. CrewAI wins when your workflow is naturally role-divided and sequential. If you need cycles, branching, or shared state management, LangGraph wins.

---
### LangChain Agents

**Core design philosophy:** Tool-calling chain agents built on LangChain abstractions. Agents (MRKL, ReAct, Conversational) are chains with a reasoning step + a tool invocation step. This is LangChain's original agent model — predating LangGraph.

**Best use cases:**
- Simple single-turn or few-turn tool-calling tasks
- Prototyping before investing in complex orchestration
- When LangChain integrations (100+ tools) are a genuine requirement

**Real drawbacks:**
- **Linear and stateless** — no built-in state management across turns
- **Legacy abstraction** — LangGraph supersedes these for complex flows
- **Hard to extend** — custom reasoning logic requires overriding components

**Why NOT choose LangChain agents:** If building stateful, multi-step systems, **LangGraph** is the evolved version. If building simple tool-calling, use **Anthropic Tool Use** or **OpenAI Assistants API** — fewer abstractions, lower overhead.

---
### OpenAI Assistants API

**Core design philosophy:** Managed agent runtime. OpenAI hosts agent state, tool definitions, and execution loop. You define instructions and tools; OpenAI manages the runtime.

**Best use cases:**
- Quick prototypes and demos
- Simple chatbots with tool access
- Single-agent systems without orchestration infrastructure needs

**Real drawbacks:**
- **Vendor lock-in** — no portability
- **Limited observability** — can't inspect internal reasoning loop
- **No multi-agent support**
- **Cost opacity** — harder to predict than self-hosted

**Why NOT choose Assistants API:** If you need multi-agent systems, custom orchestration, or portability, build on **LangGraph or AutoGen**. Right choice: throwaway prototypes or single-agent use cases.

---
### Anthropic Tool Use

**Core design philosophy:** Native function calling built into Claude's inference layer. Tools are JSON schemas passed in the API request; Claude resolves them natively. Thinnest possible tool-calling abstraction.

**Best use cases:**
- Single-tool or few-tool invocations
- Low-latency production tool calls where abstraction overhead hurts
- When you want maximal control without framework constraints

**Real drawbacks:**
- **No orchestration** — you manage the loop; no built-in state machine
- **Single-agent by design** — no multi-agent coordination
- **Low abstraction** — you build everything above tools yourself

**Why NOT choose Anthropic Tool Use:** For multi-step, stateful orchestration, **LangGraph** gives you orchestration without vendor lock-in. Tool Use is right when you want maximal control at minimal abstraction cost.

---
### Embodied / Perception Agent Frameworks

**Core design philosophy:** Agents that perceive and act in a physical or simulated environment. Draws from robotics and reinforcement learning. Has sensory inputs and motor outputs.

**Why this paradigm Fails for LLM-based agentic systems:**

| Problem | Why It Matters |
|---------|-------------|
| **Grounding problem** | LLMs generate text about the world, not actions in it. Bridging that gap is unsolved. |
| **Sim-to-real gap** | Agents trained in simulation fail in the real world due to sensor noise and physics discrepancies. |
| **Latency** | Real-time perception + reasoning + action requires sub-second cycles; LLM inference is measured in seconds. |
| **Benchmark disconnect** | Most embodied benchmarks test simulated instruction following, not real-world robustness. |
| **Hardware cost** | Physical robot experiments are expensive and slow. |

The embodied agent paradigm is legitimate for **robotics research**, but not the right mental model for **LLM-based production agentic systems**. Use software agent frameworks instead.

---
## 4. Interview Questions with Model Answers

**Q1: MCP vs A2A — when would you choose one over the other?**
MCP is a **tool and data protocol** — it connects models to external resources. A2A is an **inter-agent communication protocol** — it connects agents to each other. Use MCP when wiring a model to tools. Use A2A when building multi-agent systems where agents need to delegate or coordinate. They're complementary: A2A agents can use MCP to invoke tools within their tasks.

**Q2: LangGraph vs CrewAI — key architectural differences?**
LangGraph is a **graph execution engine** — you define nodes and edges; the runtime traverses based on state. No native notion of "roles." CrewAI is a **role-task abstraction** — you define agents with roles, assign tasks, crew executes by dependency. LangGraph gives explicit graph control and cycles. CrewAI gives declarative role clarity. For complex stateful workflows with branching, LangGraph. For role-divided sequential workflows, CrewAI.

**Q3: Why would you NOT use AutoGen for a production system?**
AutoGen's group chat model produces **message explosion** — each agent turn is an LLM call. A 3-agent, 10-round group chat is 30 calls. Cost scales super-linearly. **Turn-taking order is non-deterministic** — introduces race conditions. Debugging verbose group chat traces is painful. For production, use **LangGraph** with a supervisor pattern for explicit control, or **CrewAI** for role-based clarity.

**Q4: How does MCP differ from traditional API tool calling?**
Traditional API tool calling is **bespoke per integration** — you define `search_web(query)`, wire it to your model, done. Each tool is one-off. MCP standardizes: tools are described with JSON schemas in a manifest, any MCP-compatible client consumes them without per-tool wiring. It's the difference between writing custom adapters for every device vs USB. Trade-off: MCP adds protocol overhead that pays off at scale, not for small tool sets.

**Q5: What are the failure modes of multi-agent systems?**
1. **Non-deterministic ordering** — agents race or deadlock without an explicit sequencer
2. **Message explosion** — cost and latency scale super-linearly with agent count and turn count
3. **Context pollution** — agent outputs contaminate other agents' context windows
4. **Division of labor mismatch** — agents step on each other's toes or leave gaps
5. **Stuck loops** — agents keep delegating without converging
6. **Error propagation** — failure in one agent cascades without isolation
7. **Observability void** — can't trace what agent did what, when

**Q6: When does adding more agents hurt rather than help?**
When the task can be executed by one agent, adding more agents introduces **coordination overhead without parallelization benefit**. If Agent A does research in 10s and Agent B writes in 5s (depends on A), you haven't reduced time. Adding a reviewer requires a supervisor to merge — more complexity. Signal to add an agent: **genuine parallelism** (independent sub-tasks) or **domain specialization** (one agent can't credibly do what the other does). Otherwise, it's waste.

**Q7: How do you handle agent loops, infinite recursion, or stuck states?**
In LangGraph: implement **cycle detection + termination condition** — track iteration count in state, hard-kill after N iterations. Track a "no progress" flag: if output hasn't changed meaningfully, exit. Define a **success condition** explicitly — loop terminates when met, not when a human decides. For A2A choreography, implement **timeout guards**: if an agent doesn't respond within T seconds, escalate or return a partial result.

**Q8: What's the difference between orchestration and choreography?**
**Orchestration:** A central coordinator directs all agents. Think conductor-led orchestra. LangGraph's supervisor pattern. **Pros:** explicit control, predictable ordering, easier to debug. **Cons:** single point of failure, doesn't scale to open-ended discovery.
**Choreography:** Agents self-discover and communicate based on capability matching. Think dancers responding to each other. A2A's model. **Pros:** more flexible, agents can dynamically rewire. **Cons:** non-deterministic ordering, harder to debug, no guaranteed completion. Use **orchestration** for production reliability. Use **choreography** for open-ended ecosystems.

**Q9: What's the difference between ReAct and Chain-of-Thought?**
CoT is a **reasoning technique** — the model generates intermediate reasoning steps before the final answer. It's a prompting technique, not a system architecture. ReAct is a **full agent loop pattern** — the model reasons, takes an action (tool call), observes the result, and repeats. CoT is step 2 of the Observe-Think-Act-Reflect loop. ReAct is the full loop.

**Q10: When would you NOT use RAG in an agent system?**
When retrieval introduces **latency without information gain**. If the knowledge is parametric and the query is general, vector retrieval adds a DB round-trip for marginal benefit. RAG is essential when: (a) knowledge is **not in the model's training data** (private docs, real-time data), and (b) query is answered by **selective retrieval**. If you're doing "stuffing" — retrieving everything and hoping — you're better off fine-tuning or using a larger context window.

**Q11: What is the "grounding problem" in LLM-based agents?**
The mismatch between a language model's token representations and the real-world state it reasons about. When an agent outputs `"navigate to x=5, y=10"`, it's outputting text. Whether that maps to correct motor commands, whether the robot's sensors confirm the position, and whether the environment matches the model's assumptions — none of that is guaranteed. LLMs have no perceptual loop. They generate text about the world, not representations grounded in sensor feedback. This is why embodied agent systems fail on physical tasks.

**Q12: LangGraph vs LangChain Agents — what's the migration story?**
LangChain agents are **legacy linear chains** — stateless, no cycles, no state management. LangGraph is LangChain's evolved stateful graph architecture. If you need branching, cycles, or state persistence, **migrate to LangGraph**. Migration is non-trivial: LangChain uses `agent = initialize_agent()`; LangGraph requires explicit state schema design and graph definition. Start by identifying your stateful requirements — if you don't have them, stay on LangChain agents.

**Q13: What is the supervisor pattern and when do you use it?**
A **single orchestrator agent** that routes sub-tasks to specialized workers and aggregates results. It's orchestration, not choreography — one agent is in charge. Use when: clearly delineated sub-task types, you need explicit ordering control, debugging must trace to a single decision point. **Don't use** when agents need open-ended peer-to-peer communication (use A2A choreography), or when the supervisor becomes the bottleneck (use a task queue).

**Q14: Anthropic Tool Use vs OpenAI Assistants API?**
Tool Use is a **thin, vendor-native interface** — you define JSON schemas, Claude resolves them natively, you manage the loop. Lowest abstraction. Assistants API is a **managed runtime** — OpenAI hosts the loop, state, and tool resolution. Highest abstraction. Tool Use gives control. Assistants API gives convenience. Use Tool Use for control and portability. Use Assistants API for throwaway prototypes.

**Q15: What is hallucination in agentic systems and how do you mitigate it?**
**Confident, incorrect output** — the agent generates text that sounds authoritative but is factually wrong or actionally unsafe. In pipeline agents, this propagates downstream. Mitigation hierarchy: (1) **Ground tool outputs** — validate tool responses before using as context. (2) **Confidence thresholds** — escalate if below threshold. (3) **LLM-as-judge** — use a separate model to evaluate output before acting. (4) **Reduce generation reliance** — prefer retrieval and structured output over free-text generation.

**Q16: Tool use vs function calling?**
"Tool use" is a **semantic concept** — an agent invoking an external capability. "Function calling" is a **mechanism** — a model outputting a structured call (JSON schema) that maps to a tool. All function calling is tool use; not all tool use is function calling. Function calling is the dominant mechanism in modern LLM agents because it gives typed, schema-validated tool invocation.

**Q17: What are guardrails in an agentic system?**
Safety and reliability constraints that **prevent the agent from taking undesirable actions**.
- **Output guardrails** — filter outputs before reaching the user (PII, profanity, insecure code)
- **Input guardrails** — validate tool responses before injection
- **Permission guardrails** — restrict which tools an agent can invoke
- **Rate guardrails** — prevent excessive tool calls
Guardrails are not optional in production. They're the difference between a useful agent and a liability.

**Q18: What is agentic RAG and how does it differ from naive RAG?**
Naive RAG: retrieve documents, stuff into context, ask the model to answer. Agentic RAG: the agent **plans the retrieval** — it decides what to retrieve, from where, when, and how many times. The agent can decompose a complex query into sub-queries (multi-hop retrieval), evaluate results and decide to retrieve more (recursive retrieval), and synthesize across sources. Naive RAG is a linear pipeline. Agentic RAG is an agent loop with retrieval as a first-class tool.

**Q19: What is the human-in-the-loop pattern and when should it be used?**
The agent **pauses mid-loop** and presents a decision or output to a human for approval. Use when: the action is irreversible (sends, financial transactions, deploys), the agent's confidence is below a threshold, regulatory requirements mandate human review. **Don't use** for reversible, low-stakes, high-volume actions — humans become the bottleneck and the agent loses autonomous value.

**Q20: What is the "why not just use an API" challenge and how do you answer it?**
If you're just wrapping LLM calls with tools, isn't that an API wrapper? Answer: the value of agentic systems is **contextual reasoning and adaptive action**. An API does what you tell it to do. An agent does what it decides to do based on what it perceives. The agent loop enables multi-step reasoning that adapts based on intermediate results, tool selection based on the query, and goal pursuit across variable-length action sequences. If your task is a fixed input → output mapping, use an API. If your task requires reasoning over variable inputs and adaptive multi-step responses, you need an agent.

---
## 5. Critical Drawbacks and Failure Modes

### Reliability and Non-Determinism
Agent pipelines are **probabilistic** — the same input produces different outputs on different runs. Production requirements:
- Explicit **determinism controls** (low temperature, structured output)
- **Test coverage** including agent outputs, not just tool correctness
- **Fallback logic** for every decision point
The brutal truth: you will ship agents that pass tests and fail in production because you tested the happy path.

### Cost Explosion
Every agent loop iteration is an LLM call. A 3-agent, 10-iteration system is 30 LLM calls. At $0.01/call and 100K requests/day, that's $3,000/day. **Cost modeling must precede production deployment.** Mitigations: cache intermediate results, use smaller models for sub-tasks, hard-kill loops after N iterations, implement cost budgets.

### Context Window Blowup
Long runs consume context at each iteration. When full, you lose the beginning and the agent loses coherence. Mitigations: **summarize** prior context at each N iterations, use **selective context injection**, design explicit **termination conditions**.

### Trust and Security Risks

| Risk | Mitigation |
|------|------------|
| **Prompt injection** | Input sanitization, instruction isolation |
| **Tool misuse** | Permission guards, output validation |
| **Context poisoning** | RAG output validation before injection |
| **Privilege escalation** | Minimal privilege per agent, enforced boundaries |

Security in agentic systems is a **production requirement**, not an afterthought.

### Observability and Debugging
The agent loop is a **black box** in most frameworks. Production requirements: structured logging with reasoning traces, token tracing across iterations, cost attribution per agent and task, span tracing (LangSmith, Phoenix, or custom).

### When RAG + Simple Chains Beat a Full Agent System
For most knowledge retrieval tasks, a simple RAG pipeline is **faster** (one LLM call), **cheaper**, **more reliable** (linear, predictable), and **easier to debug**. Add an agent only when the task requires **adaptive multi-step reasoning, tool selection, or goal pursuit**. If a simple chain handles it, use a simple chain.

### The "Why Not Just Use an API?" Challenge
Every agent system must answer this. Honest answer: use an agent when the task requires **reasoning over variable inputs, adaptive action selection, and multi-step goal pursuit**. Use an API when the task is a **deterministic input → output mapping**. If your agent is just wrapping a single LLM call with a system prompt, it's an API with extra steps. Agents add cost, complexity, and nondeterminism. They're justified by adaptive intelligence.

---
## 6. Must-Know Terminology Glossary

| Term | Definition | Interview-Ready Definition |
|------|-----------|-------------------------|
| **ReAct** | Reasoning + Acting — agent loop: reason, act, observe, repeat | "Full agent loop. Distinct from CoT, which is just the reasoning step." |
| **Chain-of-Thought (CoT)** | Prompting technique generating intermediate reasoning steps | "A prompting technique, not an architecture. Improves reasoning but doesn't give tool invocation." |
| **Tool Use / Function Calling** | Model outputs structured JSON call mapped to a tool | "Function calling is the mechanism. Tool use is the semantic concept." |
| **Orchestration** | Central supervisor directs agents with explicit ordering | "Conductor-led. Used when reliability and ordering matter." |
| **Choreography** | Agents self-discover and communicate peer-to-peer | "Dancer-led. More flexible but less predictable than orchestration." |
| **Grounding** | Mapping LLM outputs to real-world state | "The core unsolved problem for physical agentic tasks." |
| **Hallucination** | Confident, factually incorrect output | "Mitigated via grounding, confidence thresholds, LLM-as-judge." |
| **Short-term Memory** | Immediate context — current turn, active state | "The context window at any given moment." |
| **Long-term Memory** | Persistent state across sessions | "External storage the agent retrieves from." |
| **Planning** | Agent decomposes a goal into sub-tasks | "The 'Think' step in the agent loop." |
| **Reflection** | Agent evaluates its own output | "The 'Reflect' step. Can trigger retry or escalation." |
| **LLM-as-Judge** | Separate model evaluating an agent's output | "Expensive but improves reliability for high-stakes outputs." |
| **Agentic Loop** | Observe → Think → Act → Reflect with termination condition | "The core agent runtime." |
| **Supervisor Pattern** | Single orchestrator calling sub-agents | "Most common production multi-agent pattern." |
| **Human-in-the-Loop (HITL)** | Agent pauses for human approval before proceeding | "Selectively — for irreversible or low-confidence actions." |
| **Task Decomposition** | Breaking a complex goal into sub-tasks | "Done by the agent implicitly or a planner module explicitly." |
| **Parallelization** | Agents working on independent sub-tasks simultaneously | "Only valuable when sub-tasks are genuinely independent." |
| **Guardrails** | Safety constraints preventing undesirable agent actions | "Not optional in production." |
| **Sandboxing** | Isolating agent tool execution in restricted environment | "Critical for security." |
| **Agent Persona** | System prompt defining agent behavior and constraints | "Persona drift is a real failure mode — guardrails enforce it." |
| **Context Injection** | Actively inserting relevant context into the prompt | "The art of selective injection. Too much dilutes; too little loses info." |
| **MCP** | Anthropic's protocol connecting models to tools/data | "USB for AI. Standardized tool and data protocol." |
| **A2A** | Google's protocol for inter-agent communication | "Peer-to-peer for agents. Complementary to MCP." |
| **BDI** | Agent mental state model: beliefs, desires, intentions | "Most rigorous agent model. Used in enterprise systems." |

---
*Last updated: 2026-04-29*