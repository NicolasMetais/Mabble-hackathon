import React, { useEffect, useRef, useState } from "react";
import FooterApplyPage from "../FooterApplyPage.jsx";
import Header from "../Header.jsx";
// import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk"
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

// const sdk = new W3SSdk({ appSettings: { appId: import.meta.env.NEXT_PUBLIC_CIRCLE_APP_ID } });

let sdkInstance = null;
function getSDK() {
  if(!sdkInstance) {
    sdkInstance = new W3SSdk({
      appSettings: { appId: import.meta.env.VITE_CIRCLE_APP_ID}
    });
  }
  return sdkInstance;
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const sdk = getSDK();

    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {"Content-type" : "application/json" },
        body: JSON.stringify({ email, password, deviceId: await sdk.getDeviceId() })
      })
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Invalid ids");
      Cookies.set("authToken", data.token , { expires: 5 / 24, sameSite: "Strict" });

      if (data.message === "Not accepted user") {
        navigate("/LandingPage");
        return;
      }

      sdk.setAuthentication({
        userToken:     data.deviceToken,
        encryptionKey: data.deviceEncryption,
      });

      sdk.verifyOtp({
        otpToken: data.otpToken,
        deviceToken: data.deviceToken,
        encryptionKey: data.deviceEncryption,
    }, async (err, result) => {
      if (err) {
            setError("Invalid code : " + err.message);
            setLoading(false);
            return ;
      }
      const { userToken, encryptionKey } = result;

      try {
        console.log("1");
        const res = await fetch("http://localhost:4000/initializeWallet", {
          method: "POST",
          headers: {
            "Content-type" : "application/json",
            "Authorization" : `Bearer ${Cookies.get("authToken")}`,
           },
          body: JSON.stringify({ userToken }),
        });
        console.log("2");
        const data = await res.json();
        console.log("3");
        if (!res.ok)
          throw new Error("Wallet init failed");
        console.log("4");
        sdk.setAuthentication({ userToken, encryptionKey});
        console.log("5");
        sdk.execute(data.challengeId, (err2, result2) => {
          if (err2) {
            setError("Error Wallet setup: " + err2.message);
            return ;
          }
          navigate("/");
        });
      } catch (e) {
        setError(e.message);
      }
    });

    } catch (e) {
      setError(e.message);
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

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={styles.button}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p style={styles.signupText}>
          Don't have an account?{" "}
          <Link to="/create-account" style={styles.link}>Sign up</Link>
        </p>
      </div>

      <div style={styles.footer}>
        <h2 style={styles.footerBigText}>Welcome to Mabble</h2>
        <p style={styles.footerText}>
          A network of creatives collaborating and growing together.
          <br />Skills are the new currency.
        </p>
      </div>
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