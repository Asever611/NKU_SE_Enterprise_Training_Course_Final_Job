// StarsBackground.jsx
import { useEffect } from 'react';

export function StarsBackground() {
  useEffect(() => {
    const numStars = 400;
    const body = document.querySelector('.auth-layout');

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.classList.add('star');

      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;

      star.style.animationDuration = `${Math.random() * 1 + 0.5}s, ${Math.random() * 20 + 10}s`;
      star.style.animationDelay = `${Math.random() * 2}s`;

      body.appendChild(star);
    }

    return () => {
      // 清理星星元素
      const stars = document.querySelectorAll('.star');
      stars.forEach(star => star.remove());
    };
  }, []);

  return null;
}