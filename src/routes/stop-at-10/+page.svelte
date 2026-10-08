<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		playTick,
		playStopBell,
		playFanfare,
		isAudioMuted,
		toggleAudioMute,
		triggerConfetti
	} from '#lib';

	const TARGET_MS = 10000;
	const BLIND_THRESHOLD_MS = 5000;

	type Phase = 'idle' | 'running' | 'stopped';
	type GameMode = 'blindfold' | 'visible';

	interface AttemptRecord {
		id: number;
		timeMs: number;
		deltaMs: number;
		mode: GameMode;
	}

	let phase = $state<Phase>('idle');
	let mode = $state<GameMode>('blindfold');
	let liveElapsedMs = $state<number>(0);
	let finalTimeMs = $state<number>(0);
	let audioMuted = $state<boolean>(false);
	let metronomeEnabled = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let bestDeltaMs = $state<number | null>(null);
	let attempts = $state<AttemptRecord[]>([]);

	let startTime = 0;
	let animFrameId: number | null = null;
	let lastTickSecond = 0;
	let attemptSeq = 0;

	// Load stored record
	if (typeof window !== 'undefined') {
		audioMuted = isAudioMuted();
		const saved = localStorage.getItem('ai_slops_stop10_best_delta');
		if (saved) {
			const parsed = Number(saved);
			if (!isNaN(parsed) && parsed >= 0) {
				bestDeltaMs = parsed;
			}
		}
	}

	const deltaMs = $derived.by(() => {
		if (phase !== 'stopped') return 0;
		return finalTimeMs - TARGET_MS;
	});

	const absDeltaMs = $derived(Math.abs(deltaMs));

	const isBlind = $derived(mode === 'blindfold' && phase === 'running' && liveElapsedMs >= BLIND_THRESHOLD_MS);

	function getRating(diff: number): { title: string; badge: string; color: string } {
		const abs = Math.abs(diff);
		if (abs === 0) return { title: 'Absolute Perfection', badge: '👑 0ms Drift', color: '#10b981' };
		if (abs <= 25) return { title: 'Atomic Clock', badge: '⚛️ Sub-25ms Precision', color: '#10b981' };
		if (abs <= 70) return { title: 'Master of Time', badge: '⚡ Chronomancer', color: '#06b6d4' };
		if (abs <= 150) return { title: 'Sharp Rhythm', badge: '🎯 Spot On', color: '#3b82f6' };
		if (abs <= 300) return { title: 'Solid Timing', badge: '🎵 In the Groove', color: '#f59e0b' };
		if (abs <= 600) return { title: 'Slightly Off', badge: '🚶 Drifted', color: '#f97316' };
		return { title: 'Lost in Time', badge: '🌀 Big Overshoot', color: '#ef4444' };
	}

	const ratingInfo = $derived(getRating(deltaMs));

	function formatTime(ms: number): string {
		const s = Math.floor(ms / 1000);
		const rem = ms % 1000;
		return `${s.toString().padStart(2, '0')}.${rem.toString().padStart(3, '0')}`;
	}

	function startTimer(): void {
		phase = 'running';
		startTime = performance.now();
		liveElapsedMs = 0;
		lastTickSecond = 0;

		const update = () => {
			if (phase !== 'running') return;
			const now = performance.now();
			const elapsed = Math.round(now - startTime);
			liveElapsedMs = elapsed;

			if (metronomeEnabled) {
				const currentSec = Math.floor(elapsed / 1000);
				if (currentSec > lastTickSecond) {
					lastTickSecond = currentSec;
					playTick();
				}
			}

			animFrameId = requestAnimationFrame(update);
		};

		animFrameId = requestAnimationFrame(update);
	}

	function stopTimer(): void {
		if (phase !== 'running') return;
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}

		const now = performance.now();
		finalTimeMs = Math.round(now - startTime);
		phase = 'stopped';

		const diff = finalTimeMs - TARGET_MS;
		const absDiff = Math.abs(diff);

		// Record attempt
		attemptSeq += 1;
		attempts = [
			{
				id: attemptSeq,
				timeMs: finalTimeMs,
				deltaMs: diff,
				mode
			},
			...attempts
		];

		// Personal record check
		if (bestDeltaMs === null || absDiff < bestDeltaMs) {
			bestDeltaMs = absDiff;
			if (typeof window !== 'undefined') {
				localStorage.setItem('ai_slops_stop10_best_delta', absDiff.toString());
			}
		}

		if (absDiff < 50) {
			playFanfare();
		} else {
			playStopBell(absDiff);
		}
	}

	function handlePrimaryAction(): void {
		if (phase === 'idle' || phase === 'stopped') {
			startTimer();
		} else if (phase === 'running') {
			stopTimer();
		}
	}

	function handleToggleSound(): void {
		audioMuted = toggleAudioMute();
	}

	function copyScore(): void {
		const sign = deltaMs > 0 ? `+${deltaMs}ms` : deltaMs < 0 ? `${deltaMs}ms` : `0ms (Exact!)`;
		const lines = [
			`⏱️ Stop at 10.000s Challenge (${mode === 'blindfold' ? '🙈 Blindfold Mode' : '👀 Visible Mode'}):`,
			`🎯 Result: ${formatTime(finalTimeMs)}s (${sign})`,
			`🏆 Rating: ${ratingInfo.title} (${ratingInfo.badge})`,
			bestDeltaMs !== null ? `⭐ Best Delta: ${bestDeltaMs}ms` : ''
		]
			.filter(Boolean)
			.join('\n');

		navigator.clipboard.writeText(lines).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2500);
		});
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (e.code === 'Space' || e.code === 'Enter') {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT')) {
				return;
			}
			e.preventDefault();
			handlePrimaryAction();
		}
	}

	onDestroy(() => {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
		}
	});
