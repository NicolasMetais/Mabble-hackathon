import { useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import "./App.css";

const actualAppId = import.meta.env.VITE_CIRCLE_APP_ID || "00000000-0000-0000-0000-000000000000";
const API_URL = "http://localhost:4001";

type LoginResult = {
    userToken: string;
    encryptionKey: string;
};

type Wallet = {
    id: string;
    address: string;
    blockchain: string;
    [key: string]: unknown;
};

type Scenario = "create" | "reconnect" | null;
type Tab = "connect" | "pay" | "release" | "withdraw";

export default function App() {
    const sdkRef = useRef<W3SSdk | null>(null);

    // SDK and Device State
    const [sdkReady, setSdkReady] = useState(false);
    const [deviceId, setDeviceId] = useState<string>("");
    const [deviceIdLoading, setDeviceIdLoading] = useState(false);

    // Auth State
    const [email, setEmail] = useState<string>("");
    const [scenario, setScenario] = useState<Scenario>(null);
    const [deviceToken, setDeviceToken] = useState<string>("");
    const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);

    // User Data State
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null);

    // UI state
    const [activeTab, setActiveTab] = useState<Tab>("connect");
    const [status, setStatus] = useState<string>("Choisissez un scénario pour commencer.");
    const [isError, setIsError] = useState<boolean>(false);

    // Payment Form State
    const [payTo, setPayTo] = useState("");
    const [payUSDC, setPayUSDC] = useState("");
    const [payMBBL, setPayMBBL] = useState("");

    // Escrow Form State
    const [releasePaymentId, setReleasePaymentId] = useState("");
    const [withdrawPaymentId, setWithdrawPaymentId] = useState("");
    const [withdrawWalletId, setWithdrawWalletId] = useState("");

    // ─── SDK init ───
    useEffect(() => {
        const initSdk = async () => {
            try {
                const onLoginComplete = (error: unknown, result: any) => {
                    console.log(">>> onLoginComplete FIRED <<<", error, result);
                    if (error || !result) {
                        const err = (error || {}) as any;
                        const message: string = err?.message || "Email authentication failed.";
                        setIsError(true);
                        setStatus(message);
                        setLoginResult(null);
                        return;
                    }
                    setLoginResult({
                        userToken: result.userToken,
                        encryptionKey: result.encryptionKey,
                    });
                    setIsError(false);
                    setStatus("✅ Email vérifié ! Passez à l'étape suivante.");
                };
                const sdk = new W3SSdk({ appSettings: { appId: actualAppId } }, onLoginComplete);
                sdkRef.current = sdk;
                setSdkReady(true);
                setIsError(false);
            } catch (err) {
                console.log("Failed to init SDK:", err);
                setIsError(true);
                setStatus("Failed to initialize Web SDK");
            }
        };
        void initSdk();
    }, []);

    // ─── DeviceId ───
    useEffect(() => {
        const fetchDeviceId = async () => {
            if (!sdkRef.current) return;
            try {
                const cached = window.localStorage.getItem("deviceId");
                if (cached) { setDeviceId(cached); return; }
                setDeviceIdLoading(true);
                const id = await sdkRef.current.getDeviceId();
                setDeviceId(id);
                window.localStorage.setItem("deviceId", id);
            } catch (error) {
                setIsError(true); setStatus("Failed to get deviceId");
            } finally {
                setDeviceIdLoading(false);
            }
        };
        if (sdkReady) void fetchDeviceId();
    }, [sdkReady]);

    const primaryWallet = wallets[0];

    // Helper: Execute a Circle SDK challenge seamlessly
    const callBackendAndExecuteChallenge = async (endpoint: string, payload: any, successMessage: string, onOk?: () => void) => {
        if (!loginResult || !sdkRef.current) {
            setIsError(true); setStatus("Session manquante. Reconnectez-vous."); return;
        }
        try {
            setIsError(false);
            setStatus(`Requête en cours (${endpoint})...`);
            
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            
            if (!response.ok) {
                setIsError(true); setStatus(`Erreur ${endpoint}: ${data.error || data.message || "Echec"}`);
                return;
            }

            let challengeId = "";
            if (typeof data === "string") challengeId = data;
            else if (typeof data.challengeId === "string") challengeId = data.challengeId;
            else if (typeof data.data?.challengeId === "string") challengeId = data.data.challengeId;
            else if (typeof data.challengeID?.data?.challengeId === "string") challengeId = data.challengeID.data.challengeId;
            else if (typeof data.challengeID === "string") challengeId = data.challengeID;
            else if (typeof data.data === "string") challengeId = data.data;

            if (!challengeId) {
                setIsError(true); setStatus(`Pas de challengeId retourné par ${endpoint}`); return;
            }

            setStatus(`Exécution du challenge pour ${endpoint}...`);
            
            sdkRef.current.setAuthentication({
                userToken: loginResult.userToken,
                encryptionKey: loginResult.encryptionKey,
            });

            sdkRef.current.execute(challengeId, (error) => {
                if (error) {
                    setIsError(true); setStatus(`Échec du challenge ${endpoint} : ${(error as any)?.message || "Erreur"}`);
                } else {
                    setIsError(false);
                    setStatus(successMessage);
                    if (onOk) onOk();
                    // Refresh balance
                    if (primaryWallet) loadBalance(loginResult.userToken, primaryWallet.id);
                }
            });
        } catch (err: any) {
            setIsError(true); setStatus(`Erreur : ${err.message}`);
        }
    };

    // ─── Connect/Auth logic ───
    const switchScenario = (s: Scenario) => {
        setScenario(s); setLoginResult(null); setChallengeId(null); setWallets([]);
        setBalanceDisplay(null); setDeviceToken("");
        setIsError(false);
        setStatus(s === "create" ? "Création de wallet : Entrez email + envoyez OTP." : "Reconnexion : Entrez email + envoyez OTP.");
    };

    const handleRequestOtp = async () => {
        if (!email || !deviceId) { setIsError(true); setStatus("Email ou deviceId manquant."); return; }
        setLoginResult(null); setChallengeId(null); setWallets([]); setBalanceDisplay(null);
        try {
            setIsError(false); setStatus("Envoi du code OTP...");
            const response = await fetch(`${API_URL}/ConnectWallet`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "requestEmailOTP", deviceId, email }),
            });
            const data = await response.json();
            if (!response.ok) { setIsError(true); setStatus(data.error || data.message || "Échec OTP"); return; }
            
            const payload = data.data || data;
            setDeviceToken(payload.deviceToken);
            if (sdkRef.current) {
                sdkRef.current.updateConfigs({ appSettings: { appId: actualAppId }, loginConfigs: { deviceToken: payload.deviceToken, deviceEncryptionKey: payload.encryptionKey || payload.deviceEncryptionKey, otpToken: payload.otpToken } });
            }
            setIsError(false); setStatus("📧 OTP envoyé ! Vérifiez votre mail (cliquez sur l'etape 2).");
        } catch (err) {
            setIsError(true); setStatus("Échec de l'envoi OTP.");
        }
    };

    const handleVerifyOtp = () => {
        if (!sdkRef.current || !deviceToken) { setIsError(true); setStatus("Données de session manquantes."); return; }
        setIsError(false); setStatus("Ouverture pop-up OTP...");
        sdkRef.current.verifyOtp();
    };

    const handleInitializeUser = async () => {
        if (!loginResult?.userToken) return;
        try {
            setIsError(false); setStatus("Initialisation utilisateur...");
            const response = await fetch(`${API_URL}/ConnectWallet`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "initialize", userToken: loginResult.userToken }),
            });
            const data = await response.json();
            if (!response.ok) { setIsError(true); setStatus("Échec init: " + (data.error || "")); return; }
            let challengeObj = "";
            if (typeof data === "string") challengeObj = data;
            else if (typeof data.challengeId === "string") challengeObj = data.challengeId;
            else if (typeof data.data?.challengeId === "string") challengeObj = data.data.challengeId;
            else if (typeof data.challengeID?.data?.challengeId === "string") challengeObj = data.challengeID.data.challengeId;
            else if (typeof data.challengeID === "string") challengeObj = data.challengeID;
            else if (typeof data.data === "string") challengeObj = data.data;

            if (!challengeObj) { setIsError(true); setStatus("Challenge manquant."); return; }
            setChallengeId(challengeObj);
            setIsError(false); setStatus("✅ Initialisé. Créez le wallet !");
        } catch (err: any) { setIsError(true); setStatus("Erreur init: " + err.message); }
    };

    const handleExecuteChallenge = () => {
        if (!sdkRef.current || !challengeId || !loginResult) return;
        sdkRef.current.setAuthentication({ userToken: loginResult.userToken, encryptionKey: loginResult.encryptionKey });
        setIsError(false); setStatus("Création en cours...");
        sdkRef.current.execute(challengeId, (error) => {
            if (error) { setIsError(true); setStatus("Échec challenge."); return; }
            setIsError(false); setStatus("Challenge réussi ! Chargement du wallet...");
            void (async () => {
                await new Promise((r) => setTimeout(r, 2000));
                setChallengeId(null);
                await loadWallets(loginResult.userToken, "afterCreate");
            })();
        });
    };

    const handleLoadExistingWallet = async () => {
        if (!loginResult?.userToken) return;
        await loadWallets(loginResult.userToken, "reconnect");
    };

    const loadWallets = async (userToken: string, source: string) => {
        try {
            setIsError(false); setStatus("Chargement wallet...");
            const response = await fetch(`${API_URL}/getWallet`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "getWallet", userToken }),
            });
            const data = await response.json();
            if (!response.ok) { setIsError(true); setStatus("Échec load: " + data.error); return; }
            
            const rawWallets = data.wallet?.data?.wallets || data.wallet?.wallets || data.wallets || [data.wallet];
            const parsedWallets = Array.isArray(rawWallets) ? rawWallets.filter(Boolean) : [];
            setWallets(parsedWallets);

            if (parsedWallets.length > 0) {
                const wId = parsedWallets[0].id;
                await loadBalance(userToken, wId);
                
                if (source === "afterCreate") {
                    // Trigger Auto Welcome
                    setStatus("🎉 Wallet créé ! Welcome pack en cours...");
                    await triggerWelcomeFlow(parsedWallets[0].address, wId, userToken);
                } else {
                    setStatus("🔗 Reconnecté avec succès.");
                }
            } else {
                setIsError(true); setStatus("Aucun wallet trouvé.");
            }
        } catch (err) { setIsError(true); setStatus("Échec de chargement des wallets."); }
    };

    const loadBalance = async (userToken: string, walletId: string) => {
        try {
            const response = await fetch(`${API_URL}/getBalance`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "getBalance", userToken, walletId }),
            });
            const data = await response.json();
            if (!response.ok) return;
            const balanceData = data.balance?.data ?? data.balance ?? data.data ?? data;
            setBalanceDisplay(JSON.stringify(balanceData, null, 2));
        } catch (err) {}
    };

    // ─── Actions ───
    const triggerWelcomeFlow = async (address: string, id: string, token: string) => {
        callBackendAndExecuteChallenge(
            "/welcome", 
            { _userWalletAddress: address, _userWalletID: id, _userToken: token },
            "🎉 Welcome Pack Réclamé avec succès !"
        );
    };

    const handlePay = () => {
        if (!primaryWallet || !loginResult) return;
        callBackendAndExecuteChallenge(
            "/pay",
            {
                fromWalletAddress: primaryWallet.address,
                fromWalletID: primaryWallet.id,
                userToken: loginResult.userToken,
                to: payTo,
                USDCValue: payUSDC ? parseFloat(payUSDC) : 0,
                MBBLValue: payMBBL ? parseFloat(payMBBL) : 0
            },
            "💸 Paiement effectué/bloqué (Escrow) avec succès !"
        );
    };

    const handleRelease = () => {
        if (!primaryWallet || !loginResult) return;
        callBackendAndExecuteChallenge(
            "/releaseFund",
            { _userWalletID: primaryWallet.id, _userToken: loginResult.userToken, _paymentId: releasePaymentId },
            "🔓 Fonds libérés avec succès !"
        );
    };

    const handleWithdraw = () => {
        if (!primaryWallet || !loginResult) return;
        callBackendAndExecuteChallenge(
            "/withdraw",
            { _userWalletID: withdrawWalletId || primaryWallet.id, _userToken: loginResult.userToken, _paymentId: withdrawPaymentId },
            "💶 Fonds retirés avec succès !"
        );
    };

    // Render Form parts depending on tab
    const renderActiveTab = () => {
        if (!primaryWallet) {
            // Not connected yet, enforce connect tab view.
            return (
                <div className="glass-panel" style={{ textAlign: "center" }}>
                    <h2>Connectez-vous à votre Wallet !</h2>
                    <p style={{marginTop: "10px", color: "var(--text-secondary)"}}>Veuillez finaliser l'étape dans l'onglet Connecter.</p>
                </div>
            );
        }

        switch (activeTab) {
            case "pay":
                return (
                    <div className="glass-panel">
                        <h2>Initier un Paiement (Escrow)</h2>
                        <div className="form-group">
                            <label>Adresse du destinataire (to)</label>
                            <input className="input-field" value={payTo} onChange={e=>setPayTo(e.target.value)} placeholder="0x..." />
                        </div>
                        <div className="two-col">
                            <div className="form-group">
                                <label>Montant en USDC</label>
                                <input type="number" className="input-field" value={payUSDC} onChange={e=>setPayUSDC(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="form-group">
                                <label>Montant en MBBL</label>
                                <input type="number" className="input-field" value={payMBBL} onChange={e=>setPayMBBL(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                        <button className="action-btn" onClick={handlePay} disabled={!payTo || (!payUSDC && !payMBBL)}>Procéder au Paiement</button>
                    </div>
                );
            case "release":
                return (
                    <div className="glass-panel">
                        <h2>Libérer un Paiement (Release)</h2>
                        <p style={{marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem"}}>Autorise le déblocage des fonds d'un paiement en cours pour le destinataire.</p>
                        <div className="form-group">
                            <label>ID du Paiement</label>
                            <input className="input-field" value={releasePaymentId} onChange={e=>setReleasePaymentId(e.target.value)} placeholder="Ex: 42" />
                        </div>
                        <button className="action-btn" onClick={handleRelease} disabled={!releasePaymentId}>Release Fonds</button>
                    </div>
                );
            case "withdraw":
                return (
                    <div className="glass-panel">
                        <h2>Récupérer un Paiement (Withdraw)</h2>
                        <p style={{marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem"}}>Retire les fonds sur votre adresse depuis un paiement libéré.</p>
                        
                        <div className="form-group">
                            <label>ID personnel du Wallet Receveur (Optionnel)</label>
                            <input className="input-field" value={withdrawWalletId} onChange={e=>setWithdrawWalletId(e.target.value)} placeholder="Ex: laisse vide (utilise le wallet connecté)" />
                        </div>
                        <div className="form-group">
                            <label>ID du Paiement</label>
                            <input className="input-field" value={withdrawPaymentId} onChange={e=>setWithdrawPaymentId(e.target.value)} placeholder="Ex: 42" />
                        </div>
                        <button className="action-btn" onClick={handleWithdraw} disabled={!withdrawPaymentId}>Withdraw Fonds</button>
                    </div>
                );
            default:
                return (
                    <div className="glass-panel">
                        <h2>Vue d'ensemble</h2>
                        <p>Wallet détecté. Choisissez une action depuis le menu.</p>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            <header className="header">
                <h1>Mabble Escrow Test</h1>
            </header>

            <div className={`status-message ${isError ? "error" : "success"}`}>
                {status}
            </div>

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}>
                    Connexion
                </button>
                <button className={`tab-btn ${activeTab === 'pay' ? 'active' : ''}`} onClick={() => setActiveTab('pay')} disabled={!primaryWallet}>
                    Paiement (Pay)
                </button>
                <button className={`tab-btn ${activeTab === 'release' ? 'active' : ''}`} onClick={() => setActiveTab('release')} disabled={!primaryWallet}>
                    Libération (Release)
                </button>
                <button className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`} onClick={() => setActiveTab('withdraw')} disabled={!primaryWallet}>
                    Retrait (Withdraw)
                </button>
            </div>

            {activeTab === 'connect' && (
                <div className="glass-panel" style={{marginBottom: "2rem"}}>
                    <h2>Connexion Circle</h2>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "20px", marginTop: "15px" }}>
                        <button onClick={() => switchScenario("create")} className={`action-btn ${scenario === "create" ? "" : "secondary"}`}>Nouveau Wallet</button>
                        <button onClick={() => switchScenario("reconnect")} className={`action-btn ${scenario === "reconnect" ? "" : "secondary"}`}>Wallet Existant</button>
                    </div>

                    {scenario && (
                        <div style={{display: "flex", flexDirection: "column", gap: "15px"}}>
                            <div className="form-group">
                                <label>Adresse Email</label>
                                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                            </div>

                            <button className="tab-btn" onClick={handleRequestOtp} disabled={!sdkReady || !deviceId || deviceIdLoading || !email}>
                                1. Demander OTP
                            </button>
                            <button className="tab-btn" onClick={handleVerifyOtp} disabled={!deviceToken || !!loginResult}>
                                2. Vérifier OTP
                            </button>

                            {scenario === "create" && (
                                <>
                                    <button className="tab-btn" onClick={handleInitializeUser} disabled={!loginResult || !!challengeId || wallets.length > 0}>
                                        3. Initialiser ('Initialize')
                                    </button>
                                    <button className="tab-btn" onClick={handleExecuteChallenge} disabled={!challengeId || wallets.length > 0}>
                                        4. Créer & Welcome ('Execute')
                                    </button>
                                </>
                            )}
                            {scenario === "reconnect" && (
                                <button className="tab-btn" onClick={handleLoadExistingWallet} disabled={!loginResult || wallets.length > 0}>
                                    3. Charger le Wallet
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab !== 'connect' && renderActiveTab()}

            {primaryWallet && (
                <div className="glass-panel" style={{marginTop: "0"}}>
                    <h2>Détails du Wallet</h2>
                    <div className="wallet-card">
                        <div className="wallet-detail-item">
                            <span className="label">Addresse</span>
                            <span className="value">{primaryWallet.address}</span>
                        </div>
                        <div className="two-col">
                            <div className="wallet-detail-item">
                                <span className="label">Wallet ID</span>
                                <span className="value">{primaryWallet.id}</span>
                            </div>
                            <div className="wallet-detail-item">
                                <span className="label">Blockchain</span>
                                <span className="value">{primaryWallet.blockchain}</span>
                            </div>
                        </div>
                        {balanceDisplay && (
                            <div className="wallet-detail-item">
                                <span className="label">Balances Raw</span>
                                <pre className="value" style={{maxHeight: '150px', overflowY: 'auto', margin: 0}}>{balanceDisplay}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
