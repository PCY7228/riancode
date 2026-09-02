document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements for Login Page ----
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const fullNameInput = document.getElementById('fullName');
    const nameField = document.getElementById('nameField');
    const submitBtn = document.getElementById('submitBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const switchModeBtn = document.getElementById('switchModeBtn');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const switchText = document.getElementById('switchText');
    const errorMessage = document.getElementById('errorMessage');

    let isLoginMode = true;

    // Toggle Login / Signup Mode
    if (switchModeBtn) {
        switchModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            
            errorMessage.style.display = 'none';

            if (isLoginMode) {
                authTitle.textContent = 'เข้าสู่ระบบ';
                authSubtitle.textContent = 'ยินดีต้อนรับกลับมา! กรุณาเข้าสู่ระบบเพื่อเรียนต่อ';
                nameField.style.display = 'none';
                submitBtn.textContent = 'เข้าสู่ระบบ';
                switchText.textContent = 'ยังไม่มีบัญชีผู้ใช้?';
                switchModeBtn.textContent = 'สมัครสมาชิก';
            } else {
                authTitle.textContent = 'สมัครสมาชิก';
                authSubtitle.textContent = 'เริ่มต้นเส้นทางการเขียนโค้ดของคุณกับเรา';
                nameField.style.display = 'block';
                submitBtn.textContent = 'สมัครสมาชิก';
                switchText.textContent = 'มีบัญชีอยู่แล้ว?';
                switchModeBtn.textContent = 'เข้าสู่ระบบ';
            }
        });
    }

    // Show Error Message
    const showError = (msg) => {
        if(errorMessage) {
            errorMessage.textContent = msg;
            errorMessage.style.display = 'block';
        } else {
            alert(msg);
        }
    };

    // Handle Email/Password Submit
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value;
            const password = passwordInput.value;
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังประมวลผล...';

            if (isLoginMode) {
                // Login
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    showError(error.message);
                } else {
                    window.location.href = 'index.html'; // Redirect to home
                }
            } else {
                // Sign Up
                const fullName = fullNameInput.value;
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            avatar_url: '' // Default empty avatar
                        }
                    }
                });

                if (error) {
                    showError(error.message);
                } else {
                    alert('สมัครสมาชิกสำเร็จ! โปรดยืนยันอีเมลของคุณ (ถ้าคุณเปิด Confirm Email ไว้) หรือเข้าสู่ระบบได้เลย');
                    // Automatically switch to login mode after signup
                    switchModeBtn.click();
                }
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
        });
    }

    // Handle Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/cp321001/index.html' // Adjust according to your path
                }
            });
            if (error) showError(error.message);
        });
    }

    // ---- Global Auth State & UI Update ----
    const updateUIForAuth = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // Find Nav Actions container in index.html
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return; // Not on a page with navbar

        if (session) {
            // User is logged in
            const user = session.user;
            let avatarUrl = user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user.user_metadata?.full_name || user.email);

            navActions.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${avatarUrl}" alt="Profile" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--primary-color); object-fit: cover;">
                    <button class="btn btn-outline" id="logoutBtn">ออกจากระบบ</button>
                </div>
            `;

            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                window.location.reload();
            });
        } else {
            // User is not logged in
            navActions.innerHTML = `
                <a href="login.html" class="btn btn-outline">เข้าสู่ระบบ</a>
                <a href="login.html" class="btn btn-primary">เริ่มเรียนฟรี</a>
            `;
        }
    };

    // Check auth state on load
    updateUIForAuth();

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            updateUIForAuth();
        }
    });
});
