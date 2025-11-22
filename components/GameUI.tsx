import React from 'react';
import { GameState } from '../types';

interface GameUIProps {
  gameState: GameState;
  score: number;
  highScore: number;
  dinoFact: string;
  isFactLoading: boolean;
  onStart: () => void;
  onRestart: () => void;
  isDinoMode: boolean;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  score,
  highScore,
  dinoFact,
  isFactLoading,
  onStart,
  onRestart,
  isDinoMode
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
      
      {/* HUD */}
      <div className="flex justify-between w-full max-w-4xl mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border-4 border-yellow-400 shadow-lg">
           <span className="text-2xl font-bold text-yellow-600 mr-2">⭐</span>
           <span className="text-3xl font-black text-gray-800">{score}</span>
        </div>
        
        {isDinoMode && (
          <div className="animate-bounce bg-red-500 text-white px-6 py-3 rounded-2xl border-4 border-red-700 shadow-lg transform rotate-2">
            <span className="text-2xl font-black">ROAR! SMASH! 🦖</span>
          </div>
        )}
      </div>

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-b-8 border-blue-500 flex flex-col items-center animate-in zoom-in duration-300 max-w-sm text-center">
          <h1 className="text-5xl font-black text-blue-600 mb-2 tracking-tight">DinoBus</h1>
          <h2 className="text-4xl font-black text-yellow-500 mb-6 tracking-wide">RUNNER</h2>
          <div className="text-6xl mb-6 flex gap-4 animate-pulse">
            <span>🚌</span><span>💨</span><span>🦖</span>
          </div>
          <p className="text-gray-600 font-bold mb-8 text-xl">Tap to Jump! <br/>Collect 💎 to become a DINO!</p>
          <button 
            onClick={onStart}
            className="bg-green-500 hover:bg-green-600 text-white text-3xl font-black py-4 px-12 rounded-full shadow-[0_6px_0_rgb(21,128,61)] active:shadow-[0_2px_0_rgb(21,128,61)] active:translate-y-1 transition-all"
          >
            PLAY!
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-b-8 border-red-500 flex flex-col items-center animate-in zoom-in duration-300 max-w-md text-center">
          <h2 className="text-4xl font-black text-red-500 mb-2">OOPS!</h2>
          <div className="bg-yellow-100 rounded-xl p-4 mb-6 w-full">
            <p className="text-gray-500 font-bold text-lg uppercase tracking-wide mb-1">Score</p>
            <p className="text-5xl font-black text-gray-800 mb-2">{score}</p>
            <p className="text-gray-500 font-bold text-sm">Best: {highScore}</p>
          </div>

          {/* Dino Fact Section */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 w-full border-2 border-blue-100">
             <h3 className="text-blue-500 font-black text-lg mb-2 flex items-center justify-center gap-2">
               <span>🦕</span> DINO FACT
             </h3>
             {isFactLoading ? (
               <div className="flex justify-center space-x-2 py-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-150"></div>
               </div>
             ) : (
               <p className="text-gray-700 font-bold text-lg leading-snug">
                 "{dinoFact}"
               </p>
             )}
          </div>

          <button 
            onClick={onRestart}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-2xl font-black py-4 px-10 rounded-full shadow-[0_6px_0_rgb(202,138,4)] active:shadow-[0_2px_0_rgb(202,138,4)] active:translate-y-1 transition-all w-full"
          >
            TRY AGAIN ↺
          </button>
        </div>
      )}

      {/* Footer / Controls Hint */}
      {gameState === GameState.PLAYING && (
        <div className="text-white/50 font-bold text-xl mb-4 pointer-events-none">
          Tap or Press Space to Jump
        </div>
      )}
    </div>
  );
};

export default GameUI;
