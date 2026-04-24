# HYPERVAULT — Frontend Developer Prompt
## AI Agent Trading Platform on Monad Testnet

---

## CONTEXT: What You're Building

You are building the frontend for **Hypervault**, a DeFi hedge fund marketplace where users discover AI trading agents, delegate USDC capital to them, and earn pro-rata profit shares. The contracts are already deployed on Monad Testnet. Your job is to wire the UI to those contracts using **wagmi + viem**, present real-time agent leaderboard data, and let users manage their delegations — all as a PWA.

**Do not wait for real on-chain data. Use the mock seed data provided by the backend developer until live contract events are available. Build with real data shapes from day one so the swap to live data is a one-line change.**

---

## Tech Stack (hard requirements — no substitutions)

| Layer | Tool |
|---|---|
| Framework | **Next.js 14** (App Router) OR **Vite + React 18** |
| Web3 | **wagmi v2 + viem v2** |
| Wallet | **MetaMask** (minimum), RainbowKit optional |
| Styling | Tailwind CSS v3 |
| State | Zustand (client state), React Query / wagmi hooks (server + chain state) |
| PWA | `next-pwa` (Next.js) OR `vite-plugin-pwa` (Vite) |
| Package manager | pnpm |

---

## Network Configuration

```typescript
// lib/chains.ts
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public:  { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});
```

```typescript
// lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { monadTestnet } from "./chains";

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [metaMask()],
  transports: { [monadTestnet.id]: http() },
});
```

---

## Contract ABIs & Addresses

Store ABIs in `lib/abis/` and addresses in `lib/contracts.ts`. The backend will provide the deployed addresses from `deployments/monad-testnet.json`. Use this shape:

```typescript
// lib/contracts.ts
export const CONTRACTS = {
  MockUSDC:        "0x...",   // fill from deployments/monad-testnet.json
  AgentRegistry:   "0x...",
  DelegationVault: "0x...",
  PlatformFee:     "0x...",
} as const;
```

Minimal ABIs you need (expand as you add features):

```typescript
// lib/abis/AgentRegistry.ts
export const AgentRegistryABI = [
  // READ
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "agentId",        type: "uint256" },
        { name: "owner",          type: "address" },
        { name: "name",           type: "string"  },
        { name: "strategy",       type: "string"  },
        { name: "tradingThesis",  type: "string"  },
        { name: "feePercent",     type: "uint256" },
        { name: "registeredAt",   type: "uint256" },
        { name: "totalTrades",    type: "uint256" },
        { name: "reputationScore",type: "uint256" },
        { name: "isActive",       type: "bool"    },
      ],
    }],
  },
  {
    name: "isAgentActive",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "totalAgents",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // WRITE
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name",          type: "string"  },
      { name: "strategy",      type: "string"  },
      { name: "tradingThesis", type: "string"  },
      { name: "feePercent",    type: "uint256" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "submitReview",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "rating",  type: "uint8"   },
      { name: "comment", type: "string"  },
    ],
    outputs: [],
  },
] as const;

// lib/abis/DelegationVault.ts
export const DelegationVaultABI = [
  // READ
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "totalPrincipal",    type: "uint256" },
        { name: "accRewardPerShare", type: "uint256" },
        { name: "totalDistributed",  type: "uint256" },
        { name: "operatorRewards",   type: "uint256" },
      ],
    }],
  },
  {
    name: "getPosition",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "user",    type: "address" },
    ],
    outputs: [{
      type: "tuple",
      components: [
        { name: "principal",      type: "uint256" },
        { name: "rewardDebt",     type: "uint256" },
        { name: "pendingRewards", type: "uint256" },
        { name: "depositedAt",    type: "uint256" },
      ],
    }],
  },
  {
    name: "pendingReward",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "user",    type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  // WRITE
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "claimRewards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
  },
] as const;

// lib/abis/MockUSDC.ts  (standard ERC20 — only what you need)
export const MockUSDCABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
```

---

## Data Types (shared with backend — use these everywhere)

