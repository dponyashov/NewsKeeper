import React from "react";

interface CoverUploaderProps {
  coverPreview: string | null;
  onSelectCover: (file: File) => void;
  onRemoveCover: () => void;
}

export const CoverUploader: React.FC<CoverUploaderProps> = ({
  coverPreview,
  onSelectCover,
  onRemoveCover,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      onSelectCover(file);
    }
    e.target.value = "";
  };

  return (
    <div className="form-group">
      <label>Обложка новости (превью)</label>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {coverPreview && (
        <div className="cover-preview">
          <img src={coverPreview} alt="Предпросмотр обложки" />
          <button type="button" onClick={onRemoveCover}>
            Удалить обложку
          </button>
        </div>
      )}
    </div>
  );
};
