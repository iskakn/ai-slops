<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		playGuessWrong,
		playGuessCorrect,
		playFanfare,
		isAudioMuted,
		toggleAudioMute,
		triggerConfetti
	} from '#lib';

	const TOTAL_CYCLES = 5;
	const CHOICES = [0, 1, 2, 3, 4] as const;

	type GameState = 'idle' | 'playing' | 'cycle-won' | 'finished';

	interface CycleHistory {
		cycle: number;
		secretNumber: number;
		tries: number;
		guesses: number[];
	}

	let phase = $state<GameState>('idle');
	let currentCycle = $state<number>(1);
	let secretNumber = $state<number>(0);
	let currentCycleTries = $state<number>(0);
	let currentCycleGuesses = $state<number[]>([]);
	let history = $state<CycleHistory[]>([]);
	let lastGuess = $state<number | null>(null);
	let lastGuessWasWrong = $state<boolean>(false);
	let audioMuted = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let bestTotalTries = $state<number | null>(null);
	let autoNextTimer: ReturnType<typeof setTimeout> | null = null;

	// Load stored personal record
	if (typeof window !== 'undefined') {
		audioMuted = isAudioMuted();
		const saved = localStorage.getItem('ai_slops_guess_number_best_tries');
		if (saved) {
			const parsed = Number(saved);
			if (!isNaN(parsed) && parsed > 0) {
				bestTotalTries = parsed;
			}
		}
	}

	const totalTries = $derived.by(() => {
		const pastTries = history.reduce((sum, c) => sum + c.tries, 0);
		return pastTries + (phase === 'cycle-won' ? 0 : currentCycleTries);
	});

	const firstTryCount = $derived.by(() => {
		return history.filter((c) => c.tries === 1).length;
	});

	const avgTriesPerCycle = $derived.by(() => {
		if (history.length === 0) return '0.0';
		const total = history.reduce((sum, c) => sum + c.tries, 0);
		return (total / history.length).toFixed(1);
	});

	function getRank(total: number, firstTries: number): { title: string; badge: string; color: string } {
		if (total === 5) return { title: 'Omniscient Oracle', badge: '🔮 100% Pure ESP', color: '#a855f7' };
		if (total <= 7 || firstTries >= 3) return { title: 'Mind Reader', badge: '⚡ High Intuition', color: '#38bdf8' };
		if (total <= 10) return { title: 'Sixth Sense', badge: '🎯 Sharp Instincts', color: '#10b981' };
		if (total <= 14) return { title: 'Average Human', badge: '🎲 Balanced Luck', color: '#f59e0b' };
		return { title: 'The Anti-Psychic', badge: '🌀 Defied All Odds', color: '#f43f5e' };
	}

	const rankInfo = $derived(getRank(totalTries, firstTryCount));

	function pickNewSecret(): number {
		return Math.floor(Math.random() * 5);
	}

	function startGame(): void {
		clearAutoTimer();
		history = [];
		currentCycle = 1;
		currentCycleTries = 0;
		currentCycleGuesses = [];
		lastGuess = null;
		lastGuessWasWrong = false;
		copied = false;
		secretNumber = pickNewSecret();
		phase = 'playing';
	}

	function clearAutoTimer(): void {
		if (autoNextTimer) {
			clearTimeout(autoNextTimer);
			autoNextTimer = null;
		}
	}

	function makeGuess(num: number): void {
		if (phase !== 'playing') return;

		lastGuess = num;
		currentCycleTries += 1;
		currentCycleGuesses = [...currentCycleGuesses, num];

		if (num === secretNumber) {
			// Correct guess!
			lastGuessWasWrong = false;
			playGuessCorrect(currentCycleTries);
			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate?.([40, 30, 40]);
			}

			history = [
				...history,
				{
					cycle: currentCycle,
					secretNumber,
					tries: currentCycleTries,
					guesses: [...currentCycleGuesses]
				}
			];

			if (currentCycle >= TOTAL_CYCLES) {
				finishGame();
			} else {
				phase = 'cycle-won';
				// Snappy auto advance to next cycle
				autoNextTimer = setTimeout(() => {
					advanceToNextCycle();
				}, 1100);
			}
		} else {
			// Wrong guess (no hints, infinite tries!)
			lastGuessWasWrong = true;
			playGuessWrong();
			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate?.(40);
			}
		}
	}

	function advanceToNextCycle(): void {
		clearAutoTimer();
		currentCycle += 1;
		currentCycleTries = 0;
		currentCycleGuesses = [];
		lastGuess = null;
		lastGuessWasWrong = false;
		secretNumber = pickNewSecret();
		phase = 'playing';
	}

	function finishGame(): void {
		clearAutoTimer();
		phase = 'finished';
		const finalTotal = history.reduce((sum, c) => sum + c.tries, 0);

		if (!bestTotalTries || finalTotal < bestTotalTries) {
			bestTotalTries = finalTotal;
			if (typeof window !== 'undefined') {
				localStorage.setItem('ai_slops_guess_number_best_tries', finalTotal.toString());
			}
		}

		playFanfare();
	}

	function handleToggleSound(): void {
		audioMuted = toggleAudioMute();
	}

	function copyResults(): void {
		const lines = [
			`🔮 Guess the Number (0 to 4) - 5 Cycles Benchmark:`,
			`🏆 Rank: ${rankInfo.title} (${rankInfo.badge})`,
			`🎯 Total Tries: ${totalTries} (Avg: ${avgTriesPerCycle} tries/cycle)`,
			`✨ First-Try Hits: ${firstTryCount} / 5 cycles`,
			`📊 Cycles: ${history.map((h) => `C${h.cycle}: ${h.tries} ${h.tries === 1 ? '🎯' : 'tries'}`).join(' | ')}`
		].join('\n');

		navigator.clipboard.writeText(lines).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2500);
		});
	}

	// Keyboard controls (Keys 0-4)
	function onKeyDown(e: KeyboardEvent): void {
		if (phase !== 'playing') return;
		const target = e.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

		const num = Number(e.key);
		if (!isNaN(num) && num >= 0 && num <= 4) {
			e.preventDefault();
			makeGuess(num);
		}
	}

	onDestroy(() => {
		clearAutoTimer();
	});
