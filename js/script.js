document.addEventListener('DOMContentLoaded', () => {
    const parallaxContainer = document.getElementById('parallax-container');
    const hotspots = document.querySelectorAll('.hotspot');

    // Pan state logic (-1 for left edge, 1 for right edge)
    let currentPanX = 0;
    let targetPanX = 0;

    // Interaction mode
    let interactionMode = 'mouse';
    let wheelTimeout;

    // Center logic
    let centerX = window.innerWidth / 2;
    window.addEventListener('resize', () => {
        centerX = window.innerWidth / 2;
    });

    // Hàm toán học S-Curve (Smoothstep) để tạo cảm giác thực:
    // Chậm ở vùng trung tâm -> Nhanh ở lưng chừng -> Chậm dần và êm ái khi ra 2 rìa
    function smoothSCurve(x) {
        let absX = Math.abs(x);
        // smoothstep formula: 3x^2 - 2x^3
        let curved = absX * absX * (3 - 2 * absX);
        return Math.sign(x) * curved;
    }

    // 1. Mouse Tracking Mode
    document.addEventListener('mousemove', (e) => {
        if (interactionMode === 'touch' || interactionMode === 'wheel') return;

        // Chuyển tọa độ chuột thành khoảng giá trị từ -1 (Trái) đến 1 (Phải)
        let normalizedX = (e.clientX / window.innerWidth) * 2 - 1;

        // Điều chỉnh giá trị theo đường cong S-Curve
        targetPanX = smoothSCurve(normalizedX);
    });

    // 2. Wheel/Trackpad Mode
    document.addEventListener('wheel', (e) => {
        interactionMode = 'wheel';

        let deltaX = e.deltaX;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            deltaX = e.deltaY;
        }

        targetPanX += deltaX / (window.innerWidth / 2);
        targetPanX = Math.max(-1, Math.min(1, targetPanX));

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => { interactionMode = 'mouse'; }, 400);
    }, { passive: true });

    // 3. Touch/Swipe Mode
    let startTouchX = 0;
    let startPanTarget = 0;

    document.addEventListener('touchstart', (e) => {
        interactionMode = 'touch';
        startTouchX = e.touches[0].clientX;
        startPanTarget = targetPanX;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (interactionMode !== 'touch') return;
        const deltaTouchX = e.touches[0].clientX - startTouchX;

        const panShift = -(deltaTouchX / (window.innerWidth / 2));
        targetPanX = startPanTarget + panShift;
        targetPanX = Math.max(-1, Math.min(1, targetPanX));
    }, { passive: true });

    document.addEventListener('touchend', () => {
        setTimeout(() => { interactionMode = 'mouse'; }, 100);
    });

    // 60FPS Smooth Rendering
    function animate() {
        // Tốc độ nội suy siêu mượt, giảm còn 1/3 theo đúng mong muốn của bạn -> 0.012
        currentPanX += (targetPanX - currentPanX) * 0.024;

        // Mô phỏng hiệu ứng: NHÌN QUANH (Rotation) kết hợp VÙNG GIỮA CẬN CẢNH (Scale)
        // Bằng cách chỉ zoom tỷ lệ lên (1.25) và KHÔNG dùng translateX, 
        // Thay vào đó dùng góc xoay rotateY, sẽ ép tấm ảnh bao trọn như 1 cylinder trước tầm mắt.

        const maxRotateY = 16; // Góc quay tối đa sang 2 bên (giới hạn góc quay để không thấy ranh giới)
        const rotateY = currentPanX * maxRotateY;

        // Scale(1.25): đảm bảo hình ảnh phình to ra mọi góc, tự chặn mọi viền đen trên/dưới và 2 bên
        // Cảm giác uốn cong xảy ra khi rotateY áp dụng với Perspective của #wrapper
        parallaxContainer.style.transform = `scale(1.25) rotateY(${rotateY}deg)`;

        requestAnimationFrame(animate);
    }
    animate();

    // Hotspot Click Logic
    hotspots.forEach(spot => {
        const trigger = spot.querySelector('.hotspot-trigger');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();

            const isActive = spot.classList.contains('active');

            hotspots.forEach(s => s.classList.remove('active'));

            if (!isActive) {
                // Mở thẻ này lên
                spot.classList.add('active');

                // Hiệu ứng nhẹ nhịp tim phản hồi tại chỗ click
                const marker = spot.querySelector('.spot-marker');
                marker.style.transform = "scale(0.8)";
                setTimeout(() => {
                    marker.style.transform = "scale(1.3)";
                }, 100);
            }
        });
    });

    document.body.addEventListener('click', () => {
        hotspots.forEach(s => s.classList.remove('active'));
    });
});
