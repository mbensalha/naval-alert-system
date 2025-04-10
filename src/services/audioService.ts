
/**
 * Audio Service for ship detection and classification alerts
 */

// Create audio context for playing sounds
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction (to comply with browser policies)
export const initializeAudio = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Play alert sound for ship detection
export const playDetectionAlert = async () => {
  try {
    const context = initializeAudio();
    
    // Create oscillator for alert sound
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 1.0);
    
    // Play sound
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1.0);
  } catch (error) {
    console.error("Error playing detection alert:", error);
  }
};

// Speak a message using Web Speech API
export const speakMessage = (message: string) => {
  // Initialize audio context first to ensure user interaction
  initializeAudio();
  
  // Check if speech synthesis is supported
  if ('speechSynthesis' in window) {
    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'fr-FR'; // Set language to French
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    // Speak the message
    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis not supported in this browser");
  }
};
