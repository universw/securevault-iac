import { createContext, useCallback, useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const AuthContext = createContext();

const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const poolData = {
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
};

const userPool =
  COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID ? new CognitoUserPool(poolData) : null;

export function AuthProvider({ children }) {
  const [idToken, setIdToken] = useState(sessionStorage.getItem("idToken") || "");
  const [email, setEmail] = useState("");
  const [authFlow, setAuthFlow] = useState("login");

  const isLoggedIn = Boolean(idToken);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    const hasMin8 = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};:'",.<>?\/\\|`~]/.test(password);

    return {
      valid: hasMin8 && hasLower && hasUpper && hasNumber && hasSymbol,
      hasMin8,
      hasLower,
      hasUpper,
      hasNumber,
      hasSymbol,
    };
  };

  const signup = useCallback(
    async (email, password, confirmPassword) => {
      if (!userPool) {
        throw new Error("Cognito configuration missing");
      }

      if (!validateEmail(email)) {
        throw new Error("Invalid email format");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const validation = validatePassword(password);
      if (!validation.valid) {
        throw new Error(
          "Password must be 8+ characters with uppercase, lowercase, numbers, and symbols"
        );
      }

      return new Promise((resolve, reject) => {
        const attributeList = [new CognitoUserAttribute({ Name: "email", Value: email })];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
          if (err) {
            reject(new Error(err.message || "Signup failed"));
          } else {
            resolve({
              userSub: result.userSub,
              codeDeliveryDetails: result.codeDeliveryDetails,
            });
          }
        });
      });
    },
    []
  );

  const confirmEmail = useCallback(async (email, code) => {
    if (!userPool) {
      throw new Error("Cognito configuration missing");
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(new Error(err.message || "Email verification failed"));
        } else {
          resolve(result);
        }
      });
    });
  }, []);

  const login = useCallback(async (email, password) => {
    if (!userPool) {
      throw new Error("Cognito configuration missing");
    }

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken();
          sessionStorage.setItem("idToken", token);
          setIdToken(token);
          setEmail(email);
          setAuthFlow("login");
          resolve({ token, email });
        },
        onFailure: (err) => {
          reject(new Error(err.message || "Login failed"));
        },
        newPasswordRequired: () => {
          reject(new Error("Password reset required before first login"));
        },
        mfaRequired: (challengeName, challengeParameters) => {
          resolve({
            mfaRequired: true,
            challengeName,
            challengeParameters,
            cognitoUser,
          });
        },
      });
    });
  }, []);

  const respondToMfa = useCallback(async (cognitoUser, code, challengeName) => {
    return new Promise((resolve, reject) => {
      cognitoUser.sendMFACode(code, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken();
          sessionStorage.setItem("idToken", token);
          setIdToken(token);
          resolve({ token });
        },
        onFailure: (err) => {
          reject(new Error(err.message || "MFA verification failed"));
        },
      });
    });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    if (!userPool) {
      throw new Error("Cognito configuration missing");
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(new Error(err.message || "Password reset request failed"));
        },
      });
    });
  }, []);

  const confirmNewPassword = useCallback(async (email, code, newPassword) => {
    if (!userPool) {
      throw new Error("Cognito configuration missing");
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(
        "Password must be 8+ characters with uppercase, lowercase, numbers, and symbols"
      );
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          reject(new Error(err.message || "Password reset failed"));
        },
      });
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("idToken");
    setIdToken("");
    setEmail("");
    setAuthFlow("login");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        idToken,
        email,
        authFlow,
        setAuthFlow,
        setEmail,
        signup,
        confirmEmail,
        login,
        respondToMfa,
        forgotPassword,
        confirmNewPassword,
        logout,
        validateEmail,
        validatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
