document.addEventListener('DOMContentLoaded', () => {
    // Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        // Initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
        
        observer.observe(card);
    });

    // 3D effect on hero code window based on mouse position
    const hero = document.querySelector('.hero');
    const codeWindow = document.querySelector('.code-window');
    
    if (hero && codeWindow) {
        // Only apply 3D effect on desktop sizes
        if (window.innerWidth > 968) {
            hero.addEventListener('mousemove', (e) => {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
                codeWindow.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
            });
            
            hero.addEventListener('mouseleave', () => {
                codeWindow.style.transform = '';
            });
        }
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const navActions = document.querySelector('.nav-actions');

    if (mobileMenuBtn && navLinks && navActions) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navActions.classList.toggle('active');
        });
    }
});