</script>

<svelte:window onkeydown={onKeyDown} />

{#if phase === 'stopped' && absDeltaMs < 50}
	<canvas {@attach (canvas: HTMLCanvasElement) => triggerConfetti(canvas)} class="confetti-canvas"></canvas>
{/if}

<div class="page-container">
	<!-- Top Navigation -->
	<header class="top-nav">
		<a href={resolve('/')} class="nav-btn" title="Back to Home">
			← Home
		</a>

		<div class="nav-title-group">
			<span class="badge-series">⏱️ Target: 10.000s</span>
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
		<div class="card main-card">
			<!-- Mode Selector (when idle or stopped) -->
			{#if phase !== 'running'}
				<div class="mode-bar">
					<button
						class="mode-pill"
						class:active={mode === 'blindfold'}
						onclick={() => (mode = 'blindfold')}
					>
						🙈 Blindfold (Hides at 5s)
					</button>
					<button
						class="mode-pill"
						class:active={mode === 'visible'}
						onclick={() => (mode = 'visible')}
					>
						👀 Visible Mode
					</button>
				</div>
			{/if}

			<!-- Stopwatch Display Card -->
			<div
				class="timer-hero"
				class:is-running={phase === 'running'}
				class:is-blind={isBlind}
				class:is-perfect={phase === 'stopped' && absDeltaMs === 0}
			>
				{#if isBlind}
					<div class="timer-blind-overlay">
						<div class="blind-icon">🙈</div>
						<div class="blind-text">COUNT IN YOUR HEAD!</div>
					</div>
				{/if}

				<div class="digital-display" class:blurred={isBlind}>
					{#if phase === 'running'}
						{formatTime(liveElapsedMs)}
					{:else if phase === 'stopped'}
						{formatTime(finalTimeMs)}
					{:else}
						00.000
					{/if}
					<span class="sec-unit">s</span>
				</div>

				<div class="target-subtext">
					TARGET: <strong>10.000s</strong>
				</div>
			</div>

			<!-- Dynamic Status / Feedback Area -->
			{#if phase === 'stopped'}
				<div class="result-feedback">
					<div class="delta-chip" style:color={ratingInfo.color} style:border-color={ratingInfo.color + '66'}>
						{#if deltaMs === 0}
							🎯 EXACT HIT! 0 ms!
						{:else if deltaMs > 0}
							+{deltaMs} ms late
						{:else}
							{deltaMs} ms early
						{/if}
					</div>

					<h2 class="rating-title">{ratingInfo.title}</h2>
					<div class="rating-badge" style:background-color={ratingInfo.color + '22'} style:color={ratingInfo.color}>
						{ratingInfo.badge}
					</div>
				</div>
			{:else if phase === 'running'}
				<p class="running-hint">
					{#if mode === 'blindfold' && liveElapsedMs < BLIND_THRESHOLD_MS}
						Stay sharp... Display vanishes at 5.000s!
					{:else if isBlind}
						Trust your internal rhythm and stop at 10.000s!
					{:else}
						Hit Stop as close to 10.000s as you can!
					{/if}
				</p>
			{:else}
				<p class="idle-hint">
					{#if mode === 'blindfold'}
						The clock hides after 5 seconds. Can your internal clock nail 10.000s?
					{:else}
						Hit STOP as precisely on 10.000s as humanly possible!
					{/if}
				</p>

				{#if bestDeltaMs !== null}
					<div class="best-pill">
						🏆 Personal Best Drift: <strong>±{bestDeltaMs} ms</strong>
					</div>
				{/if}
			{/if}

			<!-- Big Action Button (Start / Stop) -->
			<div class="action-zone">
				{#if phase === 'running'}
					<button class="huge-action-btn btn-stop" onclick={handlePrimaryAction}>
						<span class="btn-icon">🛑</span>
						<span class="btn-text">STOP!</span>
						<kbd class="space-kbd">Space</kbd>
					</button>
				{:else}
					<button class="huge-action-btn btn-start" onclick={handlePrimaryAction}>
						<span class="btn-icon">⚡</span>
						<span class="btn-text">{phase === 'stopped' ? 'Try Again' : 'Start Timer'}</span>
						<kbd class="space-kbd">Space</kbd>
					</button>
				{/if}
			</div>

			<!-- Share / Secondary Controls (after stopping) -->
			{#if phase === 'stopped'}
				<div class="secondary-actions">
					<button class="share-btn" onclick={copyScore}>
						{copied ? '✅ Copied to Clipboard!' : '📋 Share Result'}
					</button>
				</div>
			{/if}

			<!-- Session Attempts Log -->
			{#if attempts.length > 0}
				<div class="attempts-log">
					<div class="log-title">Recent Attempts ({attempts.length})</div>
					<div class="log-list">
						{#each attempts.slice(0, 5) as item (item.id)}
							<div class="log-item">
								<span class="log-id">#{item.id}</span>
								<span class="log-time">{formatTime(item.timeMs)}s</span>
								<span class="log-delta" class:good={Math.abs(item.deltaMs) <= 50}>
									{item.deltaMs > 0 ? `+${item.deltaMs}ms` : `${item.deltaMs}ms`}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: radial-gradient(circle at 50% 15%, #064e3b 0%, #0f172a 65%, #030712 100%);
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
		max-width: 820px;
		margin: 0 auto;
	}

	/* Top Navigation */
	.top-nav {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 20;
		margin-bottom: 1.8rem;
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
		background: rgba(16, 185, 129, 0.18);
		border: 1px solid rgba(16, 185, 129, 0.35);
		color: #6ee7b7;
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
		border-radius: 2rem;
		padding: 2.2rem;
		text-align: center;
		max-width: 540px;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 25px 50px -15px rgba(0, 0, 0, 0.6);
	}

	/* Mode Selector */
	.mode-bar {
		display: flex;
		background: rgba(30, 41, 59, 0.6);
		padding: 0.3rem;
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		margin-bottom: 1.5rem;
	}

	.mode-pill {
		flex: 1;
		background: transparent;
		border: none;
		color: #94a3b8;
		padding: 0.55rem 0.8rem;
		border-radius: 9999px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mode-pill.active {
		background: #10b981;
		color: #ffffff;
		font-weight: 700;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
	}

	/* Timer Hero */
	.timer-hero {
		position: relative;
		background: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.8) 80%);
		border: 2px solid rgba(16, 185, 129, 0.3);
		border-radius: 1.5rem;
		padding: 2.2rem 1.5rem;
		margin-bottom: 1.4rem;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.timer-hero.is-running {
		border-color: #10b981;
		box-shadow: 0 0 35px rgba(16, 185, 129, 0.25);
	}

	.timer-hero.is-blind {
		border-color: #f59e0b;
		background: radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.8) 80%);
		box-shadow: 0 0 35px rgba(245, 158, 11, 0.2);
	}

	.timer-hero.is-perfect {
		border-color: #fbbf24;
		box-shadow: 0 0 50px rgba(251, 191, 36, 0.6);
	}

	.timer-blind-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
		background: rgba(15, 23, 42, 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		animation: fadeInBlind 0.2s ease-out;
	}

	@keyframes fadeInBlind {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.blind-icon {
		font-size: 3rem;
		margin-bottom: 0.3rem;
	}

	.blind-text {
		font-size: 0.95rem;
		font-weight: 800;
		color: #fde68a;
		letter-spacing: 0.08em;
	}

	.digital-display {
		font-size: 4.8rem;
		font-weight: 950;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
		color: #ffffff;
		line-height: 1;
		margin-bottom: 0.5rem;
		text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
	}

	.digital-display.blurred {
		filter: blur(8px);
	}

	.sec-unit {
		font-size: 1.8rem;
		font-weight: 700;
		color: #94a3b8;
		letter-spacing: 0;
	}

	.target-subtext {
		font-size: 0.82rem;
		font-weight: 600;
		color: #94a3b8;
		letter-spacing: 0.08em;
	}

	.target-subtext strong {
		color: #34d399;
	}

	/* Result Feedback */
	.result-feedback {
		margin-bottom: 1.4rem;
		animation: popResult 0.2s ease-out;
	}

	@keyframes popResult {
		0% { transform: scale(0.95); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	.delta-chip {
		display: inline-block;
		font-size: 1.15rem;
		font-weight: 800;
		padding: 0.4rem 1.1rem;
		border-radius: 9999px;
		border: 1px solid currentColor;
		background: rgba(255, 255, 255, 0.05);
		margin-bottom: 0.5rem;
	}

	.rating-title {
		font-size: 1.8rem;
		font-weight: 900;
		margin: 0.2rem 0 0.4rem;
	}

	.rating-badge {
		display: inline-block;
		padding: 0.35rem 0.95rem;
		border-radius: 9999px;
		font-size: 0.88rem;
		font-weight: 700;
	}

	.running-hint,
	.idle-hint {
		font-size: 0.95rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0 0 1.4rem;
	}

	.best-pill {
		display: inline-block;
		background: rgba(234, 179, 8, 0.15);
		border: 1px solid rgba(234, 179, 8, 0.3);
		color: #fde047;
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		margin-bottom: 1.4rem;
	}

	/* Action Zone */
	.action-zone {
		margin-bottom: 1.2rem;
	}

	.huge-action-btn {
		width: 100%;
		border: none;
		border-radius: 1.25rem;
		padding: 1.4rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		font-size: 1.4rem;
		font-weight: 900;
		color: #ffffff;
		cursor: pointer;
		position: relative;
		transition: all 0.15s ease;
	}

	.btn-start {
		background: linear-gradient(135deg, #10b981, #059669);
		box-shadow: 0 10px 30px -5px rgba(16, 185, 129, 0.5);
	}

	.btn-start:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
	}

	.btn-stop {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 10px 30px -5px rgba(239, 68, 68, 0.6);
		animation: pulseStop 0.8s infinite alternate ease-in-out;
	}

	@keyframes pulseStop {
		from { transform: scale(1); }
		to { transform: scale(1.02); }
	}

	.space-kbd {
		position: absolute;
		right: 1.2rem;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #cbd5e1;
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border-radius: 0.4rem;
	}

	.secondary-actions {
		display: flex;
		justify-content: center;
		margin-bottom: 1.2rem;
	}

	.share-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
		padding: 0.75rem 1.6rem;
		border-radius: 9999px;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.share-btn:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	/* Attempts Log */
	.attempts-log {
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 0.9rem;
		text-align: left;
	}

	.log-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.log-item {
		display: flex;
		justify-content: space-between;
		padding: 0.35rem 0.6rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.log-id {
		color: #64748b;
	}

	.log-time {
		font-weight: 600;
		color: #f1f5f9;
	}

	.log-delta {
		font-weight: 700;
		color: #f87171;
	}

	.log-delta.good {
		color: #34d399;
	}

	@media (max-width: 600px) {
		.card {
			padding: 1.6rem 1.2rem;
		}

		.digital-display {
			font-size: 3.6rem;
		}

		.huge-action-btn {
			font-size: 1.2rem;
			padding: 1.1rem;
		}

		.space-kbd {
			display: none;
		}
	}
</style>
