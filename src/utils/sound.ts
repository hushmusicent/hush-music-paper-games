class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('pg_muted');
      this._muted = saved ? JSON.parse(saved) : false;
    } catch (e) {
      this._muted = false;
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  private ensure() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        // audio context not supported
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  beep(f: number, d: number, type: OscillatorType = 'sine') {
    if (this._muted) return;
    this.ensure();
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + d);
    } catch (e) {
      // ignore audio errors
    }
  }

  click() {
    this.beep(620, 0.06, 'square');
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.15), i * 110)
    );
  }

  lose() {
    [400, 300, 220].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.18, 'sawtooth'), i * 130)
    );
  }

  toggle(): boolean {
    this._muted = !this._muted;
    try {
      localStorage.setItem('pg_muted', JSON.stringify(this._muted));
    } catch (e) {}
    return this._muted;
  }
}

export const Sound = new SoundManager();