```typescript
// types/index.ts

/** Matches AgentInfo struct from AgentRegistry.sol */
export interface Agent {
  agentId:        bigint;
  owner:          `0x${string}`;
  name:           string;
  strategy:       string;
  tradingThesis:  string;
  feePercent:     bigint;   // basis points, divide by 100 for %
  registeredAt:   bigint;   // unix timestamp
  totalTrades:    bigint;
  reputationScore:bigint;
  isActive:       boolean;
}

/** Off-chain performance stats seeded by backend */
export interface AgentStats {
  agentId:       number;
  returnPct30d:  number;    // e.g. 12.4 = +12.4%
  sharpeRatio:   number;    // e.g. 2.1
  maxDrawdown:   number;    // e.g. -5.2 = -5.2%
  winRate:       number;    // 0-100
  totalAumUsdc:  number;    // raw USDC (6 dec) stored as JS number for display
  priceHistory:  PricePoint[]; // 30-day equity curve
}

export interface PricePoint {
  timestamp: number;  // unix
  value:     number;  // index starting at 100
}

/** Merged view used by leaderboard and profile pages */
export interface AgentViewModel extends Agent, AgentStats {}

/** Delegator position from DelegationVault */
export interface Position {
  agentId:        bigint;
  principal:      bigint;   // USDC 6-decimal
  pendingRewards: bigint;   // USDC 6-decimal
  depositedAt:    bigint;
}

/** Pool summary for an agent */
export interface AgentPool {
  totalPrincipal:    bigint;
  totalDistributed:  bigint;
  operatorRewards:   bigint;
}
```

---

## Routing Structure

```
app/
├── page.tsx                   →  /              Leaderboard
├── agent/
│   └── [id]/
│       └── page.tsx           →  /agent/:id     Agent Profile
├── dashboard/
│   └── page.tsx               →  /dashboard     Delegator Dashboard
├── layout.tsx                 →  Root layout (Providers, Nav, PWA meta)
└── api/
    └── agents/
        └── route.ts           →  GET /api/agents  (proxy to backend JSON or seed data)
```

---

## Page Specifications

### 1. `/` — Leaderboard

**Purpose:** Discover and rank all active AI agents.

**Data sources:**
- Agent list: `GET /api/agents` (backend seed JSON)
- On-chain AUM: `useReadContracts` batch-reading `getPool(agentId)` for each agent
- Merge off-chain stats with on-chain AUM before rendering

**UI Requirements:**

```
┌─────────────────────────────────────────────┐
│  HYPERVAULT                    [Connect]    │
├─────────────────────────────────────────────┤
│  Leaderboard       Sort: [30d Return ▼]    │
│  Filter: [All] [Active] [Top Sharpe]        │
├──┬──────────────┬───────┬───────┬──────┬───┤
│# │ Agent        │ 30d % │Sharpe │ AUM  │Fee│
├──┼──────────────┼───────┼───────┼──────┼───┤
│1 │ AlphaBot     │+18.2% │  2.4  │$120k │10%│
│2 │ BetaBot      │+12.1% │  1.9  │ $85k │ 5%│
│  │ ...          │       │       │      │   │
└──┴──────────────┴───────┴───────┴──────┴───┘
```

- Clicking a row navigates to `/agent/:id`
- Sort by: 30d Return, Sharpe Ratio, AUM, Total Trades
- Filter toggles: All / Active only / Rating ≥ 4
- Each row shows a mini sparkline (7-day equity curve)
- If wallet not connected, show a "Connect to Delegate" CTA

**Wagmi hooks needed:**
```typescript
// Read all pools in one multicall
const { data: pools } = useReadContracts({
  contracts: agentIds.map(id => ({
    address: CONTRACTS.DelegationVault,
    abi: DelegationVaultABI,
    functionName: "getPool",
    args: [BigInt(id)],
  })),
});
```

---

### 2. `/agent/:id` — Agent Profile

**Purpose:** Full detail view of a single agent. Primary conversion page — user clicks "Delegate" here.

**Data sources:**
- On-chain info: `useReadContract(getAgent, agentId)`
- Off-chain stats: `GET /api/agents/:id`
- User's position: `useReadContract(getPosition, agentId, address)` (if connected)
- Pending rewards: `useReadContract(pendingReward, agentId, address)`
- Reviews: `useReadContract(getReviews, agentId)` — returns `AgentReview[]`

**UI Requirements:**

```
┌──────────────────────────────────────────────┐
│ ← Back          AlphaBot              Active │
│ "Momentum breakout on USDC/WMON"             │
│ Owner: 0x1234…abcd                           │
├──────────┬───────────────────────────────────┤
│  Stats   │  30d Equity Curve (line chart)    │
│  +18.2%  │                                   │
│  Sharpe  │  ~~~~~~~~~~~~~~~~                 │
│   2.4    │                                   │
│  Trades  │                                   │
│   847    │                                   │
├──────────┴───────────────────────────────────┤
│  Your Position                               │
│  Principal:  1,000.00 USDC                   │
│  Rewards:       12.40 USDC  [Claim]          │
│  [Deposit]  [Withdraw]                       │
├──────────────────────────────────────────────┤
│  Trading Thesis                              │
│  "Ride short-term momentum shifts..."        │
├──────────────────────────────────────────────┤
│  Reviews  ★★★★☆  (12 reviews)              │
│  ┌────────────────────────────────────────┐  │
│  │ 0xabc… ★★★★★  "Excellent alpha gen" │  │
│  └────────────────────────────────────────┘  │
│  [Write a Review]  (only if past delegator)  │
└──────────────────────────────────────────────┘
```

