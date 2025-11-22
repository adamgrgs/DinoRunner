import React, { useState, useEffect, useCallback } from 'react';
import GameRunner from './components/GameRunner';
import GameUI from './components/GameUI';
import { GameState } from './types';
import { generateDinoFact } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isDinoMode, setDinoMode] = useState(false);
  
  // Fact State
  const [dinoFact, setDinoFact] = useState<string>("");
  const [isFactLoading, setIsFactLoading] = useState(false);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('dinobus_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Audio Context Unlocker for Mobile & Music Start
  const unlockAudioAndStartMusic = useCallback(() => {
    // Playing a silent note usually unlocks the AudioContext on iOS/Android
    audioService.resumeContext(); 
    audioService.playJump(); // Play a sound to ensure unlock
    audioService.startMusic(); // Start BGM
  }, []);

  const handleStart = () => {
    unlockAudioAndStartMusic();
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = useCallback(async () => {
    setGameState(GameState.GAME_OVER);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dinobus_highscore', score.toString());
    }
    audioService.playCrash();
    
    // We can choose to keep music playing or stop it. 
    // Let's keep it playing for a fun vibe, or pause it. 
    // audioService.stopMusic(); 

    // Fetch Fact
    setIsFactLoading(true);
    setDinoFact("");
    try {
      const fact = await generateDinoFact();
      setDinoFact(fact);
    } catch (e) {
      setDinoFact("Did you know? Dinosaurs hatched from eggs!");
    } finally {
      setIsFactLoading(false);
    }
  }, [score, highScore]);

  const handleRestart = () => {
    setGameState(GameState.PLAYING);
    audioService.resumeContext();
    audioService.startMusic();
  };

  return (
    // Use 100dvh to handle mobile address bars correctly
    <div className="relative w-full h-[100dvh] bg-sky-300 overflow-hidden touch-none">
      <GameRunner 
        gameState={gameState}
        setGameState={setGameState}
        setScore={setScore}
        setDinoMode={setDinoMode}
        onGameOver={handleGameOver}
      />
      
      <GameUI 
        gameState={gameState}
        score={score}
        highScore={highScore}
        dinoFact={dinoFact}
        isFactLoading={isFactLoading}
        onStart={handleStart}
        onRestart={handleRestart}
        isDinoMode={isDinoMode}
      />
    </div>
  );
};

export default App;