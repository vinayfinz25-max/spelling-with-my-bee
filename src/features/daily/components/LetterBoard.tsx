import { motion } from "framer-motion";

interface LetterBoardProps {
  centerLetter: string;
  outerLetters: readonly string[];
  onLetterPress: (letter: string) => void;
}

export function LetterBoard({
  centerLetter,
  outerLetters,
  onLetterPress
}: LetterBoardProps) {
  const positions = [
    "left-1/2 top-0 -translate-x-1/2",
    "right-3 top-14",
    "right-3 bottom-14",
    "left-1/2 bottom-0 -translate-x-1/2",
    "left-3 bottom-14",
    "left-3 top-14"
  ] as const;

  return (
    <div
      aria-label="Letter board"
      className="relative mx-auto h-[19rem] w-full max-w-[21rem]"
    >
      {outerLetters.map((letter, index) => (
        <LetterButton
          className={positions[index] ?? ""}
          key={`${letter}-${String(index)}`}
          letter={letter}
          onPress={onLetterPress}
        />
      ))}
      <LetterButton
        isCenter
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        letter={centerLetter}
        onPress={onLetterPress}
      />
    </div>
  );
}

interface LetterButtonProps {
  className?: string;
  isCenter?: boolean;
  letter: string;
  onPress: (letter: string) => void;
}

function LetterButton({
  className = "",
  isCenter = false,
  letter,
  onPress
}: LetterButtonProps) {
  return (
    <motion.button
      aria-label={`Add ${letter.toUpperCase()}`}
      className={[
        "hex-letter absolute grid size-24 place-items-center border border-border text-3xl font-black uppercase shadow-sm outline-none transition-colors focus:ring-2 focus:ring-blue-accent focus:ring-offset-2",
        isCenter
          ? "bg-primary-yellow text-primary-text"
          : "bg-white text-primary-text hover:bg-primary-yellow/25",
        className
      ].join(" ")}
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        onPress(letter);
      }}
    >
      <motion.span
        key={letter}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {letter}
      </motion.span>
    </motion.button>
  );
}
