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
        if (errorMessage) {
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
                    window.location.href = 'dashboard.html'; // Redirect to dashboard
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
            const redirectUrl = new URL('dashboard.html', window.location.href).href;
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });
            if (error) showError(error.message);
        });
    }

    // ---- Global Auth State & UI Update ----
    const updateUIForAuth = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();

        // Route protection logic
        if (document.body.dataset.protected === 'true' && !session) {
            window.location.href = 'login.html';
            return;
        }

        if (document.body.dataset.guestOnly === 'true' && session) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Find Nav Actions container in index.html or dashboard.html
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return; // Not on a page with navbar

        if (session) {
            // User is logged in
            const user = session.user;

            // Check Database for profile
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            let rawAvatar = null;
            let fallbackName = 'User';

            if (profile) {
                rawAvatar = profile.avatar_url;
                fallbackName = profile.full_name || fallbackName;
            }

            // Fallback to Session data if DB data is missing
            if (!rawAvatar) {
                rawAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

                if (!rawAvatar && user.identities) {
                    for (const identity of user.identities) {
                        if (identity.identity_data && (identity.identity_data.avatar_url || identity.identity_data.picture)) {
                            rawAvatar = identity.identity_data.avatar_url || identity.identity_data.picture;
                            break;
                        }
                    }
                }
            }

            if (!profile && user.user_metadata?.full_name) {
                fallbackName = user.user_metadata.full_name;
            }

            if (!profile && user.email && fallbackName === 'User') {
                fallbackName = user.email;
            }

            let avatarUrl = rawAvatar ? rawAvatar : 'https://ui-avatars.com/api/?background=10b981&color=fff&name=' + encodeURIComponent(fallbackName);

            const isIndexPage = window.location.pathname.endsWith('index.html') || 
                                window.location.pathname.endsWith('index') || 
                                window.location.pathname === '/' || 
                                window.location.pathname.endsWith('/cp321001/') || 
                                window.location.pathname.endsWith('/cp321001');

            const upgradeBtnHtml = isIndexPage ? '' : `
                <a href="upgrade.html" class="btn-upgrade-nav">
                    <span>👑</span>
                    <span>อัปเกรด PRO</span>
                </a>
            `;

            navActions.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    ${upgradeBtnHtml}
                    <div class="profile-dropdown">
                        <img src="${avatarUrl}" id="profileDropdownBtn" alt="Profile" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--primary-color); object-fit: cover; cursor: pointer;">
                        <div class="profile-dropdown-menu" id="profileDropdownMenu">
                            <a href="dashboard.html" class="dropdown-item">โปรไฟล์ของฉัน</a>
                            <a href="settings.html" class="dropdown-item">ตั้งค่าบัญชี</a>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item" id="logoutBtn" style="color: #ef4444;">ออกจากระบบ</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Dropdown Toggle Logic
            const profileBtn = document.getElementById('profileDropdownBtn');
            const dropdownMenu = document.getElementById('profileDropdownMenu');
            
            if (profileBtn && dropdownMenu) {
                profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });

                document.addEventListener('click', (e) => {
                    if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                        dropdownMenu.classList.remove('show');
                    }
                });
            }

            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                if (document.body.dataset.protected === 'true') {
                    window.location.href = 'index.html';
                } else {
                    window.location.reload();
                }
            });
        } else {
            // User is not logged in
            const isIndexPage = window.location.pathname.endsWith('index.html') || 
                                window.location.pathname.endsWith('index') || 
                                window.location.pathname === '/' || 
                                window.location.pathname.endsWith('/cp321001/') || 
                                window.location.pathname.endsWith('/cp321001');

            const upgradeBtnHtml = isIndexPage ? '' : `
                <a href="upgrade.html" class="btn-upgrade-nav">
                    <span>👑</span>
                    <span>อัปเกรด PRO</span>
                </a>
            `;

            navActions.innerHTML = `
                ${upgradeBtnHtml}
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
