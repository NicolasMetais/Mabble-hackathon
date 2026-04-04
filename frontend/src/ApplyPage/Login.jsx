import React, { useEffect, useRef, useState } from "react";
import FooterApplyPage from "../FooterApplyPage.jsx";
import Header from "../Header.jsx";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk"
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

let sdkInstance = null;
function getSDK(onLoginComplete) {
  if(!sdkInstance) {
    sdkInstance = new W3SSdk({
      appSettings: { appId: import.meta.env.VITE_CIRCLE_APP_ID}
    }, onLoginComplete);
  }
  return sdkInstance;
}

export default function Login() {
  const navigate = useNavigate();
  const sdkRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState("idle"); // idle, sent, verifying, success
  const [deviceToken, setDeviceToken] = useState(null);
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState(null);
  const [otpToken, setOtpToken] = useState(null);

  // Initialize SDK with onLoginComplete callback
  useEffect(() => {
    const onLoginComplete = (error, result) => {
      console.log("🔐 onLoginComplete callback - error:", error, "result:", result);

      if (error) {
        console.error("❌ OTP verification error:", error);
        setError("OTP verification failed: " + (error.message || "Unknown error"));
        setOtpStep("sent"); // Go back to being able to retry
        return;
      }

      console.log("✅ OTP verified, got userToken");
      const { userToken, encryptionKey } = result;

      // Now initialize wallet
      console.log("🔄 Initializing wallet...");
      fetch("http://localhost:4000/initializeWallet", {
        method: "POST",
        headers: {
          "Content-type" : "application/json",
          "Authorization" : `Bearer ${Cookies.get("authToken")}`,
        },
        body: JSON.stringify({ userToken }),
      })
        .then(res => res.json())
        .then(walletData => {
          console.log("📊 Wallet response:", walletData);
          if (!walletData.challengeId) {
            throw new Error("No challengeId in wallet response");
          }
          console.log("✅ Wallet initialized successfully");
          setOtpStep("success");
          navigate("/");
        })
        .catch(e => {
          console.error("❌ Wallet initialization error:", e);
          setError("Wallet error: " + e.message);
          setOtpStep("sent");
        });
    };

    const sdk = getSDK(onLoginComplete);
    sdkRef.current = sdk;
  }, []);

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    const sdk = sdkRef.current;

    try {
      const deviceId = await sdk.getDeviceId();
      console.log("✅ Device ID:", deviceId);

      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {"Content-type" : "application/json" },
        body: JSON.stringify({ email, password, deviceId })
      })
      const data = await res.json();
      console.log("📡 Login response:", data);
      console.log("🔐 Tokens received:", {
        deviceToken: data.deviceToken?.substring(0, 20),
        deviceEncryptionKey: data.deviceEncryptionKey?.substring(0, 20),
        otpToken: data.otpToken?.substring(0, 20),
      });

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      if (data.message === "Not accepted user") {
        console.log("ℹ️  Not accepted user, redirecting to home");
        Cookies.set("authToken", data.token , { expires: 5 / 24, sameSite: "Strict" });
        navigate("/");
        return;
      }

      Cookies.set("authToken", data.token , { expires: 5 / 24, sameSite: "Strict" });

      // Store the tokens for the verify step
      console.log("💾 Storing tokens in state...");
      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setOtpToken(data.otpToken);
      setOtpStep("sent");

      console.log("✅ OTP sent to email");
    } catch (e) {
      console.error("❌ Login error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const sdk = sdkRef.current;

    console.log("🔍 handleVerifyOtp called, checking tokens:", {
      deviceToken: deviceToken?.substring(0, 20),
      deviceEncryptionKey: deviceEncryptionKey?.substring(0, 20),
      otpToken: otpToken?.substring(0, 20),
    });

    if (!deviceToken || !deviceEncryptionKey || !otpToken) {
      setError("Missing OTP data. Send OTP first.");
      console.error("❌ Missing tokens!", { deviceToken, deviceEncryptionKey, otpToken });
      return;
    }

    try {
      console.log("⚙️ Updating SDK configs with OTP tokens");
      sdk.updateConfigs({
        appSettings: { appId: import.meta.env.VITE_CIRCLE_APP_ID },
        loginConfigs: {
          deviceToken: deviceToken,
          deviceEncryptionKey: deviceEncryptionKey,
          otpToken: otpToken,
          email: { email },
        },
      });

      setOtpStep("verifying");
      console.log("🚀 Calling sdk.verifyOtp()");
      sdk.verifyOtp();

    } catch (e) {
      console.error("❌ Error:", e);
      setError(e.message);
      setOtpStep("sent");
    }
  };

   return (
    <div>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>START BUILDING IN SYNC</h1>

        <label style={styles.label}>• Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>• Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        {otpStep === "idle" && (
          <>
            <button
              onClick={handleSendOtp}
              disabled={loading || !email || !password}
              style={styles.button}
            >
              {loading ? "Sending..." : "Send OTP Code"}
            </button>

            <p style={styles.signupText}>
              Don't have an account?{" "}
              <Link to="/create-account" style={styles.link}>Sign up</Link>
            </p>
          </>
        )}

        {otpStep === "sent" && (
          <>
            <button
              onClick={handleVerifyOtp}
              style={styles.button}
            >
              Verify OTP Code
            </button>

            <p style={styles.signupText}>
              Check your email for the code
            </p>
          </>
        )}

        {otpStep === "verifying" && (
          <p style={styles.signupText}>Opening OTP verification...</p>
        )}

        {otpStep === "success" && (
          <p style={{...styles.signupText, color: 'green'}}>Login successful! Redirecting...</p>
        )}
      </div>

      <div style={styles.footer}>
        <h2 style={styles.footerBigText}>Welcome to Mabble</h2>
        <p style={styles.footerText}>
          A network of creatives collaborating and growing together.
          <br />Skills are the new currency.
        </p>
      </div>

      <div id="circle-iframe-container" style={{ minHeight: "600px" }} />
    </div>
    
  );
}

const styles = {
  formWrapper:   { paddingTop: "2rem", maxWidth: "35rem", margin: "0 auto", textAlign: "left" },
  title:         { fontSize: "3.5rem", marginBottom: "30px" },
  label:         { display: "block", marginBottom: "5px", fontSize: "1.5rem" },
  input: {
    width: "100%", height: "50px", padding: "12px", marginBottom: "20px",
    borderRadius: "10px", border: "1px solid #ddd", background: "#eee", boxSizing: "border-box",
  },
  button: {
    width: "100%", height: "50px", borderRadius: "10px", border: "none",
    background: "linear-gradient(90deg, #7b61ff, #ff0000)",
    color: "white", fontSize: "1rem", cursor: "pointer", marginBottom: "12px",
  },
  error:         { color: "red", marginBottom: "12px", fontSize: "0.9rem" },
  signupText:    { marginTop: "10px" },
  link:          { color: "blue", textDecoration: "none" },
  footer:        { marginTop: "7rem", textAlign: "center" },
  footerBigText: { fontSize: "3rem" },
  footerText:    { fontSize: "1.3rem" },
};