**Delegation flow (Deposit):**

```typescript
// hooks/useDeposit.ts
export function useDeposit(agentId: bigint) {
  const { writeContractAsync } = useWriteContract();

  async function deposit(amountUsdc: string) {
    const amount = parseUnits(amountUsdc, 6); // USDC is 6 decimals

    // Step 1: Approve vault to spend USDC
    await writeContractAsync({
      address: CONTRACTS.MockUSDC,
      abi: MockUSDCABI,
      functionName: "approve",
      args: [CONTRACTS.DelegationVault, amount],
    });

    // Step 2: Deposit into vault
    await writeContractAsync({
      address: CONTRACTS.DelegationVault,
      abi: DelegationVaultABI,
      functionName: "deposit",
      args: [agentId, amount],
    });
  }

  return { deposit };
}
```

Show a 2-step progress indicator during deposit: "1/2 Approving USDC → 2/2 Depositing".

**Withdraw flow:**
```typescript
async function withdraw(amountUsdc: string) {
  const amount = parseUnits(amountUsdc, 6);
  await writeContractAsync({
    address: CONTRACTS.DelegationVault,
    abi: DelegationVaultABI,
    functionName: "withdraw",
    args: [agentId, amount],
  });
  // withdraw() also auto-harvests pending rewards — show combined tx confirmation
}
```

**Review form:**
- Only render if `hasDelegated[agentId][address]` is true (read from registry)
- Star rating input (1–5) + optional text comment
- Submit calls `submitReview(agentId, rating, comment)`

---

### 3. `/dashboard` — Delegator Dashboard

**Purpose:** User's personal portfolio view across all agents they've delegated to.

**Data sources:**
- Read positions across all known agent IDs (batch `getPosition` calls)
- Filter to positions where `principal > 0n || pendingRewards > 0n`
- USDC balance: `useReadContract(balanceOf, address)` on MockUSDC
- Total pending rewards: sum of `pendingReward(agentId, address)` for each active position

**UI Requirements:**

```
┌──────────────────────────────────────────────┐
│  Dashboard                0xabc…1234         │
│                                              │
│  USDC Balance:   5,420.00                    │
│  Total Delegated: 3,000.00                   │
│  Pending Rewards:    48.20    [Claim All]    │
│                                              │
│  Your Positions                              │
│  ┌──────────────┬──────────┬────────┬──────┐ │
│  │ Agent        │Principal │Rewards │      │ │
│  ├──────────────┼──────────┼────────┼──────┤ │
│  │ AlphaBot     │ 2,000.00 │  32.10 │[Act] │ │
│  │ BetaBot      │ 1,000.00 │  16.10 │[Act] │ │
│  └──────────────┴──────────┴────────┴──────┘ │
│                                              │
│  [Explore Agents →]                          │
└──────────────────────────────────────────────┘
```

- "Claim All" button iterates over all positions with `pendingRewards > 0n` and fires `claimRewards` sequentially
- Each row's [Act] button opens an inline action panel: Deposit more / Withdraw / Claim
- Redirect to `/` if no wallet connected
- Show empty state with CTA if no positions

---

## Custom Hooks Reference

Build these hooks in `hooks/`:

```typescript
// hooks/useAgentList.ts
// Fetches all agents from /api/agents, merges with on-chain pool data
// Returns: AgentViewModel[] sorted by 30d return desc

// hooks/useAgent.ts
// Fetches single agent on-chain info + off-chain stats for a given agentId
// Returns: { agent: AgentViewModel, pool: AgentPool, isLoading }

// hooks/usePosition.ts
// Reads delegator position + pending reward for connected wallet
// Returns: { position: Position, pendingReward: bigint, isLoading }

// hooks/useDeposit.ts
// Handles approve + deposit 2-step flow with status tracking
// Returns: { deposit(agentId, amount), status: "idle"|"approving"|"depositing"|"success"|"error" }

// hooks/useWithdraw.ts
// Returns: { withdraw(agentId, amount), status }

// hooks/useClaimRewards.ts
// Returns: { claim(agentId), claimAll(agentIds), status }

// hooks/useUSDCBalance.ts
// Returns: { balance: bigint, formatted: string } for connected wallet
```

---

## USDC Formatting Utility

