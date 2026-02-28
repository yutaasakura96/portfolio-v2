"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface GalleryImage {
  url: string;
  alt: string;
  order: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  projectTitle: string;
}

export function ImageGallery({ images, projectTitle }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  if (sortedImages.length === 0) return null;

  const slides = sortedImages.map((img) => {
    const largeUrl = img.url
      .replace(/\/med_/, "/lg_")
      .replace(/\/thumb_/, "/lg_");
    return {
      src: largeUrl,
      alt: img.alt || `${projectTitle} screenshot`,
    };
  });

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Gallery
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sortedImages.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Image
              src={img.url}
              alt={img.alt || `${projectTitle} screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
        }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
}
