<script lang="ts">
	// Hub home page
</script>

<div class="home-container">
	<header class="hero-header">
		<div class="logo-badge">⚡ AI-SLOPS ARCADE</div>
		<h1 class="main-title">Reflex & Speed Lab</h1>
		<p class="tagline">Minimalist, lightning-fast micro-experiments and games.</p>
	</header>

	<main class="grid-container">
		<a href="/reaction-time" class="game-card featured">
			<div class="badge-featured">Featured Challenge</div>
			<div class="card-icon">⚡</div>
			<h2 class="card-title">Reaction Time</h2>
			<p class="card-desc">
				Hold down on the screen and release the moment it flashes green. Can you maintain razor-sharp reflexes <strong>5 times in a row</strong>?
			</p>

			<div class="specs-row">
				<span class="spec-tag">5 Consecutive Holds</span>
				<span class="spec-tag">Audio + Haptics</span>
				<span class="spec-tag">Reflex Tier Rank</span>
			</div>

			<div class="play-btn-cta">
				<span>Play Challenge</span>
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
		max-width: 900px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-header {
		text-align: center;
		margin-bottom: 3.5rem;
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
		font-size: 1.2rem;
		color: #94a3b8;
		margin: 0;
		max-width: 520px;
	}

	.grid-container {
		width: 100%;
		max-width: 560px;
	}

	.game-card {
		position: relative;
		display: flex;
		flex-direction: column;
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
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 25px 50px -10px rgba(59, 130, 246, 0.25);
	}

	.badge-featured {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.3rem 0.75rem;
		border-radius: 9999px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-icon {
		font-size: 3.2rem;
		margin-bottom: 0.8rem;
		filter: drop-shadow(0 0 16px rgba(234, 179, 8, 0.6));
	}

	.card-title {
		font-size: 1.8rem;
		font-weight: 800;
		margin: 0 0 0.6rem;
		color: #ffffff;
	}

	.card-desc {
		font-size: 1rem;
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
		font-size: 0.8rem;
		padding: 0.35rem 0.7rem;
		border-radius: 0.5rem;
		font-weight: 500;
	}

	.play-btn-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		color: #ffffff;
		padding: 1rem 1.4rem;
		border-radius: 1rem;
		font-weight: 700;
		font-size: 1.05rem;
		box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.5);
		transition: background 0.2s ease;
	}

	.game-card:hover .play-btn-cta {
		background: linear-gradient(135deg, #1d4ed8, #4338ca);
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
