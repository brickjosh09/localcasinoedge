import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BasketballIcon,
  FootballIcon,
  BaseballIcon,
  HockeyIcon,
  TrophyIcon,
  TicketIcon,
} from '../components/SportIcons';

export const metadata: Metadata = {
  title: 'Learn Sports Betting — Education Hub | Local Casino Odds',
  description:
    'Learn positive expected value betting, arbitrage, how American odds work, what vig is, and why local casino lines are different. Clear guides for every level.',
};

interface Topic {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  content: { heading?: string; body: string }[];
  icon: React.ReactNode;
}

const TOPICS: Topic[] = [
  {
    id: 'ev',
    tag: 'Foundations',
    title: 'What Is Positive Expected Value (+EV)?',
    subtitle: 'The single concept that separates disciplined bettors from gamblers.',
    icon: <TrophyIcon className="h-5 w-5" />,
    content: [
      {
        body: "Expected value is the average return of a bet if you placed it hundreds or thousands of times. A positive expected value means the bet pays you more than its true risk — on average, you profit.",
      },
      {
        heading: 'The coin flip example',
        body: "Imagine flipping a fair coin: exactly 50% heads, 50% tails. If someone offers you +100 odds (even money) on heads, that's a fair bet — no edge for either side.\n\nNow imagine they offer you +120 on heads. That means you win $120 for every $100 risked. But the coin is still 50/50. You're being paid $120 for a risk that's only worth $100. Over 100 flips, you'd win about 50 and lose 50: +$6,000 vs -$5,000 = +$1,000 profit.\n\nThat's a +EV bet. Not every flip wins. But the math guarantees long-term profit if the edge is real.",
      },
      {
        heading: 'How we calculate EV',
        body: "EV% = (win probability × net odds) - (lose probability)\n\nWe use Pinnacle's no-vig odds to calculate the true win probability. If your local casino offers better odds than that true probability implies, you have a positive expected value. The bigger the difference, the bigger your edge.",
      },
      {
        heading: 'Why it takes volume',
        body: "A single +EV bet doesn't guarantee a win — it guarantees a mathematical edge. Over 10 bets, variance is high. Over 500 bets, the math dominates. Professional bettors don't evaluate individual results. They track their edge over time and trust the sample size.",
      },
    ],
  },
  {
    id: 'arbitrage',
    tag: 'Strategy',
    title: 'What Is Arbitrage Betting?',
    subtitle: 'How to lock in a guaranteed profit by betting both sides.',
    icon: <FootballIcon className="h-5 w-5" />,
    content: [
      {
        body: "Arbitrage (or 'arb') betting means placing bets on every possible outcome of an event across different sportsbooks, at odds that guarantee a profit regardless of which side wins. You bet both the Lakers and the Celtics — and you come out ahead either way.",
      },
      {
        heading: 'How is it possible?',
        body: "Different sportsbooks use different models and can disagree on probabilities. When one book has the Lakers at +165 and another has the Celtics at -145, the implied probabilities add up to less than 100%. That's an arbitrage window.\n\nYou size the bets correctly (more on the underdog side) and the combined return exceeds your total stake.",
      },
      {
        heading: 'A concrete example',
        body: "Event: Lakers vs Celtics\n\nLocal Casino: Lakers +165\nPinnacle: Celtics -145\n\nBet $100 on Lakers at your local book. Bet $125 on Celtics at Pinnacle. Total risk: $225.\n\nIf Lakers win: collect $265 (+$40 profit)\nIf Celtics win: collect $236 (+$11 profit)\n\nYou profit both ways. The arb profit is roughly 2-5% depending on the spread.",
      },
      {
        heading: 'The catch',
        body: "Arb windows are small and close fast. They require acting quickly. Local casino books are better for this because they move lines slower than the big online books — so windows last longer.",
      },
    ],
  },
  {
    id: 'odds',
    tag: 'Foundations',
    title: 'Understanding American Odds',
    subtitle: '-110, +150, -230 — what it all means and how to calculate payouts.',
    icon: <BasketballIcon className="h-5 w-5" />,
    content: [
      {
        body: "American odds (also called moneyline odds) express how much you win or lose relative to $100. They come in two forms: positive (underdog) and negative (favorite).",
      },
      {
        heading: 'Positive odds (+)',
        body: "+150 means: bet $100, win $150 profit (collect $250 total).\n\nPositive odds show what you win on a $100 bet. The higher the number, the bigger the underdog — and the more you win if they pull it off.",
      },
      {
        heading: 'Negative odds (-)',
        body: "-110 means: bet $110 to win $100 profit (collect $210 total).\n\nNegative odds show how much you have to risk to win $100. -200 means you bet $200 to win $100. -110 is the most common, used for spreads and totals.",
      },
      {
        heading: 'Converting to implied probability',
        body: "For positive odds: Implied prob = 100 / (odds + 100)\n+150 → 100 / (150 + 100) = 40% implied probability\n\nFor negative odds: Implied prob = |odds| / (|odds| + 100)\n-110 → 110 / (110 + 100) = 52.4% implied probability\n\nNote: If you add both sides of a game, the probabilities add up to more than 100%. That excess is the vig — the house's built-in margin.",
      },
      {
        heading: 'Decimal odds (international format)',
        body: "If you see odds like 2.50 or 1.91, that's the decimal format common in European sportsbooks. Decimal odds include your stake: 2.50 means bet $100, collect $250 (win $150). Our platform always shows American odds.",
      },
    ],
  },
  {
    id: 'vig',
    tag: 'Foundations',
    title: 'What Is Vig/Juice — and Why It Matters',
    subtitle: "The hidden tax in every line, and how removing it reveals the true odds.",
    icon: <HockeyIcon className="h-5 w-5" />,
    content: [
      {
        body: "Vig (short for vigorish) — also called juice or the house margin — is the built-in profit a sportsbook takes on every bet. It's why you have to bet $110 to win $100 on a standard spread instead of $100. The difference is their cut.",
      },
      {
        heading: 'How it works',
        body: "On a standard NFL spread, both sides might be priced at -110. If 100 bettors put $110 on each side, the book collects $22,000 total. They pay out $21,000 to the winners ($110 + $100 profit each). The remaining $1,000 is the vig.\n\nThat's roughly 4.5% vig — collected on every single bet, regardless of outcome.",
      },
      {
        heading: 'How we remove the vig',
        body: "To calculate the true probability of an event, we need to remove the book's margin. This is called converting to no-vig odds.\n\nFor a two-outcome market: normalize each side's implied probability so they sum to exactly 100%. The result is the sharp consensus view of the true probability — stripped of any markup.\n\nWe use Pinnacle's lines for this because Pinnacle has the industry's lowest vig (under 2%) and the sharpest lines in the world. Their no-vig prices are the closest available approximation of true probability.",
      },
      {
        heading: 'Why this matters for you',
        body: "If a local casino prices a side at -105 and the true probability (after removing vig) is 50%, you have a +EV bet — because -105 implies only 51.2% but the real probability is 50%. That tiny difference, multiplied over hundreds of bets, is real profit.",
      },
    ],
  },
  {
    id: 'local',
    tag: 'Strategy',
    title: 'Why Local Casino Lines Are Different',
    subtitle: "Regional books aren't connected to the same sharp markets. That's your edge.",
    icon: <BaseballIcon className="h-5 w-5" />,
    content: [
      {
        body: "The US sports betting landscape has two tiers: massive online books like DraftKings, FanDuel, and BetMGM — and regional casino sportsbooks that operate independently. The difference in how they set lines creates profitable opportunities.",
      },
      {
        heading: 'How national books price lines',
        body: "Large online sportsbooks use sophisticated algorithms and employ sharp traders. They track sharp money closely and adjust lines rapidly. Arbitrage opportunities close within seconds to minutes. The market is efficient.",
      },
      {
        heading: "How local casino books work",
        body: "Regional casino sportsbooks often employ smaller oddsmaking teams. They may copy lines from a major feed and then adjust manually based on local action. They're slower to respond to market movement, less connected to sharp betting networks, and more likely to misprice niche markets or secondary lines.\n\nThey're also subject to different pressures — a local customer betting big on the home team affects their lines differently than a sharp betting service.",
      },
      {
        heading: 'What this means for you',
        body: "Local books make more mistakes, and those mistakes last longer. A +EV window on DraftKings might close in 30 seconds. The same window at a local casino might stay open for hours. You have time to verify the bet, walk to the window, and place it at the right number.\n\nThis is why tools built for national online books are useless for local casino bettors — and why we built this.",
      },
      {
        heading: 'The size advantage',
        body: "Large online books actively limit winning accounts. If you consistently beat them, they'll cap your max bet to $50 and eventually restrict you to tiny amounts. Local casinos have much higher limits and are far less likely to restrict recreational sharp bettors. Your edge has more room to compound.",
      },
    ],
  },
  {
    id: 'bankroll',
    tag: 'Strategy',
    title: 'Bankroll Management Basics',
    subtitle: "Size your bets mathematically. The Kelly Criterion explained without the math degree.",
    icon: <TicketIcon className="h-5 w-5" />,
    content: [
      {
        body: "Bankroll management is the discipline of sizing bets to survive variance while maximizing long-term growth. Even if every bet you make is +EV, betting too large can wipe out your bankroll before the math can catch up. Sizing too small leaves money on the table.",
      },
      {
        heading: 'The Kelly Criterion',
        body: "The Kelly Criterion is a formula that calculates the mathematically optimal bet size as a fraction of your bankroll:\n\nf = (b × p − q) / b\n\nWhere:\nb = net odds (decimal odds minus 1)\np = probability of winning\nq = probability of losing (1 − p)\n\nFor a +EV bet with 52% win probability at -105 odds: b ≈ 0.952, p = 0.52, q = 0.48\nKelly = (0.952 × 0.52 − 0.48) / 0.952 ≈ 1.7% of bankroll",
      },
      {
        heading: 'Quarter-Kelly in practice',
        body: "Full Kelly is mathematically optimal but psychologically brutal — it produces massive swings. Most professional bettors use half-Kelly or quarter-Kelly, reducing the bet size proportionally. The expected growth is lower, but the variance is far more survivable.\n\nOur dashboard shows quarter-Kelly values for each opportunity. For most bettors with a modest bankroll, this is a sensible starting point.",
      },
      {
        heading: 'Flat betting vs proportional',
        body: "Flat betting (always risking $X) is simpler but not optimal. Proportional betting (a percentage of current bankroll) grows your bankroll faster when you're winning and protects it when you're losing. We recommend starting with proportional sizing using the quarter-Kelly values we show.",
      },
      {
        heading: 'A practical example',
        body: "Bankroll: $1,000\nOpportunity: +4.2% EV, Kelly suggests 2.3% of bankroll\nQuarter-Kelly bet: $23\n\nThat may feel small. That's the point. You're betting dozens of these over weeks. Small sizes on every bet means you can survive a 10-bet losing streak — which happens — and still be in the game to profit when the edge asserts itself over 200 bets.",
      },
    ],
  },
];

