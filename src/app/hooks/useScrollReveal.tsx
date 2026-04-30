import { useEffect } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Scroll Animation Engine - Siêu nhẹ, tối ưu hiệu suất
 * Sử dụng Intersection Observer API để detect viewport
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    once = true
  } = options;

  useEffect(() => {
    // Tìm tất cả elements có data-vibe="reveal"
    const revealElements = document.querySelectorAll<HTMLElement>('[data-vibe="reveal"]');
    
    if (revealElements.length === 0) return;

    // Intersection Observer callback
    const handleIntersect = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Thêm class 'revealed' khi element vào viewport
          entry.target.classList.add('revealed');
          
          // Nếu once=true, ngừng observe element này
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          // Nếu once=false, cho phép animation lặp lại
          entry.target.classList.remove('revealed');
        }
      });
    };

    // Tạo observer với options tối ưu
    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin
    });

    // Observe tất cả elements
    revealElements.forEach(element => {
      observer.observe(element);
    });

    // Cleanup khi component unmount
    return () => {
      revealElements.forEach(element => {
        observer.unobserve(element);
      });
    };
  }, [threshold, rootMargin, once]);
}
