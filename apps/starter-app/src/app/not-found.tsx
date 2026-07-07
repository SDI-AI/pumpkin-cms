export default function NotFound() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase text-pumpkin-600">404</p>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-neutral-950">
          Page not found
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          This route does not have a published Pumpkin CMS page yet.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-md bg-pumpkin-600 px-5 py-3 text-sm font-bold text-white hover:bg-pumpkin-700"
        >
          Back home
        </a>
      </div>
    </section>
  );
}
