export interface ConfettiParticle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: string;
	size: number;
	rotation: number;
	vRot: number;
	alpha: number;
}

export function triggerConfetti(canvas: HTMLCanvasElement): () => void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const width = (canvas.width = window.innerWidth);
	const height = (canvas.height = window.innerHeight);

	const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];
	const particles: ConfettiParticle[] = [];
	const count = 120;

	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = Math.random() * 12 + 4;
		particles.push({
			x: width / 2,
			y: height / 2 - 40,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 6,
			color: colors[Math.floor(Math.random() * colors.length)],
			size: Math.random() * 8 + 4,
			rotation: Math.random() * 360,
			vRot: (Math.random() - 0.5) * 12,
			alpha: 1
		});
	}

	let animId: number;
	let isRunning = true;

	const render = () => {
		if (!isRunning) return;
		ctx.clearRect(0, 0, width, height);

		let aliveCount = 0;
		for (const p of particles) {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.28; // gravity
			p.vx *= 0.985;
			p.rotation += p.vRot;
			p.alpha -= 0.007;

			if (p.alpha > 0 && p.y < height) {
				aliveCount++;
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.alpha);
				ctx.translate(p.x, p.y);
				ctx.rotate((p.rotation * Math.PI) / 180);
				ctx.fillStyle = p.color;
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
				ctx.restore();
			}
		}

		if (aliveCount > 0) {
			animId = requestAnimationFrame(render);
		} else {
			ctx.clearRect(0, 0, width, height);
		}
	};

	animId = requestAnimationFrame(render);

	return () => {
		isRunning = false;
		cancelAnimationFrame(animId);
		ctx?.clearRect(0, 0, width, height);
	};
}
