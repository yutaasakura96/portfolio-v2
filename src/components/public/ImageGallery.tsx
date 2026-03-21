"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { GalleryImageGroup } from "@/lib/validations/project";

interface ImageGalleryProps {
  groups: GalleryImageGroup[];
  projectTitle: string;
}

export function ImageGallery({ groups, projectTitle }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Flatten all groups' sorted images for the lightbox slides array
  const allImages = groups.flatMap((g) => [...g.images].sort((a, b) => a.order - b.order));

  if (allImages.length === 0) return null;

  const slides = allImages.map((img) => {
    const largeUrl = img.url.replace(/\/med_/, "/lg_").replace(/\/thumb_/, "/lg_");
    return {
      src: largeUrl,
      alt: img.alt || `${projectTitle} screenshot`,
    };
  });

  // Pre-compute the global offset of the first image in each group
  const groupOffsets: number[] = [];
  let running = 0;
  for (const g of groups) {
    groupOffsets.push(running);
    running += g.images.length;
  }

  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Gallery</h2>

      {groups.map((group, groupIdx) => {
        const sortedImages = [...group.images].sort((a, b) => a.order - b.order);
        const offset = groupOffsets[groupIdx];

        return (
          <div key={groupIdx} className="space-y-3">
            {group.name && <h3 className="text-sm font-medium text-gray-700">{group.name}</h3>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sortedImages.map((img, i) => {
                const globalIndex = offset + i;
                return (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(globalIndex)}
                    className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${projectTitle} screenshot ${globalIndex + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

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
