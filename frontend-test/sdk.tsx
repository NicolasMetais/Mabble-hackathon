// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
// Importation du SDK Web de Circle pour les Programmable Wallets
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

// L'App ID fourni par la console développeur de Circle
const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

// Types TypeScript pour typer nos variables d'état
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

export default function HomePage() {
  // Référence persistante au SDK Circle pour pouvoir l'appeler dans nos fonctions
  const sdkRef = useRef<W3SSdk | null>(null);

  // --- ÉTATS GLOBAUX ET APPAREIL ---
  const [sdkReady, setSdkReady] = useState(false); // Indique si le SDK est instancié
  const [deviceId, setDeviceId] = useState<string>(""); // Identifiant unique de l'appareil
  const [deviceIdLoading, setDeviceIdLoading] = useState(false); // État de chargement du deviceId

  // --- ÉTATS UTILISATEUR ---
  const [email, setEmail] = useState<string>(""); // L'email saisi par l'utilisateur

  // --- ÉTATS DE SESSION OTP ---
  const [deviceToken, setDeviceToken] = useState<string>(""); // Token de l'appareil (généré par le backend)
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string>(""); // Clé de chiffrement (générée par le backend)
  const [otpToken, setOtpToken] = useState<string>(""); // Token de la session OTP en cours

  // --- ÉTATS POST-AUTHENTIFICATION ---
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null); // Contient le userToken et l'encryptionKey après un OTP réussi

  // --- ÉTATS WALLET ET CHALLENGE ---
  const [challengeId, setChallengeId] = useState<string | null>(null); // ID du challenge pour la création du PIN/Wallet
  const [wallets, setWallets] = useState<Wallet[]>([]); // Liste des wallets de l'utilisateur
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null); // Solde en USDC du portefeuille principal

  // --- ÉTATS DE L'INTERFACE (UI) ---
  const [status, setStatus] = useState<string>("Ready"); // Message d'information pour l'utilisateur
  const [isError, setIsError] = useState<boolean>(false); // Détermine si le message de statut est une erreur (rouge)

  // ==========================================
  // 1. INITIALISATION DU SDK CIRCLE
  // ==========================================
  useEffect(() => {
    let cancelled = false; // Permet d'éviter les fuites de mémoire si le composant est démonté

    const initSdk = async () => {
      try {
        // Callback déclenché automatiquement par le SDK après la vérification réussie (ou échouée) de l'OTP
        const onLoginComplete = (error: unknown, result: any) => {
          if (cancelled) return;

          if (error || !result) {
            // Gestion des erreurs lors de la saisie de l'OTP
            const err = (error || {}) as any;
            const message: string =
              err?.message || "Email authentication failed.";

            console.log("Email auth failed:", {
              code: err?.code,
              message,
            });

            setIsError(true);
            setStatus(message);
            setLoginResult(null);
            return;
          }

          // Succès : L'utilisateur a entré le bon code reçu par email.
          // Circle nous donne le userToken et la clé de chiffrement nécessaires pour la suite.
          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setIsError(false);
          setStatus("Email verified. Click Initialize user to continue");
        };

        // Instanciation du SDK Web
        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          onLoginComplete,
        );

        sdkRef.current = sdk; // Sauvegarde dans la référence

        if (!cancelled) {
          setSdkReady(true);
          setIsError(false);
          setStatus("SDK initialized. Ready to request OTP.");
        }
      } catch (err) {
        console.log("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setIsError(true);
          setStatus("Failed to initialize Web SDK");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true; // Nettoyage lors du démontage
    };
  }, []);

  // ==========================================
  // 2. RÉCUPÉRATION DU DEVICE ID
  // ==========================================
  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;

      try {
        // On vérifie d'abord si on a déjà un deviceId sauvegardé localement
        const cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem("deviceId")
            : null;

        if (cached) {
          setDeviceId(cached);
          return;
        }

        // Sinon, on demande au SDK d'en générer un nouveau
        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);

        // Et on le sauvegarde pour les prochaines visites
        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
      } catch (error) {
        console.log("Failed to get deviceId:", error);
        setIsError(true);
        setStatus("Failed to get deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId(); // On lance la récupération uniquement quand le SDK est prêt
    }
  }, [sdkReady]);

  // ==========================================
  // FONCTIONS UTILITAIRES (APPELS BACKEND)
  // ==========================================

  // Fonction pour charger le solde USDC d'un portefeuille précis
  async function loadUsdcBalance(userToken: string, walletId: string) {
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTokenBalance",
          userToken,
          walletId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to load USDC balance:", data);
        setIsError(true);
        setStatus("Failed to load USDC balance");
        return null;
      }

      const balances = (data.tokenBalances as any[]) || [];

      // On cherche spécifiquement le token USDC dans la liste des soldes retournés
      const usdcEntry =
        balances.find((t) => {
          const symbol = t.token?.symbol || "";
          const name = t.token?.name || "";
          return symbol.startsWith("USDC") || name.includes("USDC");
        }) ?? null;

      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      
      setIsError(false);
      setStatus("Wallet details and USDC balance loaded.");
      return amount;
    } catch (err) {
      console.log("Failed to load USDC balance:", err);
      setIsError(true);
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  // Fonction pour charger la liste des portefeuilles de l'utilisateur
  const loadWallets = async (
    userToken: string,
    options?: { source?: "afterCreate" | "alreadyInitialized" },
  ) => {
    try {
      setIsError(false);
      setStatus("Loading wallet details...");
      setUsdcBalance(null);

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listWallets",
          userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("List wallets failed:", data);
        setIsError(true);
        setStatus("Failed to load wallet details");
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);

      // Si l'utilisateur possède au moins un wallet, on charge le solde du premier
      if (wallets.length > 0) {
        await loadUsdcBalance(userToken, wallets[0].id);

        // Affichage d'un message de statut adapté selon le contexte
        if (options?.source === "afterCreate") {
          setIsError(false);
          setStatus(
            "Wallet created successfully! 🎉 Wallet details and USDC balance loaded.",
          );
        } else if (options?.source === "alreadyInitialized") {
          setIsError(false);
          setStatus(
            "User already initialized. Wallet details and USDC balance loaded.",
          );
        }
      } else {
        setIsError(false);
        setStatus("Wallet creation in progress. Click Initialize user again to refresh.");
      }
    } catch (err) {
      console.log("Failed to load wallet details:", err);
      setIsError(true);
      setStatus("Failed to load wallet details");
    }
  };

  // ==========================================
  // ÉTAPE 1 : DEMANDER LE CODE OTP PAR EMAIL
  // ==========================================
  const handleRequestOtp = async () => {
    if (!email) {
      setIsError(true);
      setStatus("Please enter an email address.");
      return;
    }

    if (!deviceId) {
      setIsError(true);
      setStatus("Missing deviceId. Try again.");
      return;
    }

    // Réinitialisation des états avant une nouvelle tentative
    setLoginResult(null);
    setChallengeId(null);
    setWallets([]);
    setUsdcBalance(null);

    try {
      setIsError(false);
      setStatus("Requesting OTP...");

      // Appel au backend pour générer l'OTP via l'API Circle
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requestEmailOtp",
          deviceId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to request OTP:", data);
        setIsError(true);
        setStatus(data.error || data.message || "Failed to request OTP");
        return;
      }

      // Sauvegarde des tokens de session renvoyés par notre backend
      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setOtpToken(data.otpToken);

      // Injection de ces tokens dans le SDK pour qu'il puisse vérifier le code plus tard
      const sdk = sdkRef.current;
      if (sdk) {
        sdk.updateConfigs({
          appSettings: { appId },
          loginConfigs: {
            deviceToken: data.deviceToken,
            deviceEncryptionKey: data.deviceEncryptionKey,
            otpToken: data.otpToken,
            email: { email },
          },
        });
      }

      setIsError(false);
      setStatus(
        "OTP sent! Check your Mailtrap sandbox inbox, then click Verify email OTP.",
      );
    } catch (err) {
      console.log("Error requesting OTP:", err);
      setIsError(true);
      setStatus("Failed to request OTP");
    }
  };

  // ==========================================
  // ÉTAPE 2 : VÉRIFIER L'OTP (Ouverture UI Circle)
  // ==========================================
  const handleVerifyOtp = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!deviceToken || !deviceEncryptionKey || !otpToken) {
      setIsError(true);
      setStatus("Missing OTP session data. Request a new code.");
      return;
    }

    setIsError(false);
    setStatus("Opening OTP verification window...");

    // Ouvre la fenêtre (iframe/modale) hébergée par Circle pour taper le code reçu par mail.
    // Une fois terminé avec succès, le callback "onLoginComplete" (défini au début) s'exécutera.
    sdk.verifyOtp();
  };

  // ==========================================
  // ÉTAPE 3 : INITIALISER L'UTILISATEUR (Obtenir Challenge)
  // ==========================================
  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setIsError(true);
      setStatus("Missing userToken. Please verify your email first.");
      return;
    }

    try {
      setIsError(false);
      setStatus("Initializing user...");

      // Demande au backend de créer un challenge d'initialisation sur l'API Circle
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: loginResult.userToken,
        }),
      });

      const data = await response.json();

      // Gestion spécifique si l'utilisateur possède DÉJÀ un wallet (erreur 155106)
      if (!response.ok) {
        if (data.code === 155106) {
          // L'utilisateur est déjà initialisé, on charge directement ses portefeuilles existants
          await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          setChallengeId(null);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        setIsError(true);
        setStatus("Failed to initialize user: " + errorMsg);
        return;
      }

      // Si l'utilisateur est nouveau, on sauvegarde le challengeId reçu pour l'étape suivante
      setChallengeId(data.challengeId);
      setIsError(false);
      setStatus(`User initialized. Click Create wallet to continue.`);
    } catch (err: any) {
      // Même logique de rattrapage en cas d'exception avec le code 155106
      if (err?.code === 155106 && loginResult?.userToken) {
        await loadWallets(loginResult.userToken, {
          source: "alreadyInitialized",
        });
        setChallengeId(null);
        return;
      }

      const errorMsg = err?.code
        ? `[${err.code}] ${err.message}`
        : err?.message || "Unknown error";
      setIsError(true);
      setStatus("Failed to initialize user: " + errorMsg);
    }
  };

  // ==========================================
  // ÉTAPE 4 : EXÉCUTER LE CHALLENGE (Création PIN & Wallet)
  // ==========================================
  const handleExecuteChallenge = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!challengeId) {
      setIsError(true);
      setStatus("Missing challengeId. Initialize user first.");
      return;
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setIsError(true);
      setStatus("Missing login credentials. Please verify your email again.");
      return;
    }

    // On configure le SDK avec l'identité vérifiée de l'utilisateur
    sdk.setAuthentication({
      userToken: loginResult.userToken,
      encryptionKey: loginResult.encryptionKey,
    });

    setIsError(false);
    setStatus("Executing challenge...");

    // Ouvre la modale Circle pour définir le code PIN et les questions de sécurité
    sdk.execute(challengeId, (error) => {
      const err = (error || {}) as any;

      if (error) {
        console.log("Execute challenge failed:", err);
        setIsError(true);
        setStatus("Failed to execute challenge: " + (err?.message ?? "Unknown error"));
        return;
      }

      setIsError(false);
      setStatus("Challenge executed. Loading wallet details...");

      // Si l'exécution réussit, la blockchain crée le wallet. 
      // On attend 2 secondes pour laisser le temps à Circle de l'indexer avant de l'afficher.
      void (async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setChallengeId(null);
        await loadWallets(loginResult.userToken, { source: "afterCreate" });
      })().catch((e) => {
        console.log("Post-execute loadWallets failed:", e);
        setIsError(true);
        setStatus("Wallet created, but failed to load wallet details.");
      });
    });
  };

  // Raccourci pour afficher le premier wallet s'il y en a un
  const primaryWallet = wallets[0];

  // ==========================================
  // RENDU DE L'INTERFACE UTILISATEUR (JSX)
  // ==========================================
  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Create a user wallet with email OTP</h1>
        <p>Enter the email of the user you want to create a wallet for:</p>

        {/* --- CHAMP DE SAISIE DE L'EMAIL --- */}
        <div style={{ marginBottom: "12px" }}>
          <label>
            Email address:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: "8px", width: "70%" }}
              placeholder="you@example.com"
            />
          </label>
        </div>

        {/* --- BOUTONS D'ACTION (Les 4 étapes) --- */}
        <div>
          {/* Étape 1 : Désactivé si SDK non prêt, pas de deviceId ou pas d'email */}
          <button
            onClick={handleRequestOtp}
            style={{ margin: "6px" }}
            disabled={!sdkReady || !deviceId || deviceIdLoading || !email}
          >
            1. Send email OTP
          </button>
          <br />

          {/* Étape 2 : Désactivé si les tokens OTP manquent ou si l'utilisateur est déjà logué */}
          <button
            onClick={handleVerifyOtp}
            style={{ margin: "6px" }}
            disabled={
              !sdkReady || !deviceToken || !deviceEncryptionKey || !otpToken || !!loginResult
            }
          >
            2. Verify email OTP
          </button>
          <br />

          {/* Étape 3 : Désactivé si pas de userToken, ou si challenge déjà en cours, ou si wallet déjà chargé */}
          <button
            onClick={handleInitializeUser}
            style={{ margin: "6px" }}
            disabled={!loginResult || !!challengeId || wallets.length > 0}
          >
            3. Initialize user (get challenge)
          </button>
          <br />

          {/* Étape 4 : Désactivé s'il n'y a pas de challengeId ou si un wallet existe déjà */}
          <button
            onClick={handleExecuteChallenge}
            style={{ margin: "6px" }}
            disabled={!challengeId || wallets.length > 0}
          >
            4. Create wallet (execute challenge)
          </button>
        </div>

        {/* --- AFFICHAGE DU STATUT DES ACTIONS --- */}
        <p>
          <strong>Status:</strong>{" "}
          <span style={{ color: isError ? "red" : "black" }}>{status}</span>
        </p>

        {/* --- AFFICHAGE DU WALLET (si créé et récupéré) --- */}
        {primaryWallet && (
          <div style={{ marginTop: "12px" }}>
            <h2>Wallet details</h2>
            <p>
              <strong>Address:</strong> {primaryWallet.address}
            </p>
            <p>
              <strong>Blockchain:</strong> {primaryWallet.blockchain}
            </p>
            {usdcBalance !== null && (
              <p>
                <strong>USDC balance:</strong> {usdcBalance}
              </p>
            )}
          </div>
        )}

        {/* --- ZONE DE DÉBOGAGE : Affiche l'état global de l'application en JSON --- */}
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: "1.8",
            marginTop: "16px",
          }}
        >
          {JSON.stringify(
            {
              deviceId,
              email,
              deviceToken,
              deviceEncryptionKey,
              otpToken,
              userToken: loginResult?.userToken,
              encryptionKey: loginResult?.encryptionKey,
              challengeId,
              wallets,
              usdcBalance,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}