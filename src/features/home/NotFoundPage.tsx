import { appRoutes } from "../../app/routes";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 pb-24 pt-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-error">
          Missing route
        </p>
        <h1 className="mt-3 text-3xl font-black text-primary-text">
          Nothing here.
        </h1>
        <p className="mt-3 text-secondary-text">
          The link may be expired or typed incorrectly.
        </p>
        <PrimaryButton className="mt-5 w-full" to={appRoutes.home}>
          Go home
        </PrimaryButton>
      </section>
    </main>
  );
}
