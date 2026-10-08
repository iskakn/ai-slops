<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		playTargetHit,
		playMiss,
		playFanfare,
		isAudioMuted,
		toggleAudioMute,
		triggerConfetti
	} from '#lib';

	const TOTAL_TARGETS = 30;

	type Phase = 'idle' | 'playing' | 'finished';
	type TargetSize = 'normal' | 'small' | 'large';

	interface HitParticle {
		id: number;
		x: number;
		y: number;
		text: string;
	}

	let phase = $state<Phase>('idle');
	let hits = $state<number>(0);
	let misses = $state<number>(0);
	let combo = $state<number>(0);
	let maxCombo = $state<number>(0);
	let targetSize = $state<TargetSize>('normal');
	let targetX = $state<number>(50); // percentage (10 to 90)
	let targetY = $state<number>(50); // percentage (10 to 90)
	let audioMuted = $state<boolean>(false);
	let copied = $state<boolean>(false);
	let isNewPersonalBest = $state<boolean>(false);

	let startTime = 0;
	let totalTimeMs = $state<number>(0);
	let liveElapsedMs = $state<number>(0);
	let animTimerId: number | null = null;
	let personalBestMs = $state<number | null>(null);

	let hitParticles = $state<HitParticle[]>([]);
	let particleIdSeq = 0;

	// Load stored high score on client
	if (typeof window !== 'undefined') {
		audioMuted = isAudioMuted();
		const saved = localStorage.getItem('ai_slops_aim_trainer_best_ms');
		if (saved) {
			const parsed = Number(saved);
			if (!isNaN(parsed) && parsed > 0) {
				personalBestMs = parsed;
			}
		}
	}

	const accuracyPercent = $derived.by(() => {
		const totalAttempts = hits + misses;
		if (totalAttempts === 0) return 100;
		return Math.round((hits / totalAttempts) * 100);
	});

	const avgTimePerTarget = $derived.by(() => {
		if (hits === 0) return 0;
		const duration = phase === 'playing' ? liveElapsedMs : totalTimeMs;
		return Math.round(duration / hits);
	});

	const targetsPerSec = $derived.by(() => {
		const durationSec = (phase === 'playing' ? liveElapsedMs : totalTimeMs) / 1000;
		if (durationSec <= 0 || hits === 0) return '0.0';
		return (hits / durationSec).toFixed(2);
	});

	function getRank(avgMs: number, acc: number): { title: string; badge: string; color: string } {
		if (avgMs < 420 && acc >= 90) return { title: 'Aimbot Prodigy', badge: '🤖 Cyber God', color: '#10b981' };
		if (avgMs < 520 && acc >= 85) return { title: 'Deadeye Sniper', badge: '🎯 Precision Master', color: '#06b6d4' };
		if (avgMs < 650) return { title: 'Sharpshooter', badge: '🦅 High Speed', color: '#3b82f6' };
		if (avgMs < 850) return { title: 'Quick Marksman', badge: '🏹 Sharp Reflexes', color: '#f59e0b' };
		if (avgMs < 1100) return { title: 'Steady Gunslinger', badge: '🔫 Solid Control', color: '#f97316' };
		return { title: 'Cadet Trainee', badge: '☕ Warming Up', color: '#94a3b8' };
	}

	const rankInfo = $derived(getRank(avgTimePerTarget, accuracyPercent));

	function moveTargetToRandomPosition(): void {
		// Keep within safe bounding percentages (8% to 92%)
		const nextX = Math.floor(8 + Math.random() * 84);
		const nextY = Math.floor(10 + Math.random() * 80);
		targetX = nextX;
		targetY = nextY;
	}

	function startTimerLoop(): void {
		const update = () => {
			if (phase !== 'playing') return;
			liveElapsedMs = Math.round(performance.now() - startTime);
			animTimerId = requestAnimationFrame(update);
		};
		animTimerId = requestAnimationFrame(update);
	}

	function stopTimerLoop(): void {
		if (animTimerId !== null) {
			cancelAnimationFrame(animTimerId);
			animTimerId = null;
		}
	}

	function startGame(): void {
		hits = 0;
		misses = 0;
		combo = 0;
		maxCombo = 0;
		liveElapsedMs = 0;
		totalTimeMs = 0;
		hitParticles = [];
		isNewPersonalBest = false;
		copied = false;
		phase = 'playing';
		moveTargetToRandomPosition();
		startTime = performance.now();
		startTimerLoop();
	}

	function onTargetHit(e: MouseEvent): void {
		e.stopPropagation(); // Don't trigger arena miss click
		if (phase !== 'playing') return;

		hits += 1;
		combo += 1;
		if (combo > maxCombo) {
			maxCombo = combo;
		}

		playTargetHit(combo);
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate?.(15);
		}

		// Floating hit pop
		const pId = ++particleIdSeq;
		hitParticles = [...hitParticles, { id: pId, x: targetX, y: targetY, text: combo > 4 ? `+1 🔥x${combo}` : '+1' }];
		setTimeout(() => {
			hitParticles = hitParticles.filter((p) => p.id !== pId);
		}, 600);

		if (hits >= TOTAL_TARGETS) {
			finishGame();
		} else {
			moveTargetToRandomPosition();
		}
	}

	function onArenaMissClick(e: MouseEvent): void {
		// Only count as miss if clicked inside board and playing
		const target = e.target as HTMLElement;
		if (target.closest('button, a, header')) return;
		if (phase !== 'playing') return;

		misses += 1;
		combo = 0;
		playMiss();
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate?.(60);
		}
	}

	function finishGame(): void {
		stopTimerLoop();
		phase = 'finished';
		const finalElapsed = Math.round(performance.now() - startTime);
		totalTimeMs = finalElapsed;

		if (!personalBestMs || finalElapsed < personalBestMs) {
			personalBestMs = finalElapsed;
			isNewPersonalBest = true;
			if (typeof window !== 'undefined') {
				localStorage.setItem('ai_slops_aim_trainer_best_ms', finalElapsed.toString());
			}
		}

		playFanfare();
	}

	function handleToggleSound(): void {
		audioMuted = toggleAudioMute();
	}

	function copyScore(): void {
		const seconds = (totalTimeMs / 1000).toFixed(2);
		const lines = [
			`🎯 Aim Trainer: 30 Targets in ${seconds}s!`,
			`🏆 Rank: ${rankInfo.title} (${rankInfo.badge})`,
			`⚡ Avg: ${avgTimePerTarget}ms/target | Speed: ${targetsPerSec} targets/s`,
			`🎯 Accuracy: ${accuracyPercent}% (${hits}/${hits + misses} clicks)`,
			`🔥 Max Streak: ${maxCombo}`
		].join('\n');

		navigator.clipboard.writeText(lines).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2500);
		});
	}

	onDestroy(() => {
		stopTimerLoop();
	});
