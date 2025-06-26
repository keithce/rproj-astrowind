import { useEffect, useRef, useState } from 'react';
import Swiper from 'swiper';
import { Pagination, Mousewheel, Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Image {
  src: string;
  fullSrc: string;
  alt: string;
}

interface Props {
  images: Image[];
  className?: string;
}

export default function PhotoSwiper({ images, className = '' }: Props) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!swiperRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new Swiper(
      swiperRef.current as HTMLElement,
      {
        modules: [Pagination, Mousewheel, Navigation, Keyboard],
        cssMode: true,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        mousewheel: true,
        keyboard: { enabled: true },
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 10 },
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
          1440: { slidesPerView: 4, spaceBetween: 40 },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );

    const handler = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLImageElement && t.dataset.fullSrc) {
        setModalSrc(t.dataset.fullSrc);
      }
    };
    swiperRef.current.addEventListener('click', handler);
    return () => {
      swiperRef.current?.removeEventListener('click', handler);
    };
  }, []);

  return (
    <>
      <div ref={swiperRef} className={`swiper mySwiper ${className}`}>
        <div className="swiper-wrapper">
          {images.map((img) => (
            <div className="swiper-slide" key={img.fullSrc}>
              <img
                src={img.src}
                data-full-src={img.fullSrc}
                alt={img.alt}
                loading="lazy"
                className="swiper-lazy slide-img"
              />
              <div className="swiper-lazy-preloader"></div>
            </div>
          ))}
        </div>
        <div className="swiper-pagination"></div>
        <div className="swiper-button-next"></div>
        <div className="swiper-button-prev"></div>
      </div>

      {/* Modal */}
      {modalSrc && (
        <div className="modal active" onClick={() => setModalSrc(null)}>
          <img src={modalSrc} className="modal-content" alt="Full resolution" />
        </div>
      )}

      <style>{`
        .swiper { width: 100%; height: 400px; }
        .swiper-slide { display:flex;justify-content:center;align-items:center;overflow:hidden;background:transparent;}
        .slide-img { width:100%;height:100%;object-fit:cover;cursor:zoom-in; }
        /* modal */
        .modal {position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:1000;cursor:zoom-out;}
        .modal-content{max-width:90%;max-height:90%;object-fit:contain;}
        /* swiper lazy preloader default */
        .swiper-lazy-preloader{width:42px;height:42px;position:absolute;left:50%;top:50%;margin-left:-21px;margin-top:-21px;z-index:10;box-sizing:border-box;border:4px solid #fff;border-radius:50%;border-top-color:transparent;animation:swiper-preloader-spin 1s linear infinite;}
        @keyframes swiper-preloader-spin{100%{transform:rotate(360deg)}}
      `}</style>
    </>
  );
}
