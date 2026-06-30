import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface PeekingBeeLottieProps {
  className?: string;
}

export function PeekingBeeLottie({ className = "" }: PeekingBeeLottieProps) {
  return (
    <DotLottieReact
      aria-hidden="true"
      autoplay
      className={className}
      loop
      src="/animations/bee-peek.json"
    />
  );
}
