export default function Loading() {
  const text = "AH BRAND";
  const totalLetters = text.length;
  
  // Generate CSS for each letter animation with staggered delays
  let letterStyles = '';
  for (let i = 0; i < totalLetters; i++) {
    const delay = i * 0.15; // 150ms stagger per letter
    letterStyles += `
      .fade-letter-${i} {
        animation: letter-fade 2s ease-in-out ${delay}s infinite;
      }
    `;
  }

  return (
    <div style={{
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      width: "100vw",
      background: "var(--background)",
      color: "var(--foreground)",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      direction: "ltr"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes letter-fade {
          0% { opacity: 0; filter: blur(8px); transform: translateY(8px); }
          20% { opacity: 1; filter: blur(0px); transform: translateY(0); }
          60% { opacity: 1; filter: blur(0px); transform: translateY(0); }
          80% { opacity: 0; filter: blur(8px); transform: translateY(-8px); }
          100% { opacity: 0; filter: blur(8px); transform: translateY(-8px); }
        }
        .fade-logo-container {
          display: flex;
          align-items: center;
          direction: ltr;
          unicode-bidi: bidi-override;
        }
        .fade-letter {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          color: var(--foreground);
          opacity: 0;
          display: inline-block;
        }
        .fade-letter-light {
          font-weight: 300;
          opacity: 0;
        }
        .fade-letter-space {
          width: 0.6rem;
        }
        ${letterStyles}
      `}} />
      <div className="fade-logo-container">
        {text.split('').map((char, i) => (
          <span
            key={i}
            className={`fade-letter ${i >= 3 ? 'fade-letter-light' : ''} ${char === ' ' ? 'fade-letter-space' : ''} fade-letter-${i}`}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
}
