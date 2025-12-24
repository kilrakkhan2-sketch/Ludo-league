
import { StaticPage } from "@/components/layout/StaticPage";

export default function AboutUsPage() {
  return (
    <StaticPage 
        title="About LudoLeague"
        subtitle="More than just a game. This is a community."
    >
        <p className="lead">LudoLeague was born from a simple yet powerful idea: to elevate the classic game of Ludo from a household pastime to a premier competitive esport. We are a team of passionate gamers, developers, and dreamers dedicated to building the most fair, engaging, and rewarding Ludo platform in the world.</p>

        <h2>Our Mission</h2>
        <p>Our mission is to create a secure and vibrant arena where Ludo enthusiasts can test their skills, compete for real rewards, and be part of a thriving community. We believe in celebrating skill, strategy, and the spirit of healthy competition. We aim to provide a platform that is not only fun but also fair, transparent, and trustworthy.</p>

        <h2>Our Story</h2>
        <p>Like many, we grew up playing Ludo at family gatherings and with friends. The thrill of the chase, the strategy of blocking an opponent, and the sheer joy of landing a piece home is a feeling we cherished. As we grew, we saw the rise of online gaming and esports, but we felt that the classic games we loved were being left behind. We wanted to create a space where the strategic depth of Ludo could be showcased on a grand stage. That's how LudoLeague was born – a modern platform for a timeless game.</p>

        <h2>What We Value</h2>
        <ul>
            <li><strong>Fair Play:</strong> Our number one priority. We use certified random number generation and have strict anti-cheat measures to ensure every match is decided by skill and strategy alone.</li>
            <li><strong>Community:</strong> We are more than just a platform; we are a community. We are committed to fostering a respectful and engaging environment for all our players.</li>
            <li><strong>Security:</strong> Your trust is paramount. We use industry-leading security practices to protect your account, your data, and your funds.</li>
            <li><strong>Innovation:</strong> While we honor the classic rules, we are constantly innovating with new features, tournament formats, and ways to make the game more exciting.</li>
        </ul>

        <h2>Join Us</h2>
        <p>Whether you are a casual player looking for a fun match or a seasoned pro aiming for the top, LudoLeague is the place for you. We invite you to join our community, roll the dice, and start your journey to becoming a Ludo champion.</p>

    </StaticPage>
  );
}
