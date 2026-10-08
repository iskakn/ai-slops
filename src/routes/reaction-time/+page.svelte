<script lang="ts">
	import {
		playHoldStart,
		playReleaseCue,
		playSuccess,
		playEarlyRelease,
		playFanfare,
		isAudioMuted,
		toggleAudioMute,
		triggerConfetti
	} from '#lib';

	const TOTAL_ROUNDS = 5;

	type Phase = 'idle' | 'holding' | 'ready' | 'round-result' | 'early' | 'finished';

	interface RoundScore {
		round: number;
		timeMs: number;
	}

	let phase = $state<Phase>('idle');
	let scores = $state<RoundScore[]>([]);
	let currentRoundNumber = $state<number>(1);
	let isHolding = $state<boolean>(false);
	let lastReactionTime = $state<number | null>(null);
	let bestPersonalAverage = $state<number | null>(null);
	let audioMuted = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let earlyMessage = $state<string>('');

	let cueTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let cueTimestamp = 0;

	// Load personal best on mount
	if (typeof window !== 'undefined') {
		audioMuted = isAudioMuted();
		const savedBest = localStorage.getItem('ai_slops_reaction_best_avg');
		if (savedBest) {
			const parsed = Number(savedBest);
			if (!isNaN(parsed) && parsed > 0) {
				bestPersonalAverage = parsed;
			}
		}
	}

	const averageTime = $derived.by(() => {
		if (scores.length === 0) return 0;
		const sum = scores.reduce((acc, curr) => acc + curr.timeMs, 0);
		return Math.round(sum / scores.length);
	});

	const fastestRound = $derived.by(() => {
		if (scores.length === 0) return null;
		return Math.min(...scores.map((s) => s.timeMs));
	});

	const slowestRound = $derived.by(() => {
		if (scores.length === 0) return null;
		return Math.max(...scores.map((s) => s.timeMs));
	});

	function getSpeedRating(ms: number): { title: string; badge: string; color: string } {
		if (ms < 190) return { title: 'Godlike Reflexes', badge: '⚡👽 Superhuman', color: '#10b981' };
		if (ms < 230) return { title: 'Lightning Fast', badge: '🚀 Sonic Speed', color: '#06b6d4' };
		if (ms < 280) return { title: 'Cheetah Reflexes', badge: '🐆 Super Sharp', color: '#3b82f6' };
		if (ms < 350) return { title: 'Solid Human', badge: '🎯 On Point', color: '#f59e0b' };
		if (ms < 450) return { title: 'Need Coffee?', badge: '☕ A Bit Drowsy', color: '#f97316' };
		return { title: 'Sloth Mode', badge: '🦥 Taking It Easy', color: '#ef4444' };
	}

	const rankInfo = $derived(getSpeedRating(averageTime));

	function clearCueTimer(): void {
		if (cueTimeoutId) {
			clearTimeout(cueTimeoutId);
			cueTimeoutId = null;
		}
	}

	function handlePressStart(e?: Event): void {
		if (e) {
			// Don't trigger if clicked on an action button or link
			const target = e.target as HTMLElement | null;
			if (target && target.closest('button, a')) {
				return;
			}
		}

		if (phase === 'finished') return;
		if (isHolding) return;

		isHolding = true;
		clearCueTimer();

		if (phase === 'idle' || phase === 'round-result' || phase === 'early') {
			phase = 'holding';
			playHoldStart();
			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate?.(25);
			}

			// Random delay between 1.6s and 4.2s
			const delay = 1600 + Math.random() * 2600;
			cueTimeoutId = setTimeout(() => {
				if (!isHolding) return;
				phase = 'ready';
				cueTimestamp = performance.now();
				playReleaseCue();
				if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
					navigator.vibrate?.([60, 40, 60]);
				}
			}, delay);
		}
	}

	function handlePressEnd(e?: Event): void {
		if (e) {
			const target = e.target as HTMLElement | null;
			if (target && target.closest('button, a') && phase !== 'holding' && phase !== 'ready') {
				return;
			}
		}

		if (!isHolding) return;
		isHolding = false;

		if (phase === 'holding') {
			// Released prematurely before the cue!
			clearCueTimer();
			phase = 'early';
			earlyMessage = `Released too early! Round ${currentRoundNumber} doesn't count.`;
			playEarlyRelease();
			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate?.(150);
			}
		} else if (phase === 'ready') {
			// Valid release!
			clearCueTimer();
			const releaseTime = performance.now();
			const reactionMs = Math.max(1, Math.round(releaseTime - cueTimestamp));
			lastReactionTime = reactionMs;

			scores = [...scores, { round: currentRoundNumber, timeMs: reactionMs }];
			playSuccess(reactionMs);

			if (scores.length >= TOTAL_ROUNDS) {
				finishGame();
			} else {
				currentRoundNumber += 1;
				phase = 'round-result';
			}
		}
	}

	function finishGame(): void {
		phase = 'finished';
		const currentAvg = Math.round(scores.reduce((a, b) => a + b.timeMs, 0) / scores.length);

		if (!bestPersonalAverage || currentAvg < bestPersonalAverage) {
			bestPersonalAverage = currentAvg;
			if (typeof window !== 'undefined') {
				localStorage.setItem('ai_slops_reaction_best_avg', currentAvg.toString());
			}
		}

		playFanfare();
	}

	function restartGame(): void {
		clearCueTimer();
		scores = [];
		currentRoundNumber = 1;
		lastReactionTime = null;
		phase = 'idle';
		isHolding = false;
		copied = false;
	}

	function handleToggleSound(): void {
		audioMuted = toggleAudioMute();
	}

	function copyResults(): void {
		if (scores.length === 0) return;
		const lines = [
			`⚡ Reaction Time Benchmark (5 consecutive holds):`,
			`🏆 Average: ${averageTime} ms (${rankInfo.badge})`,
			`📊 Rounds: ${scores.map((s, i) => `R${i + 1}: ${s.timeMs}ms`).join(' | ')}`,
			`🚀 Best: ${fastestRound} ms | 🐢 Worst: ${slowestRound} ms`
		].join('\n');

		navigator.clipboard.writeText(lines).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2500);
		});
	}

	// Keyboard controls (Spacebar hold and release)
	function onKeyDown(e: KeyboardEvent): void {
		if (e.code === 'Space' && !e.repeat) {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT')) {
				return;
			}
			e.preventDefault();
			handlePressStart();
		}
	}

	function onKeyUp(e: KeyboardEvent): void {
		if (e.code === 'Space') {
			e.preventDefault();
			handlePressEnd();
		}
	}

