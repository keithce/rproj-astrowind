import { useEffect, useRef } from 'react';
import { Swiper } from 'swiper';
import { Navigation, Pagination, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PhotoSwiperClientProps {
  images: Array<{
    src: string;
    alt: string;
    title?: string;
  }>;
  title: string;
  category: string;
  className?: string;
}

// Function to generate different placeholder images based on category and index
function getPlaceholderImage(category: string, index: number): string {
  const baseUrl = 'https://images.unsplash.com';
  const imageIds = {
    landscape: [
      'photo-1506905925346-21bda4d32df4', // mountain landscape
      'photo-1518837695005-2083093ee35b', // ocean waves
      'photo-1441974231531-c6227db76b6e', // forest
      'photo-1439066615861-d1af74d74000', // lake
      'photo-1506905925346-21bda4d32df4', // mountain sunset
      'photo-1441974231531-c6227db76b6e', // forest path
      'photo-1439066615861-d1af74d74000', // serene lake
      'photo-1518837695005-2083093ee35b', // coastline
    ],
    portrait: [
      'photo-1507003211169-0a1dd7228f2d', // business portrait
      'photo-1500648767791-00dcc994a43e', // artistic portrait
      'photo-1535713875002-d1d0cf377fde', // professional headshot
      'photo-1608844881716-d8c27503bec8', // senior portrait
      'photo-1522075469751-3847ae348b73', // couple portrait
      'photo-1619380061814-58f03707f082', // musician portrait
      'photo-1567515004624-219c11d31f2e', // lifestyle portrait
    ],
    boudoir: [
      'photo-1594736797933-d0401ba2fe65', // elegant silhouette
      'photo-1512316731086-0d19b8a0f04e', // artistic portrait
      'photo-1567515004624-219c11d31f2e', // natural light
      'photo-1550639524-b70982e95e75', // dramatic lighting
      'photo-1609256646376-daa5e21021c7', // intimate portrait
      'photo-1596728113430-ce1d9b65b498', // elegant pose
    ],
    'maternity-children': [
      'photo-1555532538-dcdbd01d373d', // maternity portrait
      'photo-1515488042361-ee00e0ddd4e4', // newborn
      'photo-1519689680058-324335c77eba', // children playing
      'photo-1581726690015-c9861fa5057f', // expecting couple
      'photo-1595123550441-d377e017de6a', // siblings
      'photo-1554089845-5e0e0b22e6b7', // baby portrait
      'photo-1545558014-8692077e9b5c', // family moment
    ],
  };

  const categoryImages = imageIds[category as keyof typeof imageIds] || imageIds.landscape;
  const imageId = categoryImages[index % categoryImages.length];

  return `${baseUrl}/${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80`;
}

export default function PhotoSwiperClient({ images, title, category, className = '' }: PhotoSwiperClientProps) {
  const swiperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!swiperRef.current) return;

    const swiper = new Swiper(swiperRef.current, {
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
      keyboard: true,
      modules: [Navigation, Pagination, Mousewheel, Keyboard],
      loop: true,
      spaceBetween: 30,
      slidesPerView: 1,
      centeredSlides: true,
      breakpoints: {
        640: {
          slidesPerView: 1,
          spaceBetween: 20,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 30,
          centeredSlides: false,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30,
          centeredSlides: false,
        },
      },
    });

    return () => {
      swiper.destroy();
    };
  }, []);

  return (
    <div className={`photo-swiper-container ${className}`}>
      <div className="swiper-header">
        <h3 className="swiper-title">{title}</h3>
        <p className="swiper-description">Explore our {category} photography collection</p>
      </div>

      <div className="swiper-wrapper-container">
        <div className="swiper mySwiper" data-category={category} ref={swiperRef}>
          <div className="swiper-wrapper">
            {images.map((image, index) => (
              <div key={index} className="swiper-slide">
                <div className="slide-content">
                  <img
                    src={getPlaceholderImage(category, index)}
                    alt={image.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="slide-image"
                  />
                  {image.title && (
                    <div className="slide-overlay">
                      <p className="slide-title">{image.title}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-button-next"></div>
          <div className="swiper-button-prev"></div>
          <div className="swiper-pagination"></div>
        </div>
      </div>
    </div>
  );
}
