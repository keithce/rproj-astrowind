import { useEffect, useRef, useState, useCallback } from 'react';
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
  const swiperInstanceRef = useRef<Swiper | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to open modal with proper focus management
  const openModal = useCallback((fullSrc: string, alt: string) => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    setModalSrc(fullSrc);
    setModalAlt(alt);
    setIsLoading(true);
  }, []);

  // Function to close modal and restore focus
  const closeModal = useCallback(() => {
    setModalSrc(null);
    setModalAlt('');
    setIsLoading(false);

    // Restore focus to the previously active element
    if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, []);

  // Handle keyboard events for slides
  const handleSlideKeyDown = useCallback(
    (e: React.KeyboardEvent, fullSrc: string, alt: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(fullSrc, alt);
      }
    },
    [openModal]
  );

  // Handle modal keyboard events
  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    },
    [closeModal]
  );

  // Focus management for modal
  useEffect(() => {
    if (modalSrc && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus();
    }
  }, [modalSrc]);

  useEffect(() => {
    if (!swiperRef.current) return;

    // Create Swiper instance and store it in ref for proper cleanup
    swiperInstanceRef.current = new Swiper(
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
        openModal(t.dataset.fullSrc, t.alt);
      }
    };
    swiperRef.current.addEventListener('click', handler);

    return () => {
      // Clean up click event listener
      swiperRef.current?.removeEventListener('click', handler);

      // Destroy Swiper instance to remove event listeners and timers
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={swiperRef} className={`swiper mySwiper ${className}`}>
        <div className="swiper-wrapper">
          {images.map(img => (
            <div
              className="swiper-slide"
              key={img.fullSrc}
              tabIndex={0}
              role="button"
              aria-label={`View full size image: ${img.alt}`}
              onKeyDown={e => handleSlideKeyDown(e, img.fullSrc, img.alt)}
            >
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
        <div
          ref={modalRef}
          className="modal active"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          tabIndex={-1}
          onClick={closeModal}
          onKeyDown={handleModalKeyDown}
        >
          <div id="modal-title" className="sr-only">
            Full size image
          </div>
          <div id="modal-description" className="sr-only">
            Press Escape to close this dialog
          </div>
          {isLoading && <div className="modal-preloader"></div>}
          <img src={modalSrc} className="modal-content" alt={modalAlt} onLoad={() => setIsLoading(false)} />
        </div>
      )}

      <style>{`
        .swiper { width: 100%; height: 400px; }
        .swiper-slide { 
          display:flex;
          justify-content:center;
          align-items:center;
          overflow:hidden;
          background:transparent;
          outline: none;
          border-radius: 8px;
          transition: box-shadow 0.2s ease;
        }
        .swiper-slide:focus {
          box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.3);
        }
        .slide-img { width:100%;height:100%;object-fit:cover;cursor:zoom-in; }
        /* modal */
        .modal {
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.9);
          display:flex;
          justify-content:center;
          align-items:center;
          z-index:1000;
          cursor:zoom-out;
          outline: none;
        }
        .modal:focus {
          outline: none;
        }
        .modal-content{
          max-width:90%;
          max-height:90%;
          object-fit:contain;
        }
        /* Screen reader only text */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        /* swiper lazy preloader default */
        .swiper-lazy-preloader{width:42px;height:42px;position:absolute;left:50%;top:50%;margin-left:-21px;margin-top:-21px;z-index:10;box-sizing:border-box;border:4px solid #fff;border-radius:50%;border-top-color:transparent;animation:swiper-preloader-spin 1s linear infinite;}
        @keyframes swiper-preloader-spin{100%{transform:rotate(360deg)}}
        .modal-preloader{width:48px;height:48px;border:5px solid #fff;border-top-color:transparent;border-radius:50%;position:absolute;left:50%;top:50%;margin:-24px 0 0 -24px;animation:swiper-preloader-spin 1s linear infinite;z-index:1001;}
      `}</style>
    </>
  );
}
