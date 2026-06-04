// ============================================
// SearchBar.jsx - Top Search Bar Component
// ============================================
import { useState, useRef } from "react";
import styles from "./SearchBar.module.css";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const MicIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#7c3aed" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SearchBar = ({ onSearch }) => {
  const [value, setValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleMic = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setMicActive((p) => !p);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    setMicActive(true);
    recognition.start();
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setValue(transcript);
      onSearch?.(transcript);
    };
    recognition.onend = () => setMicActive(false);
    recognition.onerror = () => setMicActive(false);
  };

  const handleClear = () => {
    setValue("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <span className={styles.searchIcon}><SearchIcon /></span>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Search books, authors, categories..."
          value={value}
          onChange={handleChange}
        />
        {value && (
          <button className={styles.clearBtn} onClick={handleClear} aria-label="Clear search">✕</button>
        )}
        <button
          className={`${styles.micBtn} ${micActive ? styles.micActive : ""}`}
          onClick={handleMic}
          aria-label="Voice search"
        >
          <MicIcon active={micActive} />
          {micActive && <span className={styles.micPulse} />}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
