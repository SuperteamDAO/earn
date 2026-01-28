import ImageLoader from '../ImageLoader';

interface TestimonialCardProps {
  imgurl: string;
  content: string;
  name: string;
  username: string;
  twturl: string;
}

export default function TestimonialCard({
  imgurl,
  content,
  name,
  username,
  twturl,
}: TestimonialCardProps) {
  return (
    <a
      href={twturl}
      className="cursor-pointer"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="test-container flex h-fit flex-col items-start rounded-[5px] px-6 py-7">
        <p className="font-primary text-[14px] leading-[-0.04em] font-medium text-white md:text-[16px] lg:text-[18px]">
          {content}
        </p>
        <div className="mt-[40px] flex flex-row">
          <div className="mr-[24px] h-10 w-10">
            <ImageLoader
              src={imgurl}
              width={40}
              height={40}
              alt=""
              className="h-[40px] w-[40px] rounded-full"
              loading="lazy"
            />
          </div>
          <div className="testimonial-user">
            <p className="font-secondary text-[12px] leading-[13px] font-bold text-white md:text-[15px] md:leading-[16px] lg:text-[16px] lg:leading-[17px]">
              {name}
            </p>
            <p className="username font-primary mt-[4px] text-[12px] leading-[13px] text-white opacity-40 md:text-[15px] md:leading-[16px] lg:text-[16px] lg:leading-[17px]">
              {username}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}
