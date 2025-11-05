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