// Générateur de sons pour les notifications Pharma Express CI
// Utilise Web Audio API pour créer des sons synthétiques

interface SoundConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  volume: number;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

// Configuration des sons par statut de commande
export const SOUND_CONFIGS: Record<string, SoundConfig> = {
  pending: {
    frequencies: [440, 330],
    durations: [0.1, 0.1],
    type: 'sine',
    volume: 0.3,
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.2 }
  },
  confirmed: {
    frequencies: [523, 659, 784], // Do, Mi, Sol
    durations: [0.15, 0.15, 0.3],
    type: 'triangle',
    volume: 0.5,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.3 }
  },
  preparing: {
    frequencies: [440, 440, 440],
    durations: [0.1, 0.05, 0.1],
    type: 'square',
    volume: 0.4,
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.15 }
  },
  ready_for_delivery: {
    frequencies: [659, 784, 988], // Mi, Sol, Si
    durations: [0.2, 0.2, 0.4],
    type: 'sawtooth',
    volume: 0.6,
    envelope: { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.4 }
  },
  in_transit: {
    frequencies: [784, 659, 523, 659, 784], // Sol-Mi-Do-Mi-Sol
    durations: [0.1, 0.1, 0.1, 0.1, 0.3],
    type: 'triangle',
    volume: 0.7,
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.2 }
  },
  in_delivery: {
    frequencies: [1047, 1175, 1319, 1047], // Do-Ré-Mi-Do octave
    durations: [0.15, 0.1, 0.15, 0.4],
    type: 'sine',
    volume: 0.8,
    envelope: { attack: 0.01, decay: 0.02, sustain: 0.95, release: 0.5 }
  },
  delivered: {
    frequencies: [523, 659, 784, 1047, 784, 659, 523], // Gamme ascendante-descendante
    durations: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.3],
    type: 'triangle',
    volume: 0.6,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.6 }
  },
  cancelled: {
    frequencies: [392, 330, 277], // Sol-Mi-Do# descendant
    durations: [0.2, 0.2, 0.4],
    type: 'sawtooth',
    volume: 0.4,
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 }
  }
};

class AudioNotificationGenerator {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      // @ts-ignore - Support pour différents navigateurs
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.isInitialized = true;
      console.log('🔊 Audio Context initialisé');
    } catch (error) {
      console.error('❌ Impossible d\'initialiser Audio Context:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext || !this.isInitialized) {
      this.initializeAudioContext();
      return;
    }

    // Reprendre le contexte audio si suspendu (requis par les navigateurs modernes)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('▶️ Audio Context repris');
      } catch (error) {
        console.error('❌ Erreur reprise Audio Context:', error);
      }
    }
  }

  // Jouer un son de notification basé sur le statut
  public async playNotificationSound(status: string): Promise<void> {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('⚠️ Audio Context non disponible');
      return;
    }

    try {
      await this.ensureAudioContext();

      // Utiliser toujours le son "confirmed" comme demandé
      const config = SOUND_CONFIGS['confirmed'];
      if (!config) {
        console.warn(`⚠️ Configuration audio non trouvée pour le statut: confirmed`);
        return;
      }

      await this.generateAndPlaySound(config);
      console.log(`🔊 Son "confirmé" joué pour statut: ${status}`);
    } catch (error) {
      console.error('❌ Erreur lecture son:', error);
    }
  }

  private async generateAndPlaySound(config: SoundConfig): Promise<void> {
    if (!this.audioContext) return;

    const { frequencies, durations, type, volume, envelope } = config;
    let currentTime = this.audioContext.currentTime;

    for (let i = 0; i < frequencies.length; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Configuration de l'oscillateur
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequencies[i], currentTime);

      // Configuration de l'enveloppe ADSR
      if (envelope) {
        const { attack, decay, sustain, release } = envelope;
        const sustainLevel = volume * sustain;

        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + attack);
        gainNode.gain.linearRampToValueAtTime(sustainLevel, currentTime + attack + decay);
        gainNode.gain.setValueAtTime(sustainLevel, currentTime + durations[i] - release);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[i]);
      } else {
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[i]);
      }

      // Connexion des nœuds
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Démarrage et arrêt
      oscillator.start(currentTime);
      oscillator.stop(currentTime + durations[i]);

      currentTime += durations[i] + 0.02; // Petite pause entre les notes
    }
  }

  // Tester un son spécifique
  public async testSound(status: string): Promise<void> {
    console.log(`🧪 Test du son pour: ${status}`);
    await this.playNotificationSound(status);
  }

  // Tester tous les sons
  public async testAllSounds(): Promise<void> {
    console.log('🧪 Test de tous les sons...');
    const statuses = Object.keys(SOUND_CONFIGS);

    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      console.log(`▶️ Test: ${status}`);
      await this.playNotificationSound(status);

      // Attendre entre chaque son
      if (i < statuses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  // Jouer un son personnalisé
  public async playCustomSound(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5): Promise<void> {
    if (!this.audioContext || !this.isInitialized) return;

    await this.ensureAudioContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

// Instance globale du générateur audio
export const audioGenerator = new AudioNotificationGenerator();

// Hook pour les composants React
export function useAudioNotifications() {
  const playSound = async (status: string) => {
    try {
      await audioGenerator.playNotificationSound(status);
    } catch (error) {
      console.error('Erreur lecture son:', error);
    }
  };

  const testSound = async (status: string) => {
    try {
      await audioGenerator.testSound(status);
    } catch (error) {
      console.error('Erreur test son:', error);
    }
  };

  const testAllSounds = async () => {
    try {
      await audioGenerator.testAllSounds();
    } catch (error) {
      console.error('Erreur test tous les sons:', error);
    }
  };

  return {
    playSound,
    testSound,
    testAllSounds
  };
}