function TopicSection({ topic }: { topic: Topic }) {
  return (
    <section id={topic.id} className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        {/* Header */}
        <div className="px-7 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex-shrink-0">
              {topic.icon}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              {topic.tag}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{topic.title}</h2>
          <p className="text-slate-400">{topic.subtitle}</p>
        </div>

        {/* Content blocks */}
        <div className="px-7 py-6 space-y-5">
          {topic.content.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2">
                  {block.heading}
                </h3>
              )}
              {block.body.split('\n\n').map((para, j) => (
                para.includes('\n') ? (
                  <div key={j} className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3 mb-3 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-line scoreboard-num">
                    {para}
                  </div>
                ) : (
                  <p key={j} className="text-slate-300 text-sm leading-relaxed mb-3 last:mb-0">{para}</p>
                )
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-10 sm:py-14 stadium-glow">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Education Hub</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Learn How to Bet Smarter
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            Six guides covering the math and strategy behind positive expected value betting.
            No prior experience required — we assume you know nothing except how to walk into a casino.
          </p>
          {/* Sport icons row — decorative */}
          <div className="flex items-center justify-center gap-5 mt-8 text-slate-700">
            <BasketballIcon className="h-6 w-6" />
            <FootballIcon className="h-6 w-6" />
            <BaseballIcon className="h-6 w-6" />
            <HockeyIcon className="h-6 w-6" />
            <TrophyIcon className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Topic nav */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TOPICS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm font-medium text-slate-300 hover:border-green-500/40 hover:text-green-400 transition-colors"
            >
              <span className="text-slate-500 group-hover:text-green-400">{t.icon}</span>
              {t.title.replace('What Is ', '').replace('Understanding ', '').replace('Why ', '').split('—')[0].trim()}
            </a>
          ))}
        </div>

        {/* Topics */}
        <div className="space-y-8">
          {TOPICS.map((topic) => (
            <TopicSection key={topic.id} topic={topic} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-green-500/20 bg-green-500/5 px-8 py-10 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Ready to put this into practice?</h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
            The dashboard shows you live +EV opportunities at your local casino right now.
            Every card shows the EV%, true probability, and Kelly-sized bet recommendation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20"
            >
              View Live Dashboard
            </Link>
            <Link
              href="/#pricing"
              className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
