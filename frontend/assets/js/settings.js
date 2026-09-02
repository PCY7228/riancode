document.addEventListener('DOMContentLoaded', async () => {
    // ---- DOM Elements ----
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    // Profile Elements
    const emailInput = document.getElementById('email');
    const fullNameInput = document.getElementById('fullName');
    const usernameInput = document.getElementById('username');
    const bioInput = document.getElementById('bio');
    const githubInput = document.getElementById('github');
    const linkedinInput = document.getElementById('linkedin');
    
    // Avatar Elements
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileAlert = document.getElementById('profileAlert');

    // Password Elements
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const passwordAlert = document.getElementById('passwordAlert');

    // ---- State ----
    let currentUser = null;
    let selectedAvatarFile = null;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // ---- Helper Functions ----
    const showAlert = (el, msg, type) => {
        el.textContent = msg;
        el.style.display = 'block';
        el.className = `alert-box alert-${type}`;
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    };

    // ---- Auth Check & Data Load ----
    const loadUserData = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login';
            return;
        }

        currentUser = session.user;
        emailInput.value = currentUser.email;

        // Fetch Profile from DB
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (profile) {
            fullNameInput.value = profile.full_name || '';
            usernameInput.value = profile.username || '';
            bioInput.value = profile.bio || '';
            githubInput.value = profile.github_url || '';
            linkedinInput.value = profile.linkedin_url || '';

            let avatarUrl = profile.avatar_url;
            if (!avatarUrl && currentUser.user_metadata?.avatar_url) {
                avatarUrl = currentUser.user_metadata.avatar_url;
            }
            if (avatarUrl) {
                avatarPreview.src = avatarUrl;
            } else {
                avatarPreview.src = `https://ui-avatars.com/api/?background=10b981&color=fff&name=${encodeURIComponent(profile.full_name || currentUser.email)}`;
            }
        } else {
            // Fallbacks if profile not found
            fullNameInput.value = currentUser.user_metadata?.full_name || '';
            avatarPreview.src = `https://ui-avatars.com/api/?background=10b981&color=fff&name=${encodeURIComponent(currentUser.email)}`;
        }
    };

    // ---- Avatar File Selection ----
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate File Size (5MB)
        if (file.size > MAX_FILE_SIZE) {
            showAlert(profileAlert, 'ไฟล์มีขนาดใหญ่เกินไป (จำกัดสูงสุด 5MB)', 'error');
            avatarInput.value = ''; // Reset input
            return;
        }

        selectedAvatarFile = file;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // ---- Save Profile ----
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'กำลังบันทึก...';

        try {
            let avatarUrlToSave = avatarPreview.src;

            // 1. Upload Avatar if a new file is selected
            if (selectedAvatarFile) {
                const fileExt = selectedAvatarFile.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabaseClient.storage
                    .from('avatars')
                    .upload(fileName, selectedAvatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: publicUrlData } = supabaseClient.storage
                    .from('avatars')
                    .getPublicUrl(fileName);
                
                avatarUrlToSave = publicUrlData.publicUrl;
            }

            // 2. Update Profile Table
            const updates = {
                id: currentUser.id,
                full_name: fullNameInput.value,
                username: usernameInput.value,
                bio: bioInput.value,
                github_url: githubInput.value,
                linkedin_url: linkedinInput.value,
                avatar_url: avatarUrlToSave,
                updated_at: new Date()
            };

            const { error: updateError } = await supabaseClient
                .from('profiles')
                .upsert(updates);

            if (updateError) throw updateError;

            showAlert(profileAlert, 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!', 'success');
            
            // Re-fetch to update navbar avatar from auth.js if necessary
            // Or just reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            showAlert(profileAlert, 'เกิดข้อผิดพลาด: ' + error.message, 'error');
            console.error(error);
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'บันทึกข้อมูล';
            selectedAvatarFile = null;
        }
    });

    // ---- Save Password ----
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;

        if (newPass !== confirmPass) {
            showAlert(passwordAlert, 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
            return;
        }

        savePasswordBtn.disabled = true;
        savePasswordBtn.textContent = 'กำลังอัปเดต...';

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPass
            });

            if (error) throw error;

            showAlert(passwordAlert, 'อัปเดตรหัสผ่านใหม่สำเร็จ!', 'success');
            passwordForm.reset();
        } catch (error) {
            showAlert(passwordAlert, 'เกิดข้อผิดพลาด: ' + error.message, 'error');
        } finally {
            savePasswordBtn.disabled = false;
            savePasswordBtn.textContent = 'อัปเดตรหัสผ่าน';
        }
    });

    // Initial Load
    loadUserData();
});
