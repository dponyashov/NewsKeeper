export interface JwtPayload {
  sub: string;
  roles?: string[];
  exp?: number;
}

const TOKEN_STORAGE_KEY = "news_keeper_token";

export const initAndGetToken = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");

  if (urlToken && urlToken.length > 10) {
    localStorage.setItem(TOKEN_STORAGE_KEY, urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    return urlToken;
  }

  // В режиме разработки приоритетно берем токен из .env.local, если он там указан
  const devToken = import.meta.env.VITE_DEV_JWT_TOKEN;
  if (import.meta.env.DEV && devToken && devToken.length > 10) {
    localStorage.setItem(TOKEN_STORAGE_KEY, devToken);
    return devToken;
  }

  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (storedToken && storedToken.length > 10) {
    return storedToken;
  }

  return null;
};

export const parseJwt = (token: string | null): JwtPayload | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    const base64Url = parts.at(1); // Вторая часть JWT (payload)

    if (!base64Url) {
      console.warn("Некорректный формат JWT токена");
      return null;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload: JwtPayload = JSON.parse(jsonPayload);

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn(
        "Срок действия JWT токена истек:",
        new Date(payload.exp * 1000).toLocaleString(),
      );
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    console.log("JWT успешно распознан:", payload);
    return payload;
  } catch (e) {
    console.error("Ошибка парсинга JWT:", e);
    return null;
  }
};

export const hasNewsmakerRole = (token: string | null): boolean => {
  const payload = parseJwt(token);
  return payload?.roles?.includes("ROLE_NEWSMAKER") ?? false;
};