</script>

<svelte:window onkeydown={onKeyDown} />

{#if phase === 'finished'}
	<canvas {@attach (canvas: HTMLCanvasElement) => triggerConfetti(canvas)} class="confetti-canvas"></canvas>
{/if}

<div class="page-container">
	<!-- Top Navigation -->
	<header class="top-nav">
		<a href={resolve('/')} class="nav-btn" title="Back to Home">
			← Home
		</a>

		<div class="nav-title-group">
			<span class="badge-series">🔮 Guess 0 to 4 • 5 Cycles</span>
		</div>

		<div class="nav-controls">
			<button class="nav-btn" onclick={handleToggleSound} aria-label="Toggle Sound">
				{audioMuted ? '🔇 Muted' : '🔊 Sound On'}
			</button>
			{#if phase !== 'idle'}
				<button class="nav-btn" onclick={() => (phase = 'idle')}>Reset</button>
			{/if}
		</div>
	</header>

	<!-- Main Stage -->
	<main class="content-wrapper">
		{#if phase === 'idle'}
			<div class="card idle-card">
				<div class="crystal-icon">🔮</div>
				<h1 class="card-title">Guess the Number</h1>
				<p class="card-subtitle">
					The computer picks a secret number from <strong>0 to 4</strong>.
				</p>

				<div class="rules-card">
					<div class="rules-badge">Game Rules</div>
					<ul class="rules-list">
						<li><strong>5 Cycles</strong> in total.</li>
						<li>Numbers are only between <strong>0 and 4</strong> (5 possibilities).</li>
						<li><strong>Infinite tries</strong>: keep guessing until you find it!</li>
						<li><strong>No hints</strong> (no higher/lower) — purely your intuition!</li>
					</ul>
				</div>

				{#if bestTotalTries}
					<div class="record-pill">
						🏆 Personal Best: <strong>{bestTotalTries} total tries</strong> ({(bestTotalTries / 5).toFixed(1)} avg/cycle)
					</div>
				{/if}

				<button class="start-btn" onclick={startGame}>
					✨ Start 5-Cycle Test
				</button>
			</div>

		{:else if phase === 'playing' || phase === 'cycle-won'}
			<div class="card game-card">
				<!-- Cycle Tracker -->
				<div class="cycle-progress">
					<div class="cycle-label">
						Cycle <strong>{currentCycle}</strong> of {TOTAL_CYCLES}
					</div>
					<div class="cycle-dots">
						{#each Array(TOTAL_CYCLES) as _, idx (idx)}
							{@const cycleNum = idx + 1}
							{@const completed = history.find((h) => h.cycle === cycleNum)}
							<div
								class="cycle-pill"
								class:active={cycleNum === currentCycle}
								class:done={Boolean(completed)}
							>
								{#if completed}
									<span class="pill-done">{completed.tries}{completed.tries === 1 ? ' 🎯' : 't'}</span>
								{:else}
									<span class="pill-num">C{cycleNum}</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Secret Number Mystery Card -->
				<div
					class="mystery-box"
					class:is-revealed={phase === 'cycle-won'}
					class:is-shake={lastGuessWasWrong}
				>
					{#if phase === 'cycle-won'}
						<div class="reveal-number">{secretNumber}</div>
						<div class="reveal-sub">
							{currentCycleTries === 1 ? '✨ First-try psychic hit! 🎯' : `Found in ${currentCycleTries} tries!`}
						</div>
					{:else}
						<div class="mystery-question">?</div>
						<div class="mystery-status">
							{#if currentCycleTries === 0}
								Pick a number (0 - 4)
							{:else if lastGuessWasWrong}
								<span class="wrong-text">Not {lastGuess}! Try again.</span>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Tries HUD for this cycle -->
				<div class="tries-counter">
					<span>Tries this cycle: <strong>{currentCycleTries}</strong></span>
					<span class="divider">•</span>
					<span>Total tries: <strong>{totalTries}</strong></span>
				</div>

				<!-- Interactive Guess Buttons (0 to 4) -->
				<div class="guess-grid">
					{#each CHOICES as num (num)}
						{@const isGuessedThisCycle = currentCycleGuesses.includes(num)}
						{@const isWinningNumber = phase === 'cycle-won' && secretNumber === num}
						<button
							class="guess-btn"
							class:correct={isWinningNumber}
							class:tried={isGuessedThisCycle && !isWinningNumber && phase === 'playing'}
							disabled={phase === 'cycle-won'}
							onclick={() => makeGuess(num)}
							aria-label={`Guess number ${num}`}
						>
							<span class="btn-num">{num}</span>
							<kbd class="key-hint">{num}</kbd>
						</button>
					{/each}
				</div>

				{#if phase === 'cycle-won'}
					<div class="advancing-bar">
						<button class="next-btn" onclick={advanceToNextCycle}>
							Next Cycle →
						</button>
					</div>
				{/if}
			</div>

		{:else if phase === 'finished'}
			<div class="card result-card">
				<div class="crown-icon">👑</div>
				<h2 class="finish-title">{rankInfo.title}</h2>
				<div class="rank-badge" style:background-color={rankInfo.color + '25'} style:color={rankInfo.color}>
					{rankInfo.badge}
				</div>

				<div class="highlight-metric">
					<div class="metric-label">Total Tries (5 Cycles)</div>
					<div class="metric-val">
						<span class="big-num">{totalTries}</span>
						<span class="tries-unit">tries</span>
					</div>
				</div>

				<div class="stats-row">
					<div class="stat-cell">
						<div class="cell-label">🔮 First-Try Hits</div>
						<div class="cell-val">{firstTryCount} / {TOTAL_CYCLES}</div>
					</div>
					<div class="stat-cell">
						<div class="cell-label">📊 Avg Per Cycle</div>
						<div class="cell-val">{avgTriesPerCycle} tries</div>
					</div>
					<div class="stat-cell">
						<div class="cell-label">🏆 Best All-Time</div>
						<div class="cell-val">{bestTotalTries} tries</div>
					</div>
				</div>

				<!-- Cycle by cycle breakdown table -->
				<div class="history-table-box">
					<div class="table-header">Cycle Breakdown</div>
					<div class="history-grid">
						{#each history as item (item.cycle)}
							<div class="history-row">
								<span class="hr-cycle">Cycle {item.cycle}</span>
								<span class="hr-secret">Secret: <strong>{item.secretNumber}</strong></span>
								<span class="hr-tries" class:gold={item.tries === 1}>
									{item.tries} {item.tries === 1 ? 'try 🎯' : 'tries'}
								</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Action buttons -->
				<div class="btn-row">
					<button class="primary-btn" onclick={startGame}>
						🔄 Play Again
					</button>
					<button class="secondary-btn" onclick={copyResults}>
						{copied ? '✅ Copied to Clipboard!' : '📋 Share Score'}
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: radial-gradient(circle at 50% 15%, #2e1065 0%, #0f172a 65%, #050510 100%);
		color: #f1f5f9;
		user-select: none;
		-webkit-user-select: none;
		min-height: 100vh;
	}

	.confetti-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 100;
	}

	.page-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 1.25rem;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Top Navigation */
	.top-nav {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 20;
		margin-bottom: 2rem;
	}

	.nav-btn {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.16);
		color: #e2e8f0;
		padding: 0.5rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.88rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition: all 0.15s ease;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.badge-series {
		background: rgba(168, 85, 247, 0.18);
		border: 1px solid rgba(168, 85, 247, 0.35);
		color: #d8b4fe;
		padding: 0.35rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.nav-controls {
		display: flex;
		gap: 0.5rem;
	}

	/* Content Area */
	.content-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.card {
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.75rem;
		padding: 2.2rem 2rem;
		text-align: center;
		max-width: 540px;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 25px 50px -15px rgba(0, 0, 0, 0.6);
		animation: fadeInScale 0.22s ease-out;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Idle card */
	.crystal-icon {
		font-size: 3.8rem;
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 0 24px rgba(168, 85, 247, 0.6));
	}

	.card-title {
		font-size: 2.1rem;
		font-weight: 900;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.card-subtitle {
		font-size: 1.05rem;
		color: #94a3b8;
		margin: 0 0 1.6rem;
		line-height: 1.5;
	}

	.rules-card {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.2rem;
		text-align: left;
		margin-bottom: 1.4rem;
	}

	.rules-badge {
		font-size: 0.75rem;
		font-weight: 800;
		color: #c084fc;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.6rem;
	}

	.rules-list {
		margin: 0;
		padding-left: 1.2rem;
		font-size: 0.92rem;
		color: #cbd5e1;
		line-height: 1.6;
	}

	.rules-list li {
		margin-bottom: 0.35rem;
	}

	.record-pill {
		display: inline-block;
		background: rgba(234, 179, 8, 0.15);
		border: 1px solid rgba(234, 179, 8, 0.3);
		color: #fde047;
		padding: 0.45rem 1rem;
		border-radius: 9999px;
		font-size: 0.88rem;
		margin-bottom: 1.4rem;
	}

	.start-btn {
		width: 100%;
		background: linear-gradient(135deg, #a855f7, #7c3aed);
		color: #ffffff;
		border: none;
		padding: 1.15rem;
		border-radius: 1rem;
		font-size: 1.1rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.5);
		transition: all 0.18s ease;
	}

	.start-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
	}

	/* Game Card */
	.cycle-progress {
		margin-bottom: 1.4rem;
	}

	.cycle-label {
		font-size: 0.95rem;
		color: #94a3b8;
		margin-bottom: 0.6rem;
	}

	.cycle-label strong {
		color: #f1f5f9;
	}

	.cycle-dots {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}

	.cycle-pill {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.6rem;
		padding: 0.4rem 0.2rem;
		font-size: 0.82rem;
		color: #64748b;
		transition: all 0.2s ease;
	}

	.cycle-pill.active {
		border-color: #a855f7;
		background: rgba(168, 85, 247, 0.18);
		color: #d8b4fe;
		font-weight: 700;
	}

	.cycle-pill.done {
		border-color: rgba(16, 185, 129, 0.4);
		background: rgba(16, 185, 129, 0.15);
		color: #6ee7b7;
		font-weight: 700;
	}

	/* Mystery Box */
	.mystery-box {
		background: radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.2) 0%, rgba(15, 23, 42, 0.6) 80%);
		border: 2px dashed rgba(168, 85, 247, 0.4);
		border-radius: 1.5rem;
		padding: 2rem 1.5rem;
		margin-bottom: 1.2rem;
		transition: all 0.2s ease;
	}

	.mystery-box.is-revealed {
		border-style: solid;
		border-color: #10b981;
		background: radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.7) 80%);
	}

	.mystery-box.is-shake {
		animation: shakeCard 0.3s ease-in-out;
		border-color: #f43f5e;
	}

	@keyframes shakeCard {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-8px); }
		40%, 80% { transform: translateX(8px); }
	}

	.mystery-question {
		font-size: 5rem;
		font-weight: 950;
		color: #c084fc;
		line-height: 1;
		margin-bottom: 0.4rem;
		filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.6));
	}

	.mystery-status {
		font-size: 0.95rem;
		color: #94a3b8;
		min-height: 1.4rem;
	}

	.wrong-text {
		color: #f87171;
		font-weight: 600;
	}

	.reveal-number {
		font-size: 5.5rem;
		font-weight: 950;
		color: #34d399;
		line-height: 1;
		filter: drop-shadow(0 0 25px rgba(52, 211, 153, 0.8));
		animation: popNumber 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes popNumber {
		0% { transform: scale(0.4); }
		100% { transform: scale(1); }
	}

	.reveal-sub {
		font-size: 1.05rem;
		color: #6ee7b7;
		font-weight: 700;
		margin-top: 0.4rem;
	}

	.tries-counter {
		font-size: 0.88rem;
		color: #94a3b8;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
		gap: 0.6rem;
		align-items: center;
	}

	.tries-counter strong {
		color: #f1f5f9;
	}

	.divider {
		color: #475569;
	}

	/* Guess Buttons (0 to 4) */
	.guess-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}

	.guess-btn {
		background: rgba(30, 41, 59, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 1.1rem;
		padding: 1.1rem 0.4rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: #ffffff;
		transition: all 0.15s ease;
	}

	.guess-btn:hover:not(:disabled) {
		background: rgba(168, 85, 247, 0.25);
		border-color: #a855f7;
		transform: translateY(-2px);
	}

	.guess-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.guess-btn.tried {
		background: rgba(15, 23, 42, 0.4);
		border-color: rgba(255, 255, 255, 0.06);
		opacity: 0.6;
	}

	.guess-btn.correct {
		background: linear-gradient(135deg, #10b981, #059669);
		border-color: #34d399;
		box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
	}

	.btn-num {
		font-size: 1.8rem;
		font-weight: 900;
		line-height: 1;
	}

	.key-hint {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		padding: 0.1rem 0.35rem;
		border-radius: 0.3rem;
		font-size: 0.68rem;
		font-family: inherit;
		color: #94a3b8;
	}

	.advancing-bar {
		margin-top: 0.8rem;
	}

	.next-btn {
		background: linear-gradient(135deg, #10b981, #059669);
		color: #ffffff;
		border: none;
		padding: 0.75rem 1.6rem;
		border-radius: 9999px;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 6px 16px -3px rgba(16, 185, 129, 0.5);
		transition: all 0.15s ease;
	}

	.next-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	/* Result Card */
	.crown-icon {
		font-size: 3.5rem;
		margin-bottom: 0.4rem;
		filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6));
	}

	.finish-title {
		font-size: 2.1rem;
		font-weight: 900;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.rank-badge {
		display: inline-block;
		padding: 0.45rem 1.2rem;
		border-radius: 9999px;
		font-size: 0.95rem;
		font-weight: 700;
		margin-bottom: 1.4rem;
		border: 1px solid currentColor;
	}

	.highlight-metric {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.2rem;
		padding: 1.2rem;
		margin-bottom: 1.2rem;
	}

	.metric-label {
		font-size: 0.8rem;
		color: #94a3b8;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.05em;
		margin-bottom: 0.2rem;
	}

	.metric-val {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.35rem;
	}

	.big-num {
		font-size: 4rem;
		font-weight: 950;
		color: #ffffff;
		line-height: 1;
	}

	.tries-unit {
		font-size: 1.5rem;
		font-weight: 700;
		color: #94a3b8;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
		margin-bottom: 1.4rem;
	}

	.stat-cell {
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.8rem;
		padding: 0.75rem 0.4rem;
	}

	.cell-label {
		font-size: 0.72rem;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.cell-val {
		font-size: 1.05rem;
		font-weight: 800;
		color: #ffffff;
	}

	/* History Table */
	.history-table-box {
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1rem;
		margin-bottom: 1.6rem;
	}

	.table-header {
		font-size: 0.78rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.6rem;
		text-align: left;
	}

	.history-grid {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.history-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.45rem 0.6rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 0.5rem;
		font-size: 0.88rem;
	}

	.hr-cycle {
		color: #94a3b8;
		font-weight: 600;
	}

	.hr-secret strong {
		color: #c084fc;
	}

	.hr-tries {
		font-weight: 700;
		color: #ffffff;
	}

	.hr-tries.gold {
		color: #34d399;
	}

	/* Action Buttons */
	.btn-row {
		display: flex;
		gap: 0.75rem;
	}

	.primary-btn {
		flex: 1;
		background: linear-gradient(135deg, #a855f7, #7c3aed);
		border: none;
		color: #ffffff;
		padding: 0.95rem;
		border-radius: 0.85rem;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 8px 20px -4px rgba(168, 85, 247, 0.4);
	}

	.primary-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
	}

	.secondary-btn {
		flex: 1;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
		padding: 0.95rem;
		border-radius: 0.85rem;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.secondary-btn:hover {
		background: rgba(255, 255, 255, 0.18);
		transform: translateY(-2px);
	}

	@media (max-width: 600px) {
		.card {
			padding: 1.6rem 1.2rem;
		}

		.card-title {
			font-size: 1.7rem;
		}

		.guess-grid {
			gap: 0.4rem;
		}

		.btn-num {
			font-size: 1.5rem;
		}

		.btn-row {
			flex-direction: column;
		}
	}
</style>
