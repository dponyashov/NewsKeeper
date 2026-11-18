import React, { useEffect, useMemo, useState } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { CustomParagraph } from "../../extensions/CustomParagraph";
import { type NewsDto } from "../../types/news";
import { authFetch } from "../../utils/api";
import { API_BASE_URL } from "../../config/apiConfig";

interface NewsDetailViewProps {
  newsId: number;
  isNewsmaker: boolean;
  onBack: () => void;
  onEdit: (id: number) => void;
}

export const NewsDetailView: React.FC<NewsDetailViewProps> = ({
  newsId,
  isNewsmaker,
  onBack,
  onEdit,
}) => {
  const [news, setNews] = useState<NewsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/news/${newsId}`)
      .then((res) => res.json())
      .then((data: NewsDto) => setNews(data))
      .catch((err) => console.error("Ошибка загрузки новости:", err))
      .finally(() => setLoading(false));
  }, [newsId]);

  const contentHtml = useMemo(() => {
    if (!news?.content) return "";
    return generateHTML(news.content, [
      StarterKit.configure({ paragraph: false }),
      CustomParagraph,
      Image.configure({
        HTMLAttributes: {
          class: "news-inline-image",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ]);
  }, [news]);

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить эту новость?")) return;

    try {
      await authFetch(`${API_BASE_URL}/news/${newsId}`, { method: "DELETE" });
      onBack();
    } catch (err) {
      alert("Ошибка при удалении новости");
      console.error(err);
    }
  };

  if (loading) return <div className="news-status">Загрузка статьи...</div>;
  if (!news) return <div className="news-status">Новость не найдена.</div>;

  const formattedDate = new Date(news.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="news-detail">
      <div className="news-detail-topbar">
        <button type="button" className="back-btn" onClick={onBack}>
          ← Назад к списку новостей
        </button>

        {isNewsmaker && (
          <div className="news-detail-actions">
            <button
              type="button"
              className="btn-edit-sm"
              onClick={() => onEdit(news.id)}
            >
              ✏️ Редактировать
            </button>
            <button
              type="button"
              className="btn-delete-sm"
              onClick={handleDelete}
            >
              🗑️ Удалить
            </button>
          </div>
        )}
      </div>

      <header className="news-detail-header">
        <time className="news-detail-date">{formattedDate}</time>
        <h1 className="news-detail-title">{news.title}</h1>
      </header>

      <div
        className="news-detail-body"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
};