```typescript
// lib/format.ts
import { formatUnits } from "viem";

/** Format a 6-decimal USDC bigint for display */
export function formatUSDC(amount: bigint, decimals = 2): string {
  return parseFloat(formatUnits(amount, 6)).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format basis points as a percentage string */
export function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(1)}%`;
}

/** Shorten an address for display */
export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
```

---

## PWA Configuration

```typescript
// next.config.js (if using Next.js)
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

```json
// public/manifest.json
{
  "name": "Hypervault",
  "short_name": "Hypervault",
  "description": "AI Agent Hedge Fund Marketplace",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#0a0a0f",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Transaction Status UI Pattern

Use this pattern consistently across all write operations:

```typescript
type TxStatus = "idle" | "waiting-wallet" | "pending" | "success" | "error";

// Toast/banner messages per status:
// waiting-wallet → "Waiting for MetaMask confirmation..."
// pending        → "Transaction submitted. Waiting for inclusion..."  + tx hash link
// success        → "Done! View on explorer →" + link to testnet.monadexplorer.com/tx/:hash
// error          → Display the revert reason from viem if available
```

---

## Error Handling

Map Solidity custom errors to user-friendly messages:

```typescript
// lib/errors.ts
export const CONTRACT_ERRORS: Record<string, string> = {
  "DelegationVault__ZeroAmount":         "Amount must be greater than zero.",
  "DelegationVault__AgentNotActive":     "This agent is currently inactive.",
  "DelegationVault__InsufficientBalance":"Withdrawal amount exceeds your deposited balance.",
  "DelegationVault__NoRewards":          "You have no rewards to claim.",
  "AgentRegistry__AlreadyReviewed":      "You have already reviewed this agent.",
  "AgentRegistry__NotEligibleReviewer":  "You must delegate to this agent before reviewing.",
  "AgentRegistry__FeeTooHigh":           "Fee exceeds the 20% maximum.",
};

export function parseContractError(err: unknown): string {
  // viem will expose err.cause.reason for revert reasons
  const msg = (err as any)?.cause?.reason ?? String(err);
  return CONTRACT_ERRORS[msg] ?? "Transaction failed. Check your wallet and try again.";
}
```

---

## Testnet USDC Faucet Button

Since MockUSDC has an unrestricted `mint()`, expose a faucet in the UI:

```typescript
// components/FaucetButton.tsx
// Calls MockUSDC.mint(connectedAddress, 10000_000000n) — mints 10,000 USDC
// Show only when on Monad Testnet (chainId === 10143) and wallet is connected
// Button label: "Get Test USDC" — helps onboard testers quickly
```

---

## File Structure

```
hypervault-frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← /  (Leaderboard)
│   ├── agent/[id]/page.tsx   ← /agent/:id
│   ├── dashboard/page.tsx    ← /dashboard
│   └── providers.tsx         ← WagmiProvider + QueryClientProvider
├── components/
│   ├── Nav.tsx
│   ├── WalletButton.tsx
│   ├── AgentCard.tsx
│   ├── LeaderboardTable.tsx
│   ├── SparklineChart.tsx
│   ├── EquityChart.tsx        ← 30-day line chart (recharts or lightweight-charts)
│   ├── DepositModal.tsx
│   ├── WithdrawModal.tsx
│   ├── ReviewForm.tsx
│   ├── PositionCard.tsx
│   └── FaucetButton.tsx
├── hooks/
│   ├── useAgentList.ts
│   ├── useAgent.ts
│   ├── usePosition.ts
│   ├── useDeposit.ts
│   ├── useWithdraw.ts
│   ├── useClaimRewards.ts
│   └── useUSDCBalance.ts
├── lib/
│   ├── wagmi.ts
│   ├── chains.ts
│   ├── contracts.ts
│   ├── format.ts
│   ├── errors.ts
│   └── abis/
│       ├── AgentRegistry.ts
│       ├── DelegationVault.ts
│       └── MockUSDC.ts
├── types/
│   └── index.ts
├── public/
│   └── manifest.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Definition of Done

- [ ] PWA installable on mobile (passes Lighthouse PWA audit)
- [ ] Wallet connects on MetaMask, switches to Monad Testnet automatically if wrong chain
- [ ] `/` renders leaderboard from mock data with live on-chain AUM merged in
- [ ] `/agent/:id` shows chart, stats, position, and review section
- [ ] `/dashboard` shows all user positions with live pending rewards
- [ ] Deposit flow completes end-to-end on Monad Testnet (approve → deposit)
- [ ] Withdraw flow completes end-to-end
- [ ] Claim rewards flow completes end-to-end
- [ ] All USDC amounts displayed with 2 decimal precision
- [ ] All txns show explorer link on success
- [ ] Custom errors surfaced as readable messages
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes clean)