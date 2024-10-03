import React from "react";

export default function LoadingDots(props) {
  const containerStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center"
  };

  const dotsContainerStyle = {
    display: "flex",
    marginLeft: "10px"
  };

  const dotStyle = {
    fontSize: "24px",
    animation: "blink 1.5s infinite",
  };

  const dot2Style = {
    ...dotStyle,
    animationDelay: "0.3s",
  };

  const dot3Style = {
    ...dotStyle,
    animationDelay: "0.6s",
  };

  const blinkAnimation = `
    @keyframes blink {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  const { text } = props;

  return (
    <div>
      {/* Inject the keyframes directly into a style tag */}
      <style>{blinkAnimation}</style>
      <div style={containerStyle}>
        <span>{text}</span>
        <span style={dotsContainerStyle}>
          <span style={dotStyle}>.</span>
          <span style={dot2Style}>.</span>
          <span style={dot3Style}>.</span>
        </span>
      </div>
    </div>
  );
};
