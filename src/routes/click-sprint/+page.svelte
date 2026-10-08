<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		playSprintClick,
		playSprintEnd,
		playFanfare,
		playTick,
		isAudioMuted,
		toggleAudioMute,
		triggerConfetti
	} from '#lib';

	const SPRINT_DURATION_MS = 10000;

	type Phase = 'idle' | 'running' | 'finished';

	interface SparkEffect {
		id: number;
		x: number;
		y: number;
	}

	let phase = $state<Phase>('idle');
	let clickCount = $state<number>(0);
	let timeRemainingMs = $state<number>(SPRINT_DURATION_MS);
	let peakCps = $state<number>(0);
	let audioMuted = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let bestClicks = $state<number | null>(null);
	let sparks = $state<SparkEffect[]>([]);
	let sparkSeq = 0;

	let startTime = 0;
	let animFrameId: number | null = null;
	let lastTickSec = 10;

	// Load stored personal record
	if (typeof window !== 'undefined') {
		audioMuted = isAudioMuted();
		const saved = localStorage.getItem('ai_slops_cps_best_clicks');
		if (saved) {
			const parsed = Number(saved);
			if (!isNaN(parsed) && parsed > 0) {
				bestClicks = parsed;
			}
		}
	}

	const elapsedMs = $derived(SPRINT_DURATION_MS - timeRemainingMs);

	const currentCps = $derived.by(() => {
		if (phase === 'idle') return 0;
		if (phase === 'finished') return Number((clickCount / 10).toFixed(2));
		if (elapsedMs <= 100) return 0;
		const cps = clickCount / (elapsedMs / 1000);
		return Number(cps.toFixed(1));
	});

	function getRank(cps: number): { title: string; badge: string; color: string } {
		if (cps >= 13.0) return { title: 'The Cyber Cheetah', badge: '🚀 13+ CPS Jitter God', color: '#a855f7' };
		if (cps >= 11.0) return { title: 'Woodpecker on Espresso', badge: '⚡ 11+ CPS Lightning Speed', color: '#06b6d4' };
		if (cps >= 9.0) return { title: 'Hummingbird Wings', badge: '🐆 9+ CPS Super Fast', color: '#10b981' };
		if (cps >= 7.0) return { title: 'Fleet-Footed Rabbit', badge: '🏃 7+ CPS Quick Reflexes', color: '#f59e0b' };
		if (cps >= 5.0) return { title: 'Steady Runner', badge: '🚶 5+ CPS Solid Pace', color: '#f97316' };
		return { title: 'Zen Sloth', badge: '🦥 Taking It Easy', color: '#94a3b8' };
	}

	const rankInfo = $derived(getRank(currentCps));

	function startSprint(): void {
		phase = 'running';
		clickCount = 1;
		peakCps = 0;
		timeRemainingMs = SPRINT_DURATION_MS;
		lastTickSec = 10;
		startTime = performance.now();

		playSprintClick(5);
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate?.(10);
		}

		runTimerLoop();
	}

	function runTimerLoop(): void {
		const update = () => {
			if (phase !== 'running') return;
			const now = performance.now();
			const elapsed = now - startTime;
			const remaining = Math.max(0, SPRINT_DURATION_MS - elapsed);
			timeRemainingMs = Math.round(remaining);

			// Track peak CPS
			const liveCps = clickCount / (elapsed / 1000);
			if (elapsed > 1000 && liveCps > peakCps) {
				peakCps = Number(liveCps.toFixed(1));
			}

			// Countdown tick for final 3 seconds
			const secRemaining = Math.ceil(remaining / 1000);
			if (secRemaining <= 3 && secRemaining > 0 && secRemaining !== lastTickSec) {
				lastTickSec = secRemaining;
				playTick();
			}

			if (remaining <= 0) {
				finishSprint();
			} else {
				animFrameId = requestAnimationFrame(update);
			}
		};

		animFrameId = requestAnimationFrame(update);
	}

	function handleActionClick(e?: MouseEvent | TouchEvent): void {
		if (phase === 'finished') return;

		if (phase === 'idle') {
			startSprint();
			return;
		}

		if (phase === 'running') {
			clickCount += 1;
			playSprintClick(currentCps);

			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate?.(8);
			}

			// Add floating spark
			if (e && 'clientX' in e && e.clientX && e.clientY) {
				const sId = ++sparkSeq;
				sparks = [...sparks, { id: sId, x: e.clientX, y: e.clientY }];
				setTimeout(() => {
					sparks = sparks.filter((s) => s.id !== sId);
				}, 450);
			}
		}
	}

	function finishSprint(): void {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}

		timeRemainingMs = 0;
		phase = 'finished';

		// Record personal best
		if (bestClicks === null || clickCount > bestClicks) {
			bestClicks = clickCount;
			if (typeof window !== 'undefined') {
				localStorage.setItem('ai_slops_cps_best_clicks', clickCount.toString());
			}
		}

		playSprintEnd();
		if (currentCps >= 9.0) {
			playFanfare();
		}
	}

	function resetSprint(): void {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}
		phase = 'idle';
		clickCount = 0;
		timeRemainingMs = SPRINT_DURATION_MS;
		peakCps = 0;
		sparks = [];
		copied = false;
	}

	function handleToggleSound(): void {
		audioMuted = toggleAudioMute();
	}

	function copyResults(): void {
		const finalCps = (clickCount / 10).toFixed(2);
		const lines = [
			`⚡ Click Speed Sprint (10 Seconds):`,
			`🏆 Total Clicks: ${clickCount} clicks (${finalCps} CPS)`,
			`🎖️ Rank: ${rankInfo.title} (${rankInfo.badge})`,
			`🔥 Peak CPS: ${peakCps > 0 ? peakCps : finalCps} CPS`
		].join('\n');

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
			handleActionClick();
		}
	}

	onDestroy(() => {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
		}
	});