</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

{#if phase === 'finished'}
	<canvas {@attach (canvas: HTMLCanvasElement) => triggerConfetti(canvas)} class="confetti-canvas"></canvas>
{/if}

<div
	class="arena"
	class:is-idle={phase === 'idle'}
	class:is-holding={phase === 'holding'}
	class:is-ready={phase === 'ready'}
	class:is-early={phase === 'early'}
	class:is-round-result={phase === 'round-result'}
	class:is-finished={phase === 'finished'}
	onpointerdown={handlePressStart}
	onpointerup={handlePressEnd}
	onpointercancel={handlePressEnd}
	oncontextmenu={(e) => e.preventDefault()}
	role="region"
	aria-label="Reaction Time Interactive Zone"
>
	<!-- Top Navigation / Toolbar -->
	<header class="top-nav">
		<a href="/" class="nav-btn" title="Back to Home">
			← Home
		</a>

		<div class="header-center">
			<span class="badge-series">5 Consecutive Holds</span>
		</div>

		<div class="nav-controls">
			<button class="nav-btn" onclick={handleToggleSound} aria-label="Toggle Sound">
				{audioMuted ? '🔇 Muted' : '🔊 Sound On'}
			</button>
			{#if phase !== 'idle'}
				<button class="nav-btn" onclick={restartGame}>Reset</button>
			{/if}
		</div>
	</header>

	<!-- Main Arena Content Area -->
	<main class="content-wrapper">
		{#if phase === 'idle'}
			<div class="card idle-card">
				<div class="hero-icon">⚡</div>
				<h1 class="title">Reaction Time Test</h1>
				<p class="subtitle">
					Test your reflex speed across <strong>5 consecutive rounds</strong>.
				</p>

				<div class="instruction-box">
					<div class="step-badge">How to play</div>
					<ol class="rules-list">
						<li><strong>Press and hold</strong> anywhere on the screen (or hold <kbd>Space</kbd>).</li>
						<li>Keep holding! <em>Do not release</em> while it's amber.</li>
						<li>The instant it turns <strong>GREEN</strong>, release immediately!</li>
						<li>Repeat 5 times in a row to complete the test.</li>
					</ol>
				</div>

				{#if bestPersonalAverage}
					<div class="record-pill">
						🏆 Personal Record Average: <strong>{bestPersonalAverage} ms</strong>
					</div>
				{/if}

				<div class="action-cta">
					<div class="action-cta-text">
						👇 Touch & HOLD anywhere to start Round 1 / 5
					</div>
				</div>
			</div>

		{:else if phase === 'holding'}
			<div class="active-indicator holding-box">
				<div class="pulse-icon">⏳</div>
				<h2 class="status-heading">HOLD ON!</h2>
				<p class="status-sub">Keep holding... Wait for GREEN</p>
				<div class="round-chip">Round {currentRoundNumber} of {TOTAL_ROUNDS}</div>
			</div>

		{:else if phase === 'ready'}
			<div class="active-indicator ready-box">
				<div class="zap-icon">⚡</div>
				<h2 class="flash-heading">RELEASE NOW!</h2>
				<p class="flash-sub">Let go immediately!</p>
			</div>

		{:else if phase === 'early'}
			<div class="card early-card">
				<div class="early-icon">⚠️</div>
				<h2 class="title error-color">Too Early!</h2>
				<p class="error-desc">{earlyMessage}</p>
				<p class="hint">You must wait until the screen turns green before letting go.</p>

				<div class="action-cta retry-cta">
					Touch & HOLD again to retry Round {currentRoundNumber}
				</div>
			</div>

		{:else if phase === 'round-result'}
			<div class="card round-card">
				<div class="speed-score">
					<span class="time-number">{lastReactionTime}</span>
					<span class="time-unit">ms</span>
				</div>

				{#if lastReactionTime}
					{@const rating = getSpeedRating(lastReactionTime)}
					<div class="rating-tag" style:background-color={rating.color + '22'} style:color={rating.color}>
						{rating.badge}
					</div>
				{/if}

				<div class="round-status">
					Round {currentRoundNumber - 1} of {TOTAL_ROUNDS} Completed
				</div>

				<!-- Dots for the 5 rounds -->
				<div class="progress-bar">
					{#each Array(TOTAL_ROUNDS) as _, i (i)}
						{@const isDone = i < scores.length}
						{@const isCurrent = i === scores.length}
						<div
							class="progress-dot"
							class:done={isDone}
							class:current={isCurrent}
						>
							{#if isDone}
								<span class="dot-time">{scores[i].timeMs}ms</span>
							{:else}
								<span class="dot-num">R{i + 1}</span>
							{/if}
						</div>
					{/each}
				</div>

				<div class="action-cta">
					Touch & HOLD to begin Round {currentRoundNumber} / {TOTAL_ROUNDS}
				</div>
			</div>

		{:else if phase === 'finished'}
			<div class="card finished-card">
				<div class="trophy-badge">🏆 Test Completed!</div>
				<h2 class="finish-title">{rankInfo.title}</h2>
				<div class="rating-pill" style:background-color={rankInfo.color + '25'} style:color={rankInfo.color}>
					{rankInfo.badge}
				</div>

				<div class="big-average">
					<div class="avg-label">5-Round Average Reaction Time</div>
					<div class="avg-value">
						<span class="avg-number">{averageTime}</span>
						<span class="avg-ms">ms</span>
					</div>
				</div>

				<!-- Stats row -->
				<div class="stats-grid">
					<div class="stat-box">
						<div class="stat-label">🚀 Best Round</div>
						<div class="stat-val">{fastestRound} ms</div>
					</div>
					<div class="stat-box">
						<div class="stat-label">🐢 Slowest Round</div>
						<div class="stat-val">{slowestRound} ms</div>
					</div>
					<div class="stat-box">
						<div class="stat-label">🎯 Spread</div>
						<div class="stat-val">
							{fastestRound !== null && slowestRound !== null ? slowestRound - fastestRound : 0} ms
						</div>
					</div>
				</div>

				<!-- Round by round breakdown -->
				<div class="breakdown-list">
					<h3 class="breakdown-title">Round History</h3>
					<div class="history-chips">
						{#each scores as score, idx (score.round)}
							<div class="chip">
								<span class="chip-round">R{idx + 1}</span>
								<span class="chip-val">{score.timeMs} ms</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Action buttons -->
				<div class="finish-buttons">
					<button class="primary-btn" onclick={restartGame}>
						🔄 Play Again
					</button>
					<button class="secondary-btn" onclick={copyResults}>
						{copied ? '✅ Copied to Clipboard!' : '📋 Share Result'}
					</button>
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer note -->
	<footer class="footer-note">
		{#if phase === 'idle' || phase === 'round-result'}
			<span>Tip: Desktop users can press and hold <kbd>Space</kbd> bar</span>
		{:else if phase === 'holding'}
			<span>Keep your finger/key down!</span>
		{:else if phase === 'ready'}
			<span class="release-glow">LIFT OFF NOW!</span>
		{/if}
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background-color: #0b0f19;
		color: #f1f5f9;
		overflow-x: hidden;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
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

	.arena {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		box-sizing: border-box;
		touch-action: none;
		transition: background-color 0.18s ease, transform 0.1s ease;
		cursor: pointer;
	}

	/* Phase-specific background atmospheres */
	.arena.is-idle {
		background: radial-gradient(circle at 50% 25%, #1e293b 0%, #0f172a 65%, #080d1a 100%);
	}

	.arena.is-holding {
		background: radial-gradient(circle at 50% 35%, #854d0e 0%, #451a03 55%, #1a0802 100%);
	}

	.arena.is-ready {
		background: radial-gradient(circle at 50% 50%, #10b981 0%, #059669 45%, #047857 100%);
		animation: flashPop 0.15s ease-out;
	}

	.arena.is-early {
		background: radial-gradient(circle at 50% 40%, #991b1b 0%, #450a0a 60%, #1c0505 100%);
	}

	.arena.is-round-result {
		background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 60%, #080d1a 100%);
	}

	.arena.is-finished {
		background: radial-gradient(circle at 50% 20%, #312e81 0%, #0f172a 65%, #050811 100%);
	}

	@keyframes flashPop {
		0% {
			filter: brightness(1.7);
		}
		100% {
			filter: brightness(1);
		}
	}

	/* Top Navigation */
	.top-nav {
		width: 100%;
		max-width: 720px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 20;
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
		background: rgba(59, 130, 246, 0.18);
		border: 1px solid rgba(59, 130, 246, 0.35);
		color: #93c5fd;
		padding: 0.35rem 0.8rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.nav-controls {
		display: flex;
		gap: 0.5rem;
	}

	/* Main Content Area */
	.content-wrapper {
		width: 100%;
		max-width: 580px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
		margin: auto 0;
	}

	/* Generic Card */
	.card {
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.5rem;
		padding: 2rem 1.8rem;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
		animation: fadeInScale 0.22s ease-out;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.hero-icon {
		font-size: 3.5rem;
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.5));
	}

	.title {
		margin: 0 0 0.4rem;
		font-size: 1.9rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 0 0 1.4rem;
		font-size: 1rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.instruction-box {
		background: rgba(30, 41, 59, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.2rem;
		text-align: left;
		margin-bottom: 1.4rem;
	}

	.step-badge {
		font-size: 0.75rem;
		text-transform: uppercase;
		font-weight: 700;
		color: #38bdf8;
		letter-spacing: 0.06em;
		margin-bottom: 0.6rem;
	}

	.rules-list {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.92rem;
		color: #cbd5e1;
		line-height: 1.6;
	}

	.rules-list li {
		margin-bottom: 0.35rem;
	}

	kbd {
		background: #334155;
		padding: 0.15rem 0.45rem;
		border-radius: 0.3rem;
		border: 1px solid #475569;
		font-size: 0.85em;
		font-family: inherit;
		box-shadow: 0 2px 0 #1e293b;
	}

	.record-pill {
		display: inline-block;
		background: rgba(234, 179, 8, 0.15);
		border: 1px solid rgba(234, 179, 8, 0.3);
		color: #fde047;
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		margin-bottom: 1.2rem;
	}

	/* Call to action button / prompt */
	.action-cta {
		position: relative;
		background: linear-gradient(135deg, #3b82f6, #6366f1);
		color: #ffffff;
		padding: 1.1rem 1.4rem;
		border-radius: 1rem;
		font-size: 1.05rem;
		font-weight: 700;
		box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
		overflow: hidden;
		transition: transform 0.15s ease;
	}

	.retry-cta {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5);
	}

	.active-indicator {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	/* Holding Phase */
	.holding-box .pulse-icon {
		font-size: 4.5rem;
		animation: pulseHold 1s infinite alternate ease-in-out;
	}

	@keyframes pulseHold {
		0% {
			transform: scale(0.95);
			filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
		}
		100% {
			transform: scale(1.1);
			filter: drop-shadow(0 0 30px rgba(251, 191, 36, 0.9));
		}
	}

	.status-heading {
		font-size: 2.8rem;
		font-weight: 900;
		margin: 0.8rem 0 0.2rem;
		color: #fef08a;
		letter-spacing: -0.01em;
	}

	.status-sub {
		font-size: 1.2rem;
		color: #fde68a;
		margin: 0 0 1.2rem;
	}

	.round-chip {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.4rem 1.1rem;
		border-radius: 9999px;
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffffff;
	}

	/* Ready / Green Phase */
	.ready-box .zap-icon {
		font-size: 5.5rem;
		filter: drop-shadow(0 0 35px rgba(255, 255, 255, 0.9));
		animation: bounceZap 0.3s ease-out;
	}

	@keyframes bounceZap {
		0% {
			transform: scale(0.5);
		}
		70% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	.flash-heading {
		font-size: 3.6rem;
		font-weight: 950;
		margin: 0.4rem 0 0;
		color: #ffffff;
		text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		letter-spacing: -0.02em;
	}

	.flash-sub {
		font-size: 1.4rem;
		font-weight: 700;
		color: #ecfdf5;
		margin: 0.4rem 0 0;
	}

	/* Early Phase */
	.early-card {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.early-icon {
		font-size: 3.5rem;
		margin-bottom: 0.5rem;
	}

	.error-color {
		color: #f87171;
	}

	.error-desc {
		font-size: 1.15rem;
		font-weight: 600;
		color: #fca5a5;
		margin: 0.3rem 0 0.8rem;
	}

	.hint {
		font-size: 0.95rem;
		color: #94a3b8;
		margin-bottom: 1.6rem;
	}

	/* Round Result Card */
	.speed-score {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.3rem;
		margin-bottom: 0.4rem;
	}

	.time-number {
		font-size: 4.8rem;
		font-weight: 950;
		line-height: 1;
		color: #ffffff;
		letter-spacing: -0.04em;
	}

	.time-unit {
		font-size: 1.8rem;
		font-weight: 700;
		color: #94a3b8;
	}

	.rating-tag {
		display: inline-block;
		padding: 0.45rem 1.1rem;
		border-radius: 9999px;
		font-size: 0.95rem;
		font-weight: 700;
		margin-bottom: 1.2rem;
		border: 1px solid currentColor;
	}

	.round-status {
		font-size: 0.95rem;
		color: #94a3b8;
		margin-bottom: 1.2rem;
	}

	.progress-bar {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
		margin-bottom: 1.6rem;
	}

	.progress-dot {
		background: rgba(30, 41, 59, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.6rem;
		padding: 0.5rem 0.2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 0.82rem;
		transition: all 0.2s ease;
	}

	.progress-dot.done {
		background: rgba(16, 185, 129, 0.15);
		border-color: rgba(16, 185, 129, 0.4);
		color: #6ee7b7;
		font-weight: 600;
	}

	.progress-dot.current {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.2);
		color: #93c5fd;
		font-weight: 700;
	}

	.dot-time {
		font-size: 0.78rem;
	}

	.dot-num {
		color: #64748b;
	}

	/* Finished Card */
	.trophy-badge {
		font-size: 0.9rem;
		font-weight: 700;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}

	.finish-title {
		font-size: 2.2rem;
		font-weight: 900;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.rating-pill {
		display: inline-block;
		padding: 0.4rem 1.1rem;
		border-radius: 9999px;
		font-size: 0.92rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}

	.big-average {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.2rem;
		padding: 1.2rem;
		margin-bottom: 1.2rem;
	}

	.avg-label {
		font-size: 0.85rem;
		color: #94a3b8;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
		margin-bottom: 0.2rem;
	}

	.avg-value {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.3rem;
	}

	.avg-number {
		font-size: 3.8rem;
		font-weight: 950;
		color: #ffffff;
		line-height: 1;
	}

	.avg-ms {
		font-size: 1.5rem;
		color: #94a3b8;
		font-weight: 700;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}

	.stat-box {
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.75rem;
		padding: 0.75rem 0.4rem;
	}

	.stat-label {
		font-size: 0.72rem;
		color: #94a3b8;
		margin-bottom: 0.2rem;
	}

	.stat-val {
		font-size: 1.05rem;
		font-weight: 700;
		color: #f1f5f9;
	}

	.breakdown-list {
		margin-bottom: 1.6rem;
	}

	.breakdown-title {
		font-size: 0.82rem;
		color: #94a3b8;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
		margin: 0 0 0.6rem;
	}

	.history-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
	}

	.chip {
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.35rem 0.65rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		display: flex;
		gap: 0.4rem;
	}

	.chip-round {
		color: #94a3b8;
		font-weight: 600;
	}

	.chip-val {
		font-weight: 700;
		color: #ffffff;
	}

	.finish-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.primary-btn {
		flex: 1;
		background: linear-gradient(135deg, #10b981, #059669);
		border: none;
		color: #ffffff;
		padding: 0.95rem;
		border-radius: 0.85rem;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.4);
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

	/* Footer Note */
	.footer-note {
		font-size: 0.85rem;
		color: #94a3b8;
		text-align: center;
		z-index: 10;
		min-height: 1.5rem;
	}

	.release-glow {
		color: #ffffff;
		font-weight: 800;
		font-size: 1.1rem;
		animation: pulseText 0.25s infinite alternate ease-in-out;
	}

	@keyframes pulseText {
		from {
			opacity: 0.8;
			transform: scale(0.98);
		}
		to {
			opacity: 1;
			transform: scale(1.04);
		}
	}

	@media (max-width: 600px) {
		.title {
			font-size: 1.6rem;
		}

		.time-number {
			font-size: 3.8rem;
		}

		.avg-number {
			font-size: 3rem;
		}

		.finish-buttons {
			flex-direction: column;
		}
	}
</style>
