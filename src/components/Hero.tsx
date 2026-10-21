import React, { useEffect } from "react";
import "./Hero.css";

import MintButton from "./buttons/MintButtons";
import ConnectDisconnectButton from "./buttons/ConnectDisconnectButton";
import PlayNowButton from "./buttons/PlayNowButton";

import openingSound from "../assets/OpeningCeremonyv2.mp3"; // ✅ correct import

const Hero: React.FC = () => {
  useEffect(() => {
    const audio = new Audio(openingSound);

    const timer = setTimeout(() => {
      audio.play().catch((err) => {
        console.warn("Autoplay prevented:", err);
      });
    }, 3000); // plays 3 seconds after page load

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hero">
      <h1 className="hero-title">AirTimeArena</h1>
      <p className="hero-subtitle">Put Your Skills to the Test!</p>

      <div className="wallet-controls" style={{ marginBottom: "1rem" }}>
        <ConnectDisconnectButton />
      </div>

      <div className="tiers-container">
        <div className="tier-card">
          <div className="tier-title" style={{ fontWeight: "bold" }}>
            General Admission
          </div>
          <div className="mint-button-wrapper">
            <MintButton tier="bronze" />
          </div>
        </div>

        <div className="tier-card">
          <div className="tier-title" style={{ fontWeight: "bold" }}>
            Premium Admission
          </div>
          <div className="mint-button-wrapper">
            <MintButton tier="silver" />
          </div>
        </div>

        <div className="tier-card">
          <div className="tier-title" style={{ fontWeight: "bold" }}>
            V.I.P Admission
          </div>
          <div className="mint-button-wrapper">
            <MintButton tier="gold" />
          </div>
        </div>
      </div>

      <div className="playnow-section" style={{ marginTop: "2rem" }}>
        <p className="playnow-text">NFT Holders Can Play Now!</p>
        <PlayNowButton />
      </div>
    </section>
  );
};

export default Hero;
