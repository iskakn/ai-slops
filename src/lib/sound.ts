let audioCtx: AudioContext | null = null;
let soundMuted = false;

export function isAudioMuted(): boolean {
	return soundMuted;
}

export function toggleAudioMute(): boolean {
	soundMuted = !soundMuted;
	return soundMuted;
}

function getContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

export function playHoldStart(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(260, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.08);
		gain.gain.setValueAtTime(0.08, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.1);
	} catch {
		// Audio error safely ignored
	}
}

export function playReleaseCue(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(880, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
		gain.gain.setValueAtTime(0.25, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.22);
	} catch {
		// Audio error safely ignored
	}
}

export function playSuccess(reactionTime: number): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const freqs =
			reactionTime < 240
				? [523.25, 659.25, 783.99, 1046.5]
				: reactionTime < 320
					? [440, 554.37, 659.25]
					: [392, 493.88];
		freqs.forEach((freq, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const startTime = ctx.currentTime + idx * 0.06;
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, startTime);
			gain.gain.setValueAtTime(0.12, startTime);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(startTime);
			osc.stop(startTime + 0.2);
		});
	} catch {
		// Audio error safely ignored
	}
}

export function playEarlyRelease(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(150, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
		gain.gain.setValueAtTime(0.18, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.22);
	} catch {
		// Audio error safely ignored
	}
}

export function playFanfare(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const notes = [
			{ freq: 523.25, time: 0 },
			{ freq: 659.25, time: 0.1 },
			{ freq: 783.99, time: 0.2 },
			{ freq: 1046.5, time: 0.35 }
		];
		notes.forEach(({ freq, time }) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const t = ctx.currentTime + time;
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t);
			gain.gain.setValueAtTime(0.15, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + 0.45);
		});
	} catch {
		// Audio error safely ignored
	}
}

export function playTargetHit(combo = 1): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const pitch = Math.min(1300, 600 + Math.min(combo, 15) * 45);
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(pitch, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, ctx.currentTime + 0.05);
		gain.gain.setValueAtTime(0.2, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.09);
	} catch {
		// Audio error safely ignored
	}
}

export function playMiss(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(140, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.07);
		gain.gain.setValueAtTime(0.1, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.07);
	} catch {
		// Audio error safely ignored
	}
}

export function playGuessWrong(): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(220, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.12);
		gain.gain.setValueAtTime(0.12, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.14);
	} catch {
		// Audio error safely ignored
	}
}

export function playGuessCorrect(tries = 1): void {
	if (soundMuted) return;
	const ctx = getContext();
	if (!ctx) return;
	try {
		const freqs = tries === 1 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
		freqs.forEach((freq, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const t = ctx.currentTime + idx * 0.06;
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t);
			gain.gain.setValueAtTime(0.14, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + 0.22);
		});
	} catch {
		// Audio error safely ignored
	}
}
