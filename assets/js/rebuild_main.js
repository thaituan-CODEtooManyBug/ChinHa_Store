  // Hiển thị/ẩn nút mobile-nav-toggle dựa vào width
  function updateNavDisplay() {
    const nav = document.querySelector('.navmenu ul');
    const toggle = document.getElementById('mobileNavToggle');
    if (window.innerWidth < 900) {
      toggle.style.display = 'inline-block';
      nav.style.display = 'none';
    } else {
      toggle.style.display = 'none';
      nav.style.display = 'flex';
    }
  }

  // Toggle navmenu khi bấm nút
  document.getElementById('mobileNavToggle').onclick = function() {
    const nav = document.querySelector('.navmenu ul');
    if (nav.style.display === 'block') {
      nav.style.display = 'none';
    } else {
      nav.style.display = 'block';
    }
  };

  window.addEventListener('resize', updateNavDisplay);
  window.addEventListener('DOMContentLoaded', updateNavDisplay);
    function updateNavDisplay() {
    const toggle = document.getElementById('mobileNavToggle');
    if (window.innerWidth < 1200) {
      toggle.style.display = 'inline-block';
    } else {
      toggle.style.display = 'none';
      document.body.classList.remove('mobile-nav-active');
    }
  }

  document.getElementById('mobileNavToggle').onclick = function() {
    document.body.classList.toggle('mobile-nav-active');
  };

  window.addEventListener('resize', updateNavDisplay);
  window.addEventListener('DOMContentLoaded', updateNavDisplay);
//Hiệu ứng carousel đơn giản
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.carousel-img');
  let current = 0;
  function showImage(idx) {
    images.forEach((img, i) => {
      img.classList.toggle('active', i === idx);
    });
  }
  function nextImage() {
    current = (current + 1) % images.length;
    showImage(current);
  }
  setInterval(nextImage, 3000); // đổi ảnh mỗi 3 giây
  showImage(current);
});

// Fade up animation for trending-products
document.addEventListener('DOMContentLoaded', function() {
  const trendingSection = document.querySelector('.trending-products');
  if (!trendingSection) return;

  function fadeUpOnScroll() {
    const rect = trendingSection.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      trendingSection.classList.add('fade-up');
      window.removeEventListener('scroll', fadeUpOnScroll);
    }
  }
  window.addEventListener('scroll', fadeUpOnScroll);
  fadeUpOnScroll();
});
document.addEventListener('DOMContentLoaded', function() {
  const productList = document.querySelector('.product-list');
  if (!productList) return;

  // Chỉ áp dụng trên mobile
  if (window.innerWidth <= 800) {
    let scrollAmount = 0;
    let autoScroll = setInterval(() => {
      scrollAmount += 180; // cuộn ngang bằng đúng 1 sản phẩm
      if (scrollAmount >= productList.scrollWidth - productList.clientWidth) {
        scrollAmount = 0;
      }
      productList.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }, 3500); // đổi sản phẩm mỗi 3.5 giây

    // Dừng auto scroll khi người dùng chạm vào danh sách
    productList.addEventListener('touchstart', () => clearInterval(autoScroll));
  }
});