// Simple synth audio to avoid external asset dependencies and loading issues
class AudioService {
  private ctx: AudioContext | null = null;
  private isMusicPlaying = false;
  private musicTimeout: any = null;
  private noteIndex = 0;

  // Simple cheerful melody (C Major scale patterns)
  // Frequency (Hz), Duration (seconds)
  private melody = [
    { f: 261.63, d: 0.2 }, { f: 329.63, d: 0.2 }, { f: 392.00, d: 0.2 }, { f: 523.25, d: 0.4 }, // C E G C
    { f: 392.00, d: 0.2 }, { f: 329.63, d: 0.2 }, { f: 261.63, d: 0.4 }, { f: 0, d: 0.2 },      // G E C -
    { f: 293.66, d: 0.2 }, { f: 349.23, d: 0.2 }, { f: 440.00, d: 0.2 }, { f: 587.33, d: 0.4 }, // D F A D
    { f: 440.00, d: 0.2 }, { f: 349.23, d: 0.2 }, { f: 293.66, d: 0.4 }, { f: 0, d: 0.2 },      // A F D -
    { f: 261.63, d: 0.2 }, { f: 261.63, d: 0.2 }, { f: 392.00, d: 0.2 }, { f: 392.00, d: 0.2 }, // C C G G
    { f: 440.00, d: 0.2 }, { f: 440.00, d: 0.2 }, { f: 392.00, d: 0.4 }, { f: 0, d: 0.2 },      // A A G -
  ];

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.playNextNote();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  private playNextNote() {
    if (!this.isMusicPlaying) return;

    const note = this.melody[this.noteIndex];
    if (note.f > 0) {
      this.playTone(note.f, note.d * 0.9, 0.03, 'triangle'); // Low volume for background
    }

    this.noteIndex = (this.noteIndex + 1) % this.melody.length;
    
    // Schedule next note
    this.musicTimeout = setTimeout(() => {
      this.playNextNote();
    }, note.d * 1000);
  }

  private playTone(freq: number, duration: number, volume: number = 0.1, type: OscillatorType = 'square') {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  playJump() {
    this.playTone(150, 0.1, 0.1, 'square');
  }

  playCollect() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playCrash() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playRoar() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playHonk() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playEat() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }
}

export const audioService = new AudioService();