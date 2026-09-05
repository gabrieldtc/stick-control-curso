const KITS = {
  classic: {
    label: 'Pad Clássico',
    stickWave: 'sine',
    stickFreq: [320, 275],
    stickEnd: [160, 140],
    stickDur: 0.12,
    stickGain: 0.55,
    bassFreq: [180, 40],
    bassDur: 0.25
  },
  rock: {
    label: 'Rock',
    stickWave: 'sine',
    stickFreq: [280, 240],
    stickEnd: [140, 120],
    stickDur: 0.14,
    stickGain: 0.6,
    bassFreq: [110, 32],
    bassDur: 0.32
  },
  jazz: {
    label: 'Jazz',
    stickWave: 'sine',
    stickFreq: [350, 300],
    stickEnd: [180, 150],
    stickDur: 0.1,
    stickGain: 0.42,
    bassFreq: [240, 60],
    bassDur: 0.2
  },
  funk: {
    label: 'Funk',
    stickWave: 'sine',
    stickFreq: [300, 260],
    stickEnd: [150, 130],
    stickDur: 0.12,
    stickGain: 0.52,
    bassFreq: [200, 42],
    bassDur: 0.24
  }
};

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.isSlow = false;
    this.isLoop = false;
    this.currentBeat = 0;
    this.schedulerTimer = null;
    this.nextNoteTime = 0;
    this.tempo = 80;
    this.timeSignature = 4;
    this.exercise = [];
    this.onBeatCallback = null;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.notesPerBeat = 2;
    this.visualSchedule = [];
    this.lastVisualBeat = -1;
    this.lastVisualCount = null;
    this.visualRAF = null;
    this.measurePos = 0;

    // Volume controls
    this.masterVolume = 0.8;
    this.metronomeVolume = 0.5;
    this.exerciseVolume = 0.7;
    this.accentMultiplier = 1.5;

    // Count-in
    this.countInBeats = 0;
    this.isCountIn = false;

    // Sound kit
    this.kit = 'classic';
  }

  setKit(kit) {
    if (KITS[kit]) this.kit = kit;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Latency between the audio clock and what the user actually hears.
  // The visual highlight is delayed by this amount so the image stays
  // in sync with the sound instead of running ahead of it.
  getOutputLatency() {
    const ctx = this.audioContext;
    if (!ctx) return 0;
    const lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    return Math.min(Math.max(lat, 0.02), 0.35);
  }

  createMasterGain() {
    const g = this.audioContext.createGain();
    g.gain.value = this.masterVolume;
    g.connect(this.audioContext.destination);
    return g;
  }

  // Noise buffer cache
  getNoiseBuffer(duration) {
    if (!this._noiseCache) this._noiseCache = {};
    const key = duration.toFixed(3);
    if (this._noiseCache[key]) return this._noiseCache[key];
    const sr = this.audioContext.sampleRate;
    const len = Math.max(1, Math.ceil(sr * duration));
    const buf = this.audioContext.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseCache[key] = buf;
    return buf;
  }

  /* ── Sons melhorados ── */

  playBass(time, gain = 1) {
    const k = KITS[this.kit] || KITS.classic;
    const master = this.createMasterGain();
    const g = this.audioContext.createGain();
    g.gain.setValueAtTime(0.9 * gain, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + k.bassDur);

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(k.bassFreq[0], time);
    osc.frequency.exponentialRampToValueAtTime(k.bassFreq[1], time + k.bassDur * 0.6);

    // Click attack layer
    const clickG = this.audioContext.createGain();
    clickG.gain.setValueAtTime(0.5 * gain, time);
    clickG.gain.exponentialRampToValueAtTime(0.01, time + 0.005);
    const clickOsc = this.audioContext.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(800, time);
    clickOsc.frequency.exponentialRampToValueAtTime(200, time + 0.005);

    osc.connect(g);
    g.connect(master);
    clickOsc.connect(clickG);
    clickG.connect(master);

    osc.start(time); osc.stop(time + k.bassDur);
    clickOsc.start(time); clickOsc.stop(time + 0.01);
  }

  playSnare(time, gain = 1) {
    const master = this.createMasterGain();

    // Tonal body
    const body = this.audioContext.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(260, time);
    body.frequency.exponentialRampToValueAtTime(120, time + 0.08);
    const bodyG = this.audioContext.createGain();
    bodyG.gain.setValueAtTime(0.6 * gain, time);
    bodyG.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    body.connect(bodyG);
    bodyG.connect(master);
    body.start(time); body.stop(time + 0.12);

    // Filtered noise
    const noiseSrc = this.audioContext.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer(0.12);
    const noiseG = this.audioContext.createGain();
    noiseG.gain.setValueAtTime(0.5 * gain, time);
    noiseG.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    const hp = this.audioContext.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const lp = this.audioContext.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 8000;

    noiseSrc.connect(hp);
    hp.connect(lp);
    lp.connect(noiseG);
    noiseG.connect(master);
    noiseSrc.start(time); noiseSrc.stop(time + 0.15);

    // Snare rattle (high noise)
    const rattleSrc = this.audioContext.createBufferSource();
    rattleSrc.buffer = this.getNoiseBuffer(0.08);
    const rattleG = this.audioContext.createGain();
    rattleG.gain.setValueAtTime(0.2 * gain, time);
    rattleG.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
    const rattleHp = this.audioContext.createBiquadFilter();
    rattleHp.type = 'highpass';
    rattleHp.frequency.value = 6000;
    rattleSrc.connect(rattleHp);
    rattleHp.connect(rattleG);
    rattleG.connect(master);
    rattleSrc.start(time); rattleSrc.stop(time + 0.1);
  }

  playHihat(time, gain = 1, isOpen = false) {
    const master = this.createMasterGain();
    const dur = isOpen ? 0.25 : 0.05;

    const noiseSrc = this.audioContext.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer(dur);
    const g = this.audioContext.createGain();
    g.gain.setValueAtTime(0.35 * gain, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + dur * 0.8);
    const hp = this.audioContext.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = isOpen ? 4000 : 7000;
    const lp = this.audioContext.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 16000;

    noiseSrc.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(master);
    noiseSrc.start(time); noiseSrc.stop(time + dur);
  }

  playRide(time, gain = 1) {
    const master = this.createMasterGain();
    const dur = 0.15;
    const noiseSrc = this.audioContext.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer(dur);
    const g = this.audioContext.createGain();
    g.gain.setValueAtTime(0.25 * gain, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + dur);
    const hp = this.audioContext.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const lp = this.audioContext.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 12000;
    const peak = this.audioContext.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.value = 5000;
    peak.gain.value = 12;

    noiseSrc.connect(hp);
    hp.connect(lp);
    lp.connect(peak);
    peak.connect(g);
    g.connect(master);
    noiseSrc.start(time); noiseSrc.stop(time + dur);
  }

  playCrash(time, gain = 1) {
    const master = this.createMasterGain();
    const dur = 0.6;
    const noiseSrc = this.audioContext.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer(dur);
    const g = this.audioContext.createGain();
    g.gain.setValueAtTime(0.4 * gain, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + dur);
    const hp = this.audioContext.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const lp = this.audioContext.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 18000;

    noiseSrc.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(master);
    noiseSrc.start(time); noiseSrc.stop(time + dur);
  }

  playStick(time, isRight = true, gain = 1) {
    const k = KITS[this.kit] || KITS.classic;
    const master = this.createMasterGain();
    const osc = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();

    osc.type = k.stickWave || 'sine';
    osc.frequency.setValueAtTime(isRight ? k.stickFreq[0] : k.stickFreq[1], time);
    osc.frequency.exponentialRampToValueAtTime(isRight ? k.stickEnd[0] : k.stickEnd[1], time + k.stickDur);

    g.gain.setValueAtTime(k.stickGain * gain, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + k.stickDur);

    osc.connect(g);
    g.connect(master);
    osc.start(time); osc.stop(time + k.stickDur + 0.02);

    // Corpo do pad: harmônico grave curto logo após o ataque para reforçar o "toc"
    const bodyOsc = this.audioContext.createOscillator();
    const bodyG = this.audioContext.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(88, time + 0.004);
    bodyOsc.frequency.exponentialRampToValueAtTime(45, time + k.stickDur);
    bodyG.gain.setValueAtTime(0.35 * k.stickGain * gain, time + 0.004);
    bodyG.gain.exponentialRampToValueAtTime(0.005, time + k.stickDur);
    bodyOsc.connect(bodyG);
    bodyG.connect(master);
    bodyOsc.start(time + 0.004); bodyOsc.stop(time + k.stickDur + 0.02);
  }

  /* ── Metronome click ── */
  playClick(time, isAccent = false) {
    const master = this.createMasterGain();
    const vol = this.metronomeVolume;
    const osc = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 900 : 700, time);

    g.gain.setValueAtTime((isAccent ? 0.35 : 0.2) * vol, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    osc.connect(g);
    g.connect(master);
    osc.start(time); osc.stop(time + 0.04);
  }

  /* ── Count-in ── */
  playCountIn(time, count, sig) {
    const master = this.createMasterGain();
    const osc = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();
    const isDown = count === 1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDown ? 1200 : 900, time);
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(time); osc.stop(time + 0.1);

    // Visual callback for count-in
    if (this.onCountCallback) {
      this.visualSchedule.push({
        beatIndex: -count,
        time: time,
        isCountIn: true
      });
    }
  }

  /* ── Play note with accent support ── */
  playNote(note, time) {
    const gain = this.exerciseVolume;

    // Accent prefix: single note with emphasis
    if (note.length > 1 && (note[0] === '>' || note[0] === '!')) {
      const actualNote = note[1];
      this.playSingle(actualNote, time, note[0] === '>' ? gain * this.accentMultiplier : gain);
      return;
    }

    // Compound note (flam "rR", drag "rrL", ruff "rrrL", buzz "RRRR"...):
    // play each hand in sequence, grace notes a hair before the main
    if (note.length > 1) {
      for (let i = 0; i < note.length; i++) {
        const isGrace = i < note.length - 1;
        this.playSingle(note[i], time + i * this.flamDelay, isGrace ? gain * 0.6 : gain);
      }
      return;
    }

    this.playSingle(note, time, gain);
  }

  playSingle(note, time, gain) {
    const c = note.toLowerCase();
    if (c === 'r') this.playStick(time, true, gain);
    else if (c === 'l') this.playStick(time, false, gain);
    else if (c === 'b') this.playBass(time, gain);
    else if (c === 's') this.playSnare(time, gain);
    else if (c === 'h') this.playHihat(time, gain, false);
    else if (c === 'o') this.playHihat(time, gain, true);
    else if (c === 't') this.playRide(time, gain);
    else if (c === 'c') this.playCrash(time, gain);
  }

  /* ── Scheduler ── */
  scheduler() {
    // If tab was backgrounded and nextNoteTime fell behind, snap forward
    // to avoid a burst of catch-up notes when the tab comes back.
    const drift = this.audioContext.currentTime - this.nextNoteTime;
    if (drift > this.scheduleAheadTime * 3) {
      this.nextNoteTime = this.audioContext.currentTime + 0.01;
    }

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      // Count-in phase
      if (this.isCountIn && this.currentBeat < this.countInBeats) {
        const count = this.currentBeat + 1;
        this.playCountIn(this.nextNoteTime, count, this.timeSignature);

        this.visualSchedule.push({
          beatIndex: -count,
          time: this.nextNoteTime,
          isCountIn: true
        });

        const sec = 60.0 / this.tempo;
        this.nextNoteTime += sec;
        this.currentBeat++;
        continue;
      }

      // End count-in
      if (this.isCountIn && this.currentBeat === this.countInBeats) {
        this.isCountIn = false;
        this.currentBeat = 0;
    this.measurePos = 0;
    this.flamDelay = 0.035;
      }

      if (this.currentBeat >= this.exercise.length) {
        if (this.isLoop) {
          this.currentBeat = 0;
        } else {
          this.stop();
          return;
        }
      }

      // measurePos keeps counting across loops so the beat-in-measure
      // grid (and the click accent) stays continuous: 1-2-3, 1-2-3...
      const measureBeat = Math.floor(this.measurePos / this.notesPerBeat) % this.timeSignature;

      const note = this.exercise[this.currentBeat];
      this.playNote(note, this.nextNoteTime);

      if (this.currentBeat % this.notesPerBeat === 0) {
        this.playClick(this.nextNoteTime, measureBeat === 0);
      }

      this.visualSchedule.push({
        beatIndex: this.currentBeat,
        beat: measureBeat,
        time: this.nextNoteTime
      });

      const secondsPerNote = 60.0 / this.tempo / this.notesPerBeat / (this.isSlow ? 2 : 1);
      this.nextNoteTime += secondsPerNote;
      this.currentBeat++;
      this.measurePos++;
    }
  }

  /* ── Visual tracking via rAF ── */
  startVisualTracking() {
    this.visualSchedule = [];
    this.lastVisualBeat = -1;
    this.lastVisualCount = null;

    const tick = () => {
      if (!this.isPlaying) return;
      const now = this.audioContext.currentTime - this.getOutputLatency();

      // Collect all ready items, separated by type, sorted by time
      const readyCountIn = [];
      const readyBeats = [];
      for (const item of this.visualSchedule) {
        if (item.time <= now) {
          if (item.isCountIn) readyCountIn.push(item);
          else readyBeats.push(item);
        }
      }

      // Process count-in beats in order
      for (const item of readyCountIn) {
        if (item.beatIndex !== this.lastVisualCount) {
          this.lastVisualCount = item.beatIndex;
          if (this.onCountCallback) this.onCountCallback(item.beatIndex);
        }
      }

      // Process exercise beats in order
      for (const item of readyBeats) {
        if (item.beatIndex !== this.lastVisualBeat) {
          this.lastVisualBeat = item.beatIndex;
          if (this.onBeatCallback) this.onBeatCallback(item.beatIndex, item.beat);
        }
      }

      if (readyCountIn.length || readyBeats.length) {
        this.visualSchedule = this.visualSchedule.filter(item => item.time > now);
      }

      this.visualRAF = requestAnimationFrame(tick);
    };
    this.visualRAF = requestAnimationFrame(tick);
  }

  /* ── Play ── */
  play(exercise, options = {}) {
    this.init();
    this.stop();

    this.exercise = exercise;
    this.tempo = options.tempo || 80;
    this.timeSignature = options.timeSignature || 4;
    this.isLoop = options.loop || false;
    this.isSlow = options.slow || false;
    this.currentBeat = 0;
    this.isPlaying = true;
    this.visualSchedule = [];
    this.lastVisualBeat = -1;
    this.lastVisualCount = null;
    this.measurePos = 0;

    // Count-in
    const countIn = options.countIn || 0;
    if (countIn > 0) {
      this.isCountIn = true;
      this.countInBeats = countIn;
    } else {
      this.isCountIn = false;
      this.countInBeats = 0;
    }

    this.nextNoteTime = this.audioContext.currentTime;
    this.schedulerTimer = setInterval(() => this.scheduler(), this.lookahead);
    this.startVisualTracking();
  }

  stop() {
    this.isPlaying = false;
    this.isCountIn = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.visualRAF) {
      cancelAnimationFrame(this.visualRAF);
      this.visualRAF = null;
    }
    this.currentBeat = 0;
    this.visualSchedule = [];
    this.lastVisualBeat = -1;
    this.lastVisualCount = null;
    this.measurePos = 0;
  }

  toggle(exercise, options) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play(exercise, options);
    }
  }

  setTempo(tempo) { this.tempo = tempo; }
  setTimeSignature(sig) { this.timeSignature = sig; }

  setMasterVolume(v) { this.masterVolume = Math.max(0, Math.min(1, v)); }
  setMetronomeVolume(v) { this.metronomeVolume = Math.max(0, Math.min(1, v)); }
  setExerciseVolume(v) { this.exerciseVolume = Math.max(0, Math.min(1, v)); }

  toggleSlow() {
    this.isSlow = !this.isSlow;
    return this.isSlow;
  }

  toggleLoop() {
    this.isLoop = !this.isLoop;
    return this.isLoop;
  }
}

const audioEngine = new AudioEngine();
