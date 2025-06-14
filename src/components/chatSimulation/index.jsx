import React, { useEffect, useState, useRef } from 'react';
import './chatSimulation.css';
import Avatar from '../../assets/IAperfil.png'

const messageFlow = [
  { text: 'Oi, tudo bem? Preciso de ajuda com automação.', side: 'left' },
  { text: 'Olá! Tudo ótimo 😊 Como posso te ajudar hoje?', side: 'right' },
  { text: 'Queria automatizar mensagens para meus clientes no WhatsApp.', side: 'left' },
  { text: 'Perfeito! Isso é totalmente possível com nossa plataforma.', side: 'right' },
  { text: 'É difícil configurar?', side: 'left' },
  { audio: true, side: 'right' },
  { text: 'Uau! vocês ainda disponibilizam teste gratis!! que maravilha', side: 'left' },
  { text: 'Vou me inscrever agora, obrigado!', side: 'left' },
];

const ChatSimulation = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

// No componente ChatSimulation.jsx, vamos ajustar o useEffect para o audioRef

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  // Função para ajustar o tamanho do player de áudio com base na largura da tela
  const adjustAudioPlayerSize = () => {
    const windowWidth = window.innerWidth;
    if (windowWidth <= 450) {
      // Ajustes para telas muito pequenas
      setAudioDuration(audio.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    setAudioCurrentTime(audio.currentTime);
    setAudioProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    setAudioDuration(audio.duration);
    adjustAudioPlayerSize();
  };

  const handleEnded = () => {
    setAudioProgress(100);
    setIsPlaying(false);
  };

  // Adicionar listener para redimensionamento
  window.addEventListener('resize', adjustAudioPlayerSize);
  audio.addEventListener('timeupdate', handleTimeUpdate);
  audio.addEventListener('loadedmetadata', handleLoadedMetadata);
  audio.addEventListener('ended', handleEnded);
  
  // Executar o ajuste inicial
  adjustAudioPlayerSize();
  
  return () => {
    window.removeEventListener('resize', adjustAudioPlayerSize);
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('ended', handleEnded);
  };
}, []);


  useEffect(() => {
    if (currentIndex < messageFlow.length) {
      setIsTyping(true);

      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, messageFlow[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);

        // Ativa o efeito pulsante quando for o áudio
        if (messageFlow[currentIndex].audio) {
          setIsAudioActive(true);
        }
      }, 3000);

      return () => clearTimeout(typingTimeout);
    }
  }, [currentIndex]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      setIsAudioActive(false);
    }
    setIsPlaying(!isPlaying);
    
    // Remover o efeito pulsante quando o áudio é reproduzido pela primeira vez
    if (isAudioActive) {
      setIsAudioActive(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setAudioProgress(100);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="chat-container">
      <div className="phone-frame">
        {messages.map((msg, index) =>
          msg.audio ? (
            <div
              key={index}
              className={`chat-bubble ${msg.side} audio ${isAudioActive ? '' : ''}`}
            >
              <audio ref={audioRef} src="/audio/Mensagem.mp3" preload="metadata" />
              <div className="audio-content">
                <div className="audio-avatar">
                  <img src={Avatar} alt="Avatar" className="avatar-img" />
                </div>
                <div className="audio-controls">
                  <button 
                    className={`play-button ${isPlaying ? 'playing' : ''} ${isAudioActive ? 'pulse' : ''}`} 
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? '❚❚' : '▶'}
                  </button>
                  <div className="audio-info">
                    <div className="audio-bar">
                      <div className="progress" style={{ width: `${audioProgress}%` }}></div>
                    </div>
                    <div className="audio-time">
                      {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div key={index} className={`chat-bubble ${msg.side}`}>
              {msg.text}
            </div>
          )
        )}

        {isTyping && (
          <div className={`chat-bubble ${messageFlow[currentIndex].side} typing`}>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSimulation;