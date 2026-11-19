import { useEffect, useState } from "react";
import { NewsEditor } from "./components/editor/NewsEditor";
import { NewsViewer } from "./components/viewer/NewsViewer";
import { initAndGetToken, parseJwt } from "./utils/auth";
import "./App.css";

export function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isNewsmaker, setIsNewsmaker] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "viewer">("viewer");
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);

  useEffect(() => {
    const token = initAndGetToken();
    const payload = parseJwt(token);

    if (payload) {
      setIsAuthorized(true);
      const canEdit = payload.roles?.includes("ROLE_NEWSMAKER") ?? false;
      setIsNewsmaker(canEdit);
      // Всегда оставляем activeTab = 'viewer' при первоначальной загрузке
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const handleStartEdit = (id: number) => {
    setEditingNewsId(id);
    setActiveTab("editor");
  };

  const handleEditorFinish = () => {
    setEditingNewsId(null);
    setActiveTab("viewer");
  };

  if (!isAuthorized) {
    return (
      <div className="app-layout">
        <div className="auth-error-box">
          <h2>Доступ ограничен</h2>
          <p>
            Отсутствует или устарел токен авторизации. Перейдите из основного
            портала.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {isNewsmaker && (
        <nav className="app-nav">
          <button
            type="button"
            className={`app-nav-btn ${activeTab === "viewer" ? "active" : ""}`}
            onClick={() => {
              setEditingNewsId(null);
              setActiveTab("viewer");
            }}
          >
            📰 Лента новостей
          </button>
          <button
            type="button"
            className={`app-nav-btn ${activeTab === "editor" && editingNewsId === null ? "active" : ""}`}
            onClick={() => {
              setEditingNewsId(null);
              setActiveTab("editor");
            }}
          >
            ✍️ Создать новость
          </button>
        </nav>
      )}

      {isNewsmaker && activeTab === "editor" ? (
        <NewsEditor
          editingNewsId={editingNewsId}
          onSuccess={handleEditorFinish}
          onCancel={handleEditorFinish}
        />
      ) : (
        <NewsViewer isNewsmaker={isNewsmaker} onEditNews={handleStartEdit} />
      )}
    </div>
  );
}

export default App;
