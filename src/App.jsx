import {useState} from "react";
import {ArrowRight, ArrowLeft, BookOpen, Camera, Sparkles} from "lucide-react";
import Blob from "./components/Blob";
import "./App.css";
import HandTracker from "./components/HandTracker";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedLetter,setSelectedLetter] =useState("A");

  return(
    <div className="app">
      <header className="navbar">
        <button
          className="logo"
          onClick={() => setPage("home")}
        >
          <span className="logo-star">*</span> signbridge
        </button>

        <div className="nav-right">
          <span className="nav-label">little signs, big connections ♡</span>
          <button
            className="nav-practise"
            onClick={() => setPage("practise")}
          >
            <BookOpen size={17} />
            practise
          </button>
        </div>
      </header>

      {page==="home" ? (
        <main className="home">
          <section className="hero">
            <div className="hero-content">
              <div className="eyebrow">
                <Sparkles size={16} />
                your signing journey starts here!
              </div>

                <h1>
                little signs,
                <br/>
                <span>big connections.</span>
              </h1>

              <p className="hero-desription">
                Learning ASL fingerspelling doesn't have to be intimidating!
                Practise letters, learn at your own pace, and make a new
                little friend along the way.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("practise")}
              >
                let's get signing!
                <ArrowRight size={20} />
              </button>

              <div className="hero-note">
                ✿ made for curious hands & curious minds
              </div>
            </div>

            <div className="hero-art">
              <div className="mascot-bacground">
                <span className="decoration decoration-one">*</span>
                <span className="decoration decoration-two">*</span>
                <span className="decoration decoration-three">*</span>

                <Blob />

                <div className="speech-bubble">
                hi friend! ♡
                </div>"
              </div>
            </div>
          </section>

          <section className="features">
            <div className="section-heading">
              <span className="eyebrow">✦ how it works</span>
              <h2>small steps, big progress!</h2>
            </div>

            <div className="feature-grid">
              <div className="feature-card pink-card">
                <div className="feature-icon">✋</div>
                <h3>learn the letters</h3>
                <p>
                  Explore the ASL fingerspelling alphabet
                  one letter at a time.
                </p>
              </div>

              <div className="feature-card mint-card">
                <div className="feature-icon">📷</div>
                <h3>practise together</h3>
                <p>
                  Use your webcam to practise handshapes
                  with your blob buddy.
                </p>
              </div>

              <div className="feature-card yellow-card">
                <div className="feature-icon">⭐</div>
                <h3>grow your skills</h3>
                <p>
                  Build confidence with challenges,
                  mini-games, and little celebrations.
                </p>
              </div>
            </div>
          </section>
        </main>

      ) : (
        <main className="practise-page">
          <button
            className="back-button"
            onClick={() => setPage("home")}
          >
            <ArrowLeft size={18} />
            back home
          </button>

          <div className="practise-heading">
            <span className="eyebrow">✦ practise time!</span>
            <h1>show me your signs!</h1>
            <p>
              Pick a letter and let's get practising.
            </p>
          </div>

          <div className="practise-grid">
            <div className="camera-card">
              <HandTracker />
            </div>

            <div className="letter-card">
              <div className="letter-card-top">
                <span>your letter</span>
                <Sparkles size={20} />
              </div>

              <div className="selected-letter">
                {selectedLetter}
              </div>

              <div className="alphabet-grid">
                {letters.map((letter) => (
                  <button
                    key={letter}
                    className={
                      selectedLetter === letter
                        ? "letter-button active"
                        : "letter-button"
                    }
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              <p className="letter-note">
                ♡ your blob buddy believes in you!
              </p>
            </div>
          </div>
        </main>
      )}

      <footer className="footer">
        made with ♡ and a little bit of magic
      </footer>
    </div>
  );
}