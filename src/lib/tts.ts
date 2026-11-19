export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    text.replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/−/g, " minus ").replace(/(\d)\/(\d)/g, "$1 over $2"),
  );
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}
