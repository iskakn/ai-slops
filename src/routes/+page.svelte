<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="home-container">
	<header class="hero-header">
		<div class="logo-badge">⚡ AI-SLOPS ARCADE</div>
		<h1 class="main-title">Reflex & Speed Lab</h1>
		<p class="tagline">Lightning-fast benchmarks, clicking sprints, rhythm timing, and intuition tests.</p>
	</header>

	<main class="grid-container">
		<!-- Click Speed Sprint Card -->
		<a href={resolve('/click-sprint')} class="game-card sprint-card">
			<div class="badge-featured badge-rose">New Mode</div>
			<div class="card-icon rose-glow">⚡</div>
			<h2 class="card-title">Click Speed Sprint</h2>
			<p class="card-desc">
				All-out 10-second clicking frenzy. Tap as fast as humanly possible to test your maximum <strong>CPS (Clicks Per Second)</strong>!
			</p>

			<div class="specs-row">
				<span class="spec-tag">10-Second Sprint</span>
				<span class="spec-tag">Live CPS Meter</span>
				<span class="spec-tag">Speed Tier Rank</span>
			</div>

			<div class="play-btn-cta cta-rose">
				<span>Play Click Sprint</span>
				<span class="arrow">→</span>
			</div>
		</a>

		<!-- Stop at 10.000s Card -->
		<a href={resolve('/stop-at-10')} class="game-card stop-10-card">
			<div class="badge-featured badge-emerald">Rhythm</div>
			<div class="card-icon emerald-glow">⏱️</div>
			<h2 class="card-title">Stop at 10.000s</h2>
			<p class="card-desc">
				Nail the internal clock. The display vanishes at 5 seconds in Blindfold mode—can you stop on <strong>exactly 10.000s</strong>?
			</p>

			<div class="specs-row">
				<span class="spec-tag">10.000s Target</span>
				<span class="spec-tag">Blindfold Mode</span>
				<span class="spec-tag">Atomic Clock Rank</span>
			</div>

			<div class="play-btn-cta cta-emerald">
				<span>Play Stop at 10s</span>
				<span class="arrow">→</span>
			</div>
		</a>

		<!-- Aim Trainer Card -->
		<a href={resolve('/aim-trainer')} class="game-card aim-trainer-card">
			<div class="badge-featured badge-red">Precision</div>
			<div class="card-icon red-glow">🎯</div>
			<h2 class="card-title">Aim Trainer</h2>
			<p class="card-desc">
				Target speed & accuracy training. Rapidly hit <strong>30 random targets</strong> across the arena. Keep combos alive for high streaks!
			</p>

			<div class="specs-row">
				<span class="spec-tag">30 Targets</span>
				<span class="spec-tag">Streak Multiplier</span>
				<span class="spec-tag">Target Sizing</span>
			</div>

			<div class="play-btn-cta cta-red">
				<span>Play Aim Trainer</span>
				<span class="arrow">→</span>
			</div>
		</a>

		<!-- Guess The Number Card -->
		<a href={resolve('/guess-the-number')} class="game-card guess-card">
			<div class="badge-featured badge-purple">Mind Mode</div>
			<div class="card-icon purple-glow">🔮</div>
			<h2 class="card-title">Guess the Number</h2>
			<p class="card-desc">
				Test your intuition across <strong>5 cycles</strong>. Numbers from 0 to 4, infinite tries, and zero hints. Can you channel pure ESP?
			</p>

			<div class="specs-row">
				<span class="spec-tag">0 to 4 Range</span>
				<span class="spec-tag">5 Cycles</span>
				<span class="spec-tag">No Hints</span>
				<span class="spec-tag">ESP Rating</span>
			</div>

			<div class="play-btn-cta cta-purple">
				<span>Play Guess The Number</span>
				<span class="arrow">→</span>
			</div>
		</a>

		<!-- Reaction Time Card -->
		<a href={resolve('/reaction-time')} class="game-card reaction-card">
			<div class="badge-featured badge-amber">Classic</div>
			<div class="card-icon yellow-glow">⚡</div>
			<h2 class="card-title">Reaction Time</h2>
			<p class="card-desc">
				Hold down on the screen and release the instant it flashes green. Can you maintain razor-sharp reflexes <strong>5 times in a row</strong>?
			</p>

			<div class="specs-row">
				<span class="spec-tag">5 Consecutive Holds</span>
				<span class="spec-tag">False-Start Check</span>
				<span class="spec-tag">Reflex Tier Rank</span>
			</div>

			<div class="play-btn-cta cta-blue">
				<span>Play Reaction Time</span>
				<span class="arrow">→</span>
			</div>
		</a>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: radial-gradient(circle at 50% 20%, #172554 0%, #0b0f19 70%, #030712 100%);
		color: #f1f5f9;
		min-height: 100vh;
	}

	.home-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 3.5rem 1.5rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.logo-badge {
		display: inline-block;
		background: rgba(59, 130, 246, 0.15);
		border: 1px solid rgba(59, 130, 246, 0.3);
		color: #93c5fd;
		padding: 0.4rem 1rem;
		border-radius: 9999px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		margin-bottom: 1.2rem;
	}

	.main-title {
		font-size: 3.2rem;
		font-weight: 900;
		letter-spacing: -0.03em;
		margin: 0 0 0.8rem;
		background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.tagline {
		font-size: 1.15rem;
		color: #94a3b8;
		margin: 0;
		max-width: 620px;
	}

	.grid-container {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
		gap: 1.5rem;
	}

	.game-card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: rgba(15, 23, 42, 0.7);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.75rem;
		padding: 2.2rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
		transition: all 0.25s ease;
		overflow: hidden;
	}

	.game-card:hover {
		transform: translateY(-4px);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.sprint-card:hover {
		border-color: rgba(244, 63, 94, 0.5);
		box-shadow: 0 25px 50px -10px rgba(244, 63, 94, 0.25);
	}

	.stop-10-card:hover {
		border-color: rgba(16, 185, 129, 0.5);
		box-shadow: 0 25px 50px -10px rgba(16, 185, 129, 0.25);
	}

	.guess-card:hover {
		border-color: rgba(168, 85, 247, 0.5);
		box-shadow: 0 25px 50px -10px rgba(168, 85, 247, 0.25);
	}

	.aim-trainer-card:hover {
		border-color: rgba(239, 68, 68, 0.5);
		box-shadow: 0 25px 50px -10px rgba(239, 68, 68, 0.25);
	}

	.reaction-card:hover {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 25px 50px -10px rgba(59, 130, 246, 0.25);
	}

	.badge-featured {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.3rem 0.75rem;
		border-radius: 9999px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-rose {
		background: linear-gradient(135deg, #f43f5e, #e11d48);
	}

	.badge-emerald {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.badge-purple {
		background: linear-gradient(135deg, #a855f7, #7c3aed);
	}

	.badge-red {
		background: linear-gradient(135deg, #ef4444, #be123c);
	}

	.badge-amber {
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.card-icon {
		font-size: 3.2rem;
		margin-bottom: 0.8rem;
	}

	.rose-glow {
		filter: drop-shadow(0 0 16px rgba(244, 63, 94, 0.6));
	}

	.emerald-glow {
		filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.6));
	}

	.purple-glow {
		filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.6));
	}

	.red-glow {
		filter: drop-shadow(0 0 16px rgba(239, 68, 68, 0.6));
	}

	.yellow-glow {
		filter: drop-shadow(0 0 16px rgba(234, 179, 8, 0.6));
	}

	.card-title {
		font-size: 1.8rem;
		font-weight: 800;
		margin: 0 0 0.6rem;
		color: #ffffff;
	}

	.card-desc {
		font-size: 0.98rem;
		line-height: 1.6;
		color: #94a3b8;
		margin: 0 0 1.5rem;
	}

	.specs-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.spec-tag {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
		font-size: 0.78rem;
		padding: 0.35rem 0.7rem;
		border-radius: 0.5rem;
		font-weight: 500;
	}

	.play-btn-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #ffffff;
		padding: 1rem 1.4rem;
		border-radius: 1rem;
		font-weight: 700;
		font-size: 1.05rem;
		transition: filter 0.2s ease;
	}

	.cta-rose {
		background: linear-gradient(135deg, #f43f5e, #e11d48);
		box-shadow: 0 10px 20px -5px rgba(244, 63, 94, 0.5);
	}

	.cta-emerald {
		background: linear-gradient(135deg, #10b981, #059669);
		box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.5);
	}

	.cta-purple {
		background: linear-gradient(135deg, #a855f7, #7c3aed);
		box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.5);
	}

	.cta-red {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.5);
	}

	.cta-blue {
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.5);
	}

	.game-card:hover .play-btn-cta {
		filter: brightness(1.15);
	}

	.arrow {
		font-size: 1.3rem;
		transition: transform 0.2s ease;
	}

	.game-card:hover .arrow {
		transform: translateX(4px);
	}

	@media (max-width: 600px) {
		.main-title {
			font-size: 2.3rem;
		}

		.home-container {
			padding: 2.5rem 1rem;
		}

		.game-card {
			padding: 1.6rem;
		}
	}
</style>