</script>

<svelte:window onkeydown={onKeyDown} />

{#if phase === 'finished'}
	<canvas {@attach (canvas: HTMLCanvasElement) => triggerConfetti(canvas)} class="confetti-canvas"></canvas>
{/if}

<!-- Click Sparks -->
{#each sparks as s (s.id)}
	<div class="click-spark" style:left={`${s.x}px`} style:top={`${s.y}px`}>
		+1
	</div>
{/each}

<div class="page-container">
	<!-- Top Navigation -->
	<header class="top-nav">
		<a href={resolve('/')} class="nav-btn" title="Back to Home">
			← Home
		</a>

		<div class="nav-title-group">
			<span class="badge-series">⚡ 10-Second CPS Sprint</span>
		</div>

		<div class="nav-controls">
			<button class="nav-btn" onclick={handleToggleSound} aria-label="Toggle Sound">
				{audioMuted ? '🔇 Muted' : '🔊 Sound On'}
			</button>
			{#if phase !== 'idle'}
				<button class="nav-btn" onclick={resetSprint}>Reset</button>
			{/if}
		</div>
	</header>

	<!-- Main Stage -->
	<main class="content-wrapper">
		<div class="card main-card">
			<!-- HUD Bar -->
			<div class="sprint-hud">
				<div class="hud-item">
					<span class="hud-label">TIME LEFT</span>
					<span class="hud-value timer-glow">
						{(timeRemainingMs / 1000).toFixed(1)}s
					</span>
				</div>

				<div class="hud-item">
					<span class="hud-label">SPEED</span>
					<span class="hud-value" style:color={rankInfo.color}>
						{currentCps} <span class="hud-sub">CPS</span>
					</span>
				</div>

				<div class="hud-item">
					<span class="hud-label">TOTAL CLICKS</span>
					<span class="hud-value click-num">
						{clickCount}
					</span>
				</div>
			</div>

			<!-- Progress Bar for 10s -->
			<div class="progress-track">
				<div
					class="progress-fill"
					style:width={`${(timeRemainingMs / SPRINT_DURATION_MS) * 100}%`}
					style:background={timeRemainingMs < 3000 ? '#ef4444' : 'linear-gradient(90deg, #ec4899, #8b5cf6)'}
				></div>
			</div>

			{#if phase === 'idle'}
				<!-- Idle / Prompt View -->
				<div class="click-hero" role="button" tabindex="0" onpointerdown={handleActionClick}>
					<div class="fire-icon">🔥</div>
					<h2 class="hero-title">Ready to Sprint?</h2>
					<p class="hero-desc">
						Click or tap as fast as you humanly can for <strong>10 seconds</strong>.
					</p>

					{#if bestClicks !== null}
						<div class="record-pill">
							🏆 Personal Best: <strong>{bestClicks} clicks</strong> ({(bestClicks / 10).toFixed(1)} CPS)
						</div>
					{/if}

					<div class="start-prompt-btn">
						⚡ Click anywhere or press <kbd>Space</kbd> to Start!
					</div>
				</div>

			{:else if phase === 'running'}
				<!-- Running / Tapping Arena -->
				<div
					class="click-arena running-arena"
					role="button"
					tabindex="0"
					onpointerdown={handleActionClick}
					oncontextmenu={(e) => e.preventDefault()}
				>
					<div class="big-counter">
						<span class="big-number">{clickCount}</span>
						<span class="big-label">CLICKS</span>
					</div>

					<div class="speedometer-pill" style:background-color={rankInfo.color + '22'} style:color={rankInfo.color}>
						{rankInfo.badge}
					</div>

					<div class="tap-reminder">
						CLICK AS FAST AS YOU CAN!
					</div>
				</div>

			{:else if phase === 'finished'}
				<!-- Result Card -->
				<div class="result-view">
					<div class="result-icon">⚡</div>
					<h2 class="result-title">{rankInfo.title}</h2>
					<div class="rank-tag" style:background-color={rankInfo.color + '25'} style:color={rankInfo.color}>
						{rankInfo.badge}
					</div>

					<div class="big-score-box">
						<div class="score-grid">
							<div class="sg-item">
								<span class="sg-label">TOTAL CLICKS</span>
								<span class="sg-val">{clickCount}</span>
							</div>
							<div class="sg-item">
								<span class="sg-label">AVERAGE CPS</span>
								<span class="sg-val highlight">{(clickCount / 10).toFixed(2)}</span>
							</div>
							<div class="sg-item">
								<span class="sg-label">PEAK BURST</span>
								<span class="sg-val">{peakCps > 0 ? peakCps : (clickCount / 10).toFixed(1)} CPS</span>
							</div>
						</div>
					</div>

					<div class="btn-row">
						<button class="primary-btn" onclick={resetSprint}>
							🔄 Sprint Again
						</button>
						<button class="secondary-btn" onclick={copyResults}>
							{copied ? '✅ Copied to Clipboard!' : '📋 Share Score'}
						</button>
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
		background: radial-gradient(circle at 50% 15%, #4c0519 0%, #0f172a 65%, #030712 100%);
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

	/* Click Sparks */
	.click-spark {
		position: fixed;
		transform: translate(-50%, -50%);
		font-size: 1.1rem;
		font-weight: 900;
		color: #f43f5e;
		text-shadow: 0 0 10px rgba(244, 63, 94, 0.8);
		pointer-events: none;
		z-index: 90;
		animation: sparkFloat 0.45s ease-out forwards;
	}

	@keyframes sparkFloat {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -150%) scale(1.4);
		}
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
		background: rgba(244, 63, 94, 0.18);
		border: 1px solid rgba(244, 63, 94, 0.35);
		color: #fda4af;
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

	/* Sprint HUD */
	.sprint-hud {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 0.8rem;
		margin-bottom: 0.6rem;
	}

	.hud-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hud-label {
		font-size: 0.68rem;
		font-weight: 700;
		color: #94a3b8;
		letter-spacing: 0.05em;
		margin-bottom: 0.2rem;
	}

	.hud-value {
		font-size: 1.35rem;
		font-weight: 900;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.timer-glow {
		color: #fb7185;
	}

	.hud-sub {
		font-size: 0.8rem;
		color: #94a3b8;
	}

	.click-num {
		color: #38bdf8;
	}

	/* Progress Track */
	.progress-track {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.08s linear;
		border-radius: 9999px;
	}

	/* Click Hero / Idle */
	.click-hero {
		background: radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.7) 80%);
		border: 2px dashed rgba(244, 63, 94, 0.4);
		border-radius: 1.5rem;
		padding: 2.2rem 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		touch-action: manipulation;
	}

	.click-hero:hover {
		border-color: #f43f5e;
		background: radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.25) 0%, rgba(15, 23, 42, 0.8) 80%);
	}

	.fire-icon {
		font-size: 3.5rem;
		margin-bottom: 0.4rem;
		filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.6));
	}

	.hero-title {
		font-size: 1.9rem;
		font-weight: 900;
		margin: 0 0 0.4rem;
	}

	.hero-desc {
		font-size: 0.98rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0 0 1.4rem;
	}

	.record-pill {
		display: inline-block;
		background: rgba(234, 179, 8, 0.15);
		border: 1px solid rgba(234, 179, 8, 0.3);
		color: #fde047;
		padding: 0.4rem 0.9rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		margin-bottom: 1.4rem;
	}

	.start-prompt-btn {
		background: linear-gradient(135deg, #f43f5e, #e11d48);
		color: #ffffff;
		padding: 1.1rem;
		border-radius: 1rem;
		font-size: 1.05rem;
		font-weight: 800;
		box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.5);
	}

	kbd {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.15rem 0.45rem;
		border-radius: 0.3rem;
		font-family: inherit;
		font-size: 0.85em;
	}

	/* Click Arena / Running */
	.click-arena {
		background: radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.25) 0%, rgba(15, 23, 42, 0.8) 85%);
		border: 3px solid #f43f5e;
		border-radius: 1.5rem;
		padding: 3rem 1.5rem;
		cursor: pointer;
		touch-action: manipulation;
		box-shadow: 0 0 40px rgba(244, 63, 94, 0.35);
		transition: transform 0.05s ease;
	}

	.click-arena:active {
		transform: scale(0.97);
		border-color: #fb7185;
	}

	.big-counter {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1rem;
	}

	.big-number {
		font-size: 5.5rem;
		font-weight: 950;
		line-height: 1;
		color: #ffffff;
		text-shadow: 0 0 25px rgba(244, 63, 94, 0.8);
		font-variant-numeric: tabular-nums;
	}

	.big-label {
		font-size: 0.95rem;
		font-weight: 800;
		color: #fda4af;
		letter-spacing: 0.1em;
	}

	.speedometer-pill {
		display: inline-block;
		padding: 0.4rem 1.1rem;
		border-radius: 9999px;
		font-size: 0.9rem;
		font-weight: 800;
		margin-bottom: 1.2rem;
		border: 1px solid currentColor;
	}

	.tap-reminder {
		font-size: 0.85rem;
		font-weight: 700;
		color: #94a3b8;
		letter-spacing: 0.06em;
	}

	/* Result View */
	.result-view {
		animation: fadeInScale 0.22s ease-out;
	}

	@keyframes fadeInScale {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}

	.result-icon {
		font-size: 3.5rem;
		margin-bottom: 0.4rem;
		filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.6));
	}

	.result-title {
		font-size: 2.1rem;
		font-weight: 900;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.rank-tag {
		display: inline-block;
		padding: 0.45rem 1.2rem;
		border-radius: 9999px;
		font-size: 0.95rem;
		font-weight: 700;
		margin-bottom: 1.4rem;
		border: 1px solid currentColor;
	}

	.big-score-box {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.2rem;
		padding: 1.2rem;
		margin-bottom: 1.5rem;
	}

	.score-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.sg-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.sg-label {
		font-size: 0.72rem;
		color: #94a3b8;
		font-weight: 700;
		letter-spacing: 0.04em;
		margin-bottom: 0.2rem;
	}

	.sg-val {
		font-size: 1.6rem;
		font-weight: 900;
		color: #ffffff;
	}

	.sg-val.highlight {
		color: #f43f5e;
	}

	/* Buttons */
	.btn-row {
		display: flex;
		gap: 0.75rem;
	}

	.primary-btn {
		flex: 1;
		background: linear-gradient(135deg, #f43f5e, #e11d48);
		border: none;
		color: #ffffff;
		padding: 0.95rem;
		border-radius: 0.85rem;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 8px 20px -4px rgba(244, 63, 94, 0.4);
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

		.big-number {
			font-size: 4.5rem;
		}

		.score-grid {
			grid-template-columns: 1fr;
			gap: 0.8rem;
		}

		.btn-row {
			flex-direction: column;
		}
	}
</style>
