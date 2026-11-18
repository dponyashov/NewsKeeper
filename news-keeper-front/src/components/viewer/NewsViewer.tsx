import React, { useState } from "react";
import { NewsList } from "./NewsList";
import { NewsDetailView } from "./NewsDetailView";
import "./NewsViewer.css";
import "../editor/NewsEditor.css";

interface NewsViewerProps {
  isNewsmaker: boolean;
  onEditNews: (id: number) => void;
}

export const NewsViewer: React.FC<NewsViewerProps> = ({
  isNewsmaker,
  onEditNews,
}) => {
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);

  return (
    <section className="news-viewer-container">
      {selectedNewsId === null ? (
        <>
          <h2>Лента новостей</h2>
          <NewsList
            isNewsmaker={isNewsmaker}
            onSelectNews={(id) => setSelectedNewsId(id)}
            onEditNews={onEditNews}
          />
        </>
      ) : (
        <NewsDetailView
          newsId={selectedNewsId}
          isNewsmaker={isNewsmaker}
          onBack={() => setSelectedNewsId(null)}
          onEdit={onEditNews}
        />
      )}
    </section>
  );
};
