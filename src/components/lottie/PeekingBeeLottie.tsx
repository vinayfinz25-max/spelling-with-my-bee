import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const beeAnimationSrc =
  "https://lottie.host/6ee5477d-c140-4bfb-b08a-25940e216cfa/yPpdPISntt.lottie";

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
      src={beeAnimationSrc}
    />
  );
}
