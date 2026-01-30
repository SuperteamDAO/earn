export default function Partners() {
  return (
    <div className="partners-container col-span-5 mt-[224px] flex w-full flex-col items-center">
      <h2 className="partners-text section-heading font-secondary mr-[71px] mb-10 ml-[71px] text-center text-[24px] leading-[22px] font-bold text-white md:text-[32px] lg:leading-[26px]">
        Grant Partners
      </h2>
      <div className="flex w-full flex-col items-center">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-16 px-8 md:grid-cols-4">
          <a
            href="https://solana.org/"
            className="flex justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-8"
              src="/assets/logos/foundation.svg"
              alt="Foundation"
              loading="lazy"
            />
          </a>
          <a
            href="https://wormhole.com/"
            className="flex justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-8"
              src="/assets/logos/wormhole.svg"
              alt="Wormhole"
              loading="lazy"
            />
          </a>
          <a
            href="https://www.jup.ag/"
            className="flex justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-8"
              src="/assets/logos/jupiter.svg"
              alt="Jupiter"
              loading="lazy"
            />
          </a>
          <a
            href="https://www.circle.com/"
            className="flex justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-8"
              src="/assets/logos/circle.svg"
              alt="Circle"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