</script>

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
			<span class="badge-series">🎯 30 Target Challenge</span>
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

	<!-- Status HUD during game -->
	{#if phase === 'playing'}
		<div class="hud-bar">
			<div class="hud-stat">
				<span class="hud-label">TARGETS</span>
				<span class="hud-value highlight">{hits} <span class="hud-sub">/ {TOTAL_TARGETS}</span></span>
			</div>
			<div class="hud-stat">
				<span class="hud-label">TIME</span>
				<span class="hud-value">{(liveElapsedMs / 1000).toFixed(2)}s</span>
			</div>
			<div class="hud-stat">
				<span class="hud-label">ACCURACY</span>
				<span class="hud-value">{accuracyPercent}%</span>
			</div>
			<div class="hud-stat">
				<span class="hud-label">STREAK</span>
				<span class="hud-value" class:fire={combo >= 5}>
					{combo > 0 ? `${combo}x` : '0'}
					{#if combo >= 5}🔥{/if}
				</span>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="hud-progress-track">
			<div class="hud-progress-fill" style:width={`calc(${(hits / TOTAL_TARGETS) * 100}%)`}></div>
		</div>
	{/if}

	<!-- Main Playground / Board -->
	<main class="board-wrapper">
		{#if phase === 'idle'}
			<div class="overlay-card">
				<div class="hero-target-icon">🎯</div>
				<h1 class="card-title">Aim Trainer</h1>
				<p class="card-desc">
					Hit <strong>30 random targets</strong> as fast as you can. Maintain precision and rhythm to rack up streaks!
				</p>

				<!-- Target Size Selector -->
				<div class="size-selector-group">
					<span class="selector-label">Target Size:</span>
					<div class="size-buttons">
						<button
							class="size-btn"
							class:active={targetSize === 'large'}
							onclick={() => (targetSize = 'large')}
						>
							Chonky (80px)
						</button>
						<button
							class="size-btn"
							class:active={targetSize === 'normal'}
							onclick={() => (targetSize = 'normal')}
						>
							Standard (62px)
						</button>
						<button
							class="size-btn"
							class:active={targetSize === 'small'}
							onclick={() => (targetSize = 'small')}
						>
							Precision (44px)
						</button>
					</div>
				</div>

				{#if personalBestMs}
					<div class="record-pill">
						🏆 Personal Best: <strong>{(personalBestMs / 1000).toFixed(2)}s</strong> ({Math.round(personalBestMs / TOTAL_TARGETS)}ms/target)
					</div>
				{/if}

				<button class="cta-start-btn" onclick={startGame}>
					⚡ Start Challenge (30 Targets)
				</button>
			</div>

		{:else if phase === 'playing'}
			<!-- Interactive Board -->
			<div
				class="game-arena"
				role="button"
				tabindex="0"
				aria-label="Aim trainer board"
				onpointerdown={onArenaMissClick}
				onkeydown={(e) => {
					if (e.key === 'Escape') phase = 'idle';
				}}
			>
				<!-- The Bullseye Target -->
				<button
					type="button"
					class="target-button size-{targetSize}"
					style:left={`${targetX}%`}
					style:top={`${targetY}%`}
					onpointerdown={onTargetHit}
					aria-label="Click target"
				>
					<span class="ring outer-ring"></span>
					<span class="ring middle-ring"></span>
					<span class="bullseye-center"></span>
				</button>

				<!-- Floating hit particles -->
				{#each hitParticles as p (p.id)}
					<div
						class="hit-particle"
						style:left={`${p.x}%`}
						style:top={`${p.y}%`}
					>
						{p.text}
					</div>
				{/each}
			</div>

		{:else if phase === 'finished'}
			<div class="overlay-card finish-card">
				{#if isNewPersonalBest}
					<div class="record-badge">🎉 New Personal Record!</div>
				{:else}
					<div class="trophy-badge">🏆 Course Complete!</div>
				{/if}

				<h2 class="card-title">{rankInfo.title}</h2>
				<div class="rank-tag" style:background-color={rankInfo.color + '22'} style:color={rankInfo.color}>
					{rankInfo.badge}
				</div>

				<div class="big-metric-box">
					<div class="metric-label">Total Time (30 Targets)</div>
					<div class="metric-value">
						<span class="num">{(totalTimeMs / 1000).toFixed(2)}</span>
						<span class="unit">sec</span>
					</div>
				</div>

				<!-- Stats Grid -->
				<div class="stats-grid">
					<div class="stat-card">
						<div class="sc-label">⚡ Avg Per Target</div>
						<div class="sc-val">{avgTimePerTarget} ms</div>
					</div>
					<div class="stat-card">
						<div class="sc-label">🎯 Accuracy</div>
						<div class="sc-val">{accuracyPercent}%</div>
					</div>
					<div class="stat-card">
						<div class="sc-label">🚀 Targets / Sec</div>
						<div class="sc-val">{targetsPerSec}</div>
					</div>
					<div class="stat-card">
						<div class="sc-label">🔥 Best Streak</div>
						<div class="sc-val">{maxCombo} hits</div>
					</div>
				</div>

				<!-- Buttons -->
				<div class="action-row">
					<button class="primary-btn" onclick={startGame}>
						🔄 Play Again
					</button>
					<button class="secondary-btn" onclick={copyScore}>
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
		background: radial-gradient(circle at 50% 15%, #1e1b4b 0%, #0f172a 60%, #080d1a 100%);
		color: #f1f5f9;
		user-select: none;
		-webkit-user-select: none;
		overflow-x: hidden;
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
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Top Navigation */
	.top-nav {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 20;
		margin-bottom: 1rem;
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

	/* HUD Bar */
	.hud-bar {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1rem;
		padding: 0.8rem 1.2rem;
		margin-bottom: 0.5rem;
		box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.5);
	}

	.hud-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hud-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #94a3b8;
		letter-spacing: 0.05em;
	}

	.hud-value {
		font-size: 1.3rem;
		font-weight: 900;
		color: #ffffff;
	}

	.hud-value.highlight {
		color: #38bdf8;
	}

	.hud-value.fire {
		color: #f97316;
		animation: pulseFire 0.4s infinite alternate ease-in-out;
	}

	@keyframes pulseFire {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.1);
		}
	}

	.hud-sub {
		font-size: 0.8rem;
		color: #64748b;
		font-weight: 600;
	}

	.hud-progress-track {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.hud-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #ec4899);
		transition: width 0.15s ease-out;
		border-radius: 9999px;
	}

	/* Board wrapper */
	.board-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		min-height: 520px;
	}

	/* Interactive Arena */
	.game-arena {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		cursor: crosshair;
		overflow: hidden;
		touch-action: none;
		box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
	}

	/* Target Button */
	.target-button {
		position: absolute;
		transform: translate(-50%, -50%);
		border: none;
		background: transparent;
		padding: 0;
		cursor: crosshair;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.05s ease;
		animation: targetSpawn 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.target-button:active {
		transform: translate(-50%, -50%) scale(0.9);
	}

	@keyframes targetSpawn {
		0% {
			transform: translate(-50%, -50%) scale(0.2);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
	}

	.size-normal {
		width: 62px;
		height: 62px;
	}

	.size-small {
		width: 44px;
		height: 44px;
	}

	.size-large {
		width: 80px;
		height: 80px;
	}

	.ring {
		position: absolute;
		border-radius: 50%;
		box-sizing: border-box;
		pointer-events: none;
	}

	.outer-ring {
		inset: 0;
		background: radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.8) 100%);
		border: 2px solid #f87171;
		box-shadow: 0 0 16px rgba(239, 68, 68, 0.6);
	}

	.middle-ring {
		inset: 22%;
		background: #ffffff;
		border: 2px solid #ef4444;
	}

	.bullseye-center {
		position: absolute;
		inset: 38%;
		background: #ef4444;
		border-radius: 50%;
		box-shadow: 0 0 8px #f87171;
	}

	/* Hit Particle */
	.hit-particle {
		position: absolute;
		transform: translate(-50%, -50%);
		font-weight: 800;
		font-size: 1.1rem;
		color: #38bdf8;
		text-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
		pointer-events: none;
		animation: floatFade 0.6s ease-out forwards;
		z-index: 30;
	}

	@keyframes floatFade {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -120%) scale(1.3);
		}
	}

	/* Overlay Card */
	.overlay-card {
		background: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.75rem;
		padding: 2.2rem;
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

	.hero-target-icon {
		font-size: 3.8rem;
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.5));
	}

	.card-title {
		font-size: 2rem;
		font-weight: 900;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.card-desc {
		font-size: 1rem;
		color: #94a3b8;
		line-height: 1.6;
		margin: 0 0 1.6rem;
	}

	.size-selector-group {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 0.9rem;
		margin-bottom: 1.4rem;
	}

	.selector-label {
		display: block;
		font-size: 0.78rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.6rem;
	}

	.size-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.size-btn {
		flex: 1;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #cbd5e1;
		padding: 0.55rem 0.2rem;
		border-radius: 0.6rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.size-btn.active {
		background: rgba(239, 68, 68, 0.25);
		border-color: #ef4444;
		color: #ffffff;
		font-weight: 700;
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

	.cta-start-btn {
		width: 100%;
		background: linear-gradient(135deg, #ef4444, #dc2626);
		color: #ffffff;
		border: none;
		padding: 1.15rem;
		border-radius: 1rem;
		font-size: 1.1rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5);
		transition: all 0.18s ease;
	}

	.cta-start-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
	}

	/* Finished Card */
	.record-badge {
		font-size: 0.85rem;
		font-weight: 800;
		color: #38bdf8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.3rem;
	}

	.trophy-badge {
		font-size: 0.85rem;
		font-weight: 800;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.3rem;
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

	.big-metric-box {
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.2rem;
		padding: 1.2rem;
		margin-bottom: 1.2rem;
	}

	.metric-label {
		font-size: 0.82rem;
		color: #94a3b8;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
		margin-bottom: 0.2rem;
	}

	.metric-value {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.3rem;
	}

	.metric-value .num {
		font-size: 4rem;
		font-weight: 950;
		color: #ffffff;
		line-height: 1;
	}

	.metric-value .unit {
		font-size: 1.6rem;
		font-weight: 700;
		color: #94a3b8;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.6rem;
	}

	.stat-card {
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.85rem;
		padding: 0.85rem;
	}

	.sc-label {
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 0.2rem;
	}

	.sc-val {
		font-size: 1.2rem;
		font-weight: 800;
		color: #ffffff;
	}

	.action-row {
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

	@media (max-width: 600px) {
		.hud-bar {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
		}

		.action-row {
			flex-direction: column;
		}

		.board-wrapper {
			min-height: 420px;
		}

		.card-title {
			font-size: 1.6rem;
		}

		.metric-value .num {
			font-size: 3.2rem;
		}
	}
</style>
