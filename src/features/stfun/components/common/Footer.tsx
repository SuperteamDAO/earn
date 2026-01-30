import AnimatedLogo from './AnimatedLogo';

export default function Footer() {
  return (
    <div className="st-footer-container relative right-1/2 left-1/2 z-10 col-span-5 h-fit w-screen -translate-x-1/2 rounded-t-[48px] md:w-[calc(100vw-144px)] lg:h-[477px]">
      <div className="main-container mt-[53px] flex h-fit flex-col justify-between lg:mt-[56px] lg:flex-row">
        <div className="overlay-logo absolute mt-[19px] ml-[50px] lg:mt-[17px] lg:ml-[72px]">
          <AnimatedLogo />
        </div>
        <div className="footer-logo ml-[40px] lg:ml-[45px]">
          <div>
            <img
              src="/assets/logos/superteam_footer.svg"
              alt=""
              className="w-3/4 md:w-1/2 lg:w-full"
            />
          </div>
          <div className="absolute -mt-[80px] md:-mt-[140px] lg:mt-0 lg:ml-[27px]">
            <p className="overlay-text">superteam</p>
          </div>
        </div>
        <div className="footer-texts mt-[64px] ml-[40px] flex flex-col pb-10 text-white md:flex-row lg:mt-0 lg:mr-[72px] lg:ml-0 lg:text-right">
          <div className="text-col-1 flex flex-col items-start gap-4 md:items-end">
            <a
              href="https://superteam.fun/earn"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-text"
            >
              Superteam Earn
            </a>
            <a
              href="https://docs.google.com/presentation/d/1m78Nu7YKdkckN5bu-pNsw3gdczEdMU_R/edit#slide=id.p1"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-text"
            >
              Brand Guidelines
            </a>
            <a
              href="mailto:support@superteam.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-text"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
