'use client';

import ImageLoader from '../ImageLoader';

interface PartnerCardProps {
  imageUrl: string;
  name: string;
  description: string;
  url: string;
  perks: string;
  duration: string;
  funding: string;
  type: string;
}

export default function PartnerCard({
  imageUrl,
  name,
  description,
  url,
  perks,
  duration,
  funding,
  type,
}: PartnerCardProps) {
  return (
    <div className="partner-card">
      <div className="partner-card-p1">
        <div className="image-container">
          <div>
            <ImageLoader
              src={imageUrl}
              alt={name}
              className="partner-image"
              loading="lazy"
            />
          </div>
        </div>
        <div className="partner-title-apply">
          <h3 className="partner-card-title">{name}</h3>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ImageLoader
              src="/assets/fast-tracks/button.svg"
              alt="Apply"
              loading="lazy"
              className="apply-button"
            />
          </a>
        </div>
        <p className="partner-card-description partner-main-description">
          {description}
        </p>
      </div>

      <div className="border-dotted">
        <div>
          <ImageLoader
            src="/assets/fast-tracks/line-one.svg"
            alt=""
            loading="lazy"
            className="line-img"
          />
        </div>
      </div>

      <div className="partner-card-p2">
        <div className="perks-section">
          <div className="icon-wrapper">
            <ImageLoader
              src="/assets/fast-tracks/perks.svg"
              alt="Perks"
              loading="lazy"
              className="icon-img"
            />
          </div>
          <p className="partner-card-description">{perks}</p>
        </div>
        <div>
          <ImageLoader
            src="/assets/fast-tracks/line-two.svg"
            alt=""
            loading="lazy"
            className="line-img"
          />
        </div>

        <div className="time-period">
          <div className="duration-section">
            <div className="icon-wrapper">
              <ImageLoader
                src="/assets/fast-tracks/duration.svg"
                alt="Duration"
                loading="lazy"
                className="icon-img"
              />
            </div>
            <p className="partner-card-description">{duration}</p>
          </div>
          <div className="funding-section">
            <div className="icon-wrapper">
              <ImageLoader
                src="/assets/fast-tracks/funding.svg"
                alt="Funding"
                loading="lazy"
                className="icon-img"
              />
            </div>
            <p className="partner-card-description">{funding}</p>
          </div>
          <div className="type-section">
            <div className="icon-wrapper">
              <ImageLoader
                src="/assets/fast-tracks/type.svg"
                alt="Type"
                loading="lazy"
                className="icon-img"
              />
            </div>
            <p className="partner-card-description">{type}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
