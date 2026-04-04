import { useState } from "react";

const CreateAccount = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const s = {
    page: {
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      width: "100%",
      minHeight: "100vh",
      background: "#f5f5f5",
      color: "#1a1a1a",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      width: "100%",
      maxWidth: 520,
      margin: "48px 24px",
      padding: "44px 40px 48px 40px",
      background: "#ffffff",
      borderRadius: 18,
      border: "1.5px solid #e5e7eb",
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    },

    /* ── Header ── */
    heading: {
      fontSize: 32,
      fontWeight: 800,
      margin: "0 0 6px 0",
      letterSpacing: -0.5,
      color: "#1a1a1a",
    },
    subtitle: {
      fontSize: 15,
      color: "#666666",
      margin: "0 0 36px 0",
      fontWeight: 400,
      lineHeight: 1.5,
    },

    /* ── Row (two fields side by side) ── */
    row: {
      display: "flex",
      gap: 15,
      marginBottom: 0,
    },

    /* ── Field ── */
    fieldWrapper: {
      display: "flex",
      flexDirection: "column",
      marginBottom: 20,
      flex: 1,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: "#444444",
      marginBottom: 7,
      letterSpacing: 0.1,
    },
    inputWrapper: {
      display: "flex",
      alignItems: "center",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      background: "#fafafa",
      padding: "0 14px",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    },
    inputWrapperFocused: {
      borderColor: "#6366f1",
      boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
      background: "#ffffff",
    },
    inputIcon: {
      width: 18,
      height: 18,
      color: "#999999",
      flexShrink: 0,
      marginRight: 10,
    },
    input: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: 14,
      padding: "13px 0",
      background: "transparent",
      color: "#1a1a1a",
      fontFamily: "inherit",
    },
    eyeBtn: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      color: "#999999",
    },

    /* ── Submit ── */
    submitBtn: {
      width: "100%",
      padding: "14px 0",
      border: "none",
      borderRadius: 10,
      background: "#1a1a1a",
      color: "#ffffff",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      marginTop: 8,
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      letterSpacing: 0.2,
    },
    submitBtnHover: {
      background: "#333333",
    },

    /* ── Divider ── */
    dividerRow: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "24px 0",
    },
    dividerLine: {
      flex: 1,
      height: 1,
      background: "#e5e7eb",
    },
    dividerText: {
      fontSize: 12,
      color: "#aaaaaa",
      fontWeight: 500,
    },

    /* ── Social buttons ── */
    socialRow: {
      display: "flex",
      gap: 12,
    },
    socialBtn: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "12px 0",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      background: "#ffffff",
      fontSize: 13,
      fontWeight: 600,
      color: "#1a1a1a",
      cursor: "pointer",
      transition: "all 0.15s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    },
    socialBtnHover: {
      background: "#f0f0f0",
      borderColor: "#b0b0b0",
    },

    /* ── Footer link ── */
    footer: {
      textAlign: "center",
      marginTop: 28,
      fontSize: 13,
      color: "#888888",
    },
    footerLink: {
      color: "#6366f1",
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer",
      marginLeft: 4,
    },
  };

  /* ── Icons ── */
  const UserIcon = () => (
    <svg style={s.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
  const CalendarIcon = () => (
    <svg style={s.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
  const MailIcon = () => (
    <svg style={s.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
  const LockIcon = () => (
    <svg style={s.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
  const EyeIcon = ({ off }) =>
    off ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
  const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );

  const onSubmit = async () => {
      const {email, password, firstName, lastName } = form;
      console.log(form.email);
      try {
        const res = await fetch("http://localhost:4000/signup", {
          method: "POST",
          headers: {
            "Content-type": "application/json"
            // "Authorization": `Bearer ${TOKEN}`
          },
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName
          })
        });
        if (!res.ok) {
          const err = await res.json();
          console.log(err);
          return;
        }

        const data = await res.json();
        console.log("Account created: ", data);
      } catch (err) {
        console.log(err);
      }
    };

  const renderField = (field, label, icon, type = "text", placeholder = "") => {
    const isPassword = field === "password" || field === "confirmPassword";
    const isVisible = field === "password" ? showPassword : showConfirm;
    const toggleVisible = () =>
      field === "password"
        ? setShowPassword((p) => !p)
        : setShowConfirm((p) => !p);
    const isFocused = focusedField === field;

    return (
      <div style={s.fieldWrapper}>
        <label style={s.label}>{label}</label>
        <div style={{ ...s.inputWrapper, ...(isFocused ? s.inputWrapperFocused : {}) }}>
          {icon}
          <input
            style={s.input}
            type={isPassword ? (isVisible ? "text" : "password") : type}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
          />
          {isPassword && (
            <button style={s.eyeBtn} onClick={toggleVisible} type="button">
              <EyeIcon off={!isVisible} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <h1 style={s.heading}>Create Account</h1>
        <p style={s.subtitle}>Join the community and start collaborating with creatives</p>

        {/* Name rows */}
          {renderField("firstName", "First name", <UserIcon />, "text", "John")}
          {renderField("lastName", "Last name", <UserIcon />, "text", "Doe")}


        {/* Date of birth */}
        {renderField("birthDate", "Date of birth", <CalendarIcon />, "date", "")}

        {/* Email */}
        {renderField("email", "Email address", <MailIcon />, "email", "john@example.com")}

        {/* Password */}
        {renderField("password", "Password", <LockIcon />, "password", "Min. 8 characters")}

        {/* Confirm password */}
        {renderField("confirmPassword", "Confirm password", <LockIcon />, "password", "Re-enter your password")}

        {/* Submit */}
        <button
          style={{ ...s.submitBtn, ...(hoveredBtn === "submit" ? s.submitBtnHover : {}) }}
          onMouseEnter={() => setHoveredBtn("submit")}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={onSubmit}
        >
          Create my account
        </button>

        {/* Divider */}
        <div style={s.dividerRow}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>OR</span>
          <div style={s.dividerLine} />
        </div>

        {/* Social */}
        <div style={s.socialRow}>
          <button
            style={{ ...s.socialBtn, ...(hoveredBtn === "google" ? s.socialBtnHover : {}) }}
            onMouseEnter={() => setHoveredBtn("google")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <GoogleIcon />
            Google
          </button>
          <button
            style={{ ...s.socialBtn, ...(hoveredBtn === "apple" ? s.socialBtnHover : {}) }}
            onMouseEnter={() => setHoveredBtn("apple")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <AppleIcon />
            Apple
          </button>
        </div>

        {/* Footer */}
        <p style={s.footer}>
          Already have an account?
          <span style={s.footerLink}>Sign in</span>
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;
