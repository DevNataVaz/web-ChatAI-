import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

export default function AnimatedText() {
  const textRef = useRef(null);

  useEffect(() => {
    const words = ["automatizar", "otimizar", "transformar"];
    let wordIndex = 0;

    const animateText = () => {
      gsap.to(textRef.current, {
        duration: 1,
        text: words[wordIndex],
        ease: "none",
        onComplete: () => {
          gsap.to(textRef.current, {
            delay: 1,
            duration: 0.5,
            text: '',
            onComplete: () => {
              wordIndex = (wordIndex + 1) % words.length;
              animateText();
            }
          });
        }
      });
    };

    animateText();
  }, []);

  return (
    <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>
      Com nosso sistema, você pode <span style={{ color: '#007bff' }} ref={textRef}></span> seu negócio.
    </h2>
  );
}
