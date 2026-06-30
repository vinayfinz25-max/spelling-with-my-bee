import { PrimaryButton } from "../../components/PrimaryButton";

interface TroopPageProps {
  mode: "create" | "join";
}

export default function TroopPage({ mode }: TroopPageProps) {
  const isCreateMode = mode === "create";

  return (
    <main className="px-4 pb-28 pt-8 sm:pb-16">
      <section className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-border bg-white p-5 shadow-sm sm:p-8">
        <ApeMascot />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-accent">
              {isCreateMode ? "Create troop" : "Join troop"}
            </p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-primary-text sm:text-6xl">
              Apes Together Strong
            </h1>
            <p className="mt-4 text-base leading-7 text-secondary-text sm:text-lg">
              Start a private room for friends, share a short code, and watch
              the leaderboard move as everyone finds words.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
            <h2 className="text-xl font-black text-primary-text">
              {isCreateMode ? "Create troop" : "Join troop"}
            </h2>
            <label
              className="mb-2 mt-5 block text-sm font-bold text-primary-text"
              htmlFor="room-code"
            >
              Room code
            </label>
            <input
              className="min-h-12 w-full rounded-lg border border-border bg-white px-4 text-primary-text outline-none focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/30"
              id="room-code"
              placeholder="BEE42"
            />
            <PrimaryButton className="mt-4 w-full">
              {isCreateMode ? "Create" : "Join"}
            </PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function ApeMascot() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-10 -top-8 h-72 w-72 opacity-15 sm:opacity-25"
    >
      <div className="absolute left-8 top-16 size-20 rounded-full border-4 border-primary-text bg-secondary-text" />
      <div className="absolute right-8 top-16 size-20 rounded-full border-4 border-primary-text bg-secondary-text" />
      <div className="absolute inset-x-10 top-10 h-44 rounded-[4rem] border-4 border-primary-text bg-secondary-text" />
      <div className="absolute left-24 top-24 size-5 rounded-full bg-primary-text" />
      <div className="absolute right-24 top-24 size-5 rounded-full bg-primary-text" />
      <div className="absolute inset-x-20 top-32 h-20 rounded-[2rem] border-4 border-primary-text bg-primary-yellow" />
      <div className="absolute left-[7.35rem] top-36 h-4 w-6 rounded-full bg-primary-text" />
      <div className="absolute right-[7.35rem] top-36 h-4 w-6 rounded-full bg-primary-text" />
      <div className="absolute left-1/2 top-44 h-4 w-14 -translate-x-1/2 rounded-b-full border-b-4 border-primary-text" />
      <div className="absolute left-20 top-48 h-24 w-32 rounded-[2.5rem] border-4 border-primary-text bg-secondary-text" />
    </div>
  );
}
