import React from "react";
import { type NewsDto } from "../../types/news";

interface NewsCardProps {
  news: NewsDto;
  isNewsmaker: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  news,
  isNewsmaker,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const formattedDate = new Date(news.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(news.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(news.id);
  };

  return (
    <article className="news-card" onClick={() => onSelect(news.id)}>
      <div className="news-card-cover">
        {news.coverUrl ? (
          <img src={news.coverUrl} alt={news.title} loading="lazy" />
        ) : (
          <div className="news-card-placeholder">Нет фото</div>
        )}
      </div>

      <div className="news-card-info">
        <h3 className="news-card-title">{news.title}</h3>
        <div className="news-card-footer">
          <time className="news-card-date">{formattedDate}</time>

          {isNewsmaker && (
            <div className="news-card-actions">
              <button
                type="button"
                className="btn-edit-sm"
                onClick={handleEditClick}
              >
                ✏️ Изменить
              </button>
              <button
                type="button"
                className="btn-delete-sm"
                onClick={handleDeleteClick}
              >
                🗑️ Удалить
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
