import { useState, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { CustomParagraph } from "../extensions/CustomParagraph";
import { authFetch } from "../utils/api";
import { type NewsDto } from "../types/news";
import { API_BASE_URL } from "../config/apiConfig";

interface UseNewsEditorParams {
  editingNewsId: number | null;
  onSuccess?: () => void;
}

export const useNewsEditor = ({
  editingNewsId,
  onSuccess,
}: UseNewsEditorParams) => {
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await authFetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      body: formData,
    });

    const data: { url: string } = await response.json();
    return data.url;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ paragraph: false }),
      CustomParagraph,
      Image.configure({ HTMLAttributes: { class: "news-inline-image" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder:
          "Введите текст новости... Можно вставлять картинки и менять стили абзацев.",
      }),
    ],
    editorProps: {
      handleDrop(_view, event, _slice, moved) {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files.item(0);
          if (file && file.type.startsWith("image/")) {
            event.preventDefault();
            handleInlineImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                handleInlineImageUpload(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  const handleInlineImageUpload = async (file: File) => {
    if (!editor) return;
    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImageToServer(file);
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      alert("Не удалось загрузить картинку в текст");
      console.error(error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!editor) return;

    if (editingNewsId !== null) {
      setIsLoadingData(true);
      authFetch(`${API_BASE_URL}/news/${editingNewsId}`)
        .then((res) => res.json())
        .then((data: NewsDto) => {
          setTitle(data.title);
          setCoverPreview(data.coverUrl);
          setCoverFile(null);
          setRemoveCover(false);
          if (data.content) {
            editor.commands.setContent(data.content);
          }
        })
        .catch((err) => {
          console.error("Ошибка загрузки новости для редактирования:", err);
          alert("Не удалось загрузить новость");
        })
        .finally(() => setIsLoadingData(false));
    } else {
      setTitle("");
      setCoverPreview(null);
      setCoverFile(null);
      setRemoveCover(false);
      editor.commands.clearContent();
    }
  }, [editingNewsId, editor]);

  const handleSelectCover = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !title.trim()) {
      alert("Укажите заголовок новости");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      const newsPayload = {
        title: title.trim(),
        content: editor.getJSON(),
      };
      formData.append(
        "news",
        new Blob([JSON.stringify(newsPayload)], { type: "application/json" }),
      );

      if (coverFile) {
        formData.append("file", coverFile);
      }

      const isEdit = editingNewsId !== null;
      const url = isEdit
        ? `${API_BASE_URL}/news/${editingNewsId}?removeCover=${removeCover}`
        : `${API_BASE_URL}/news`;

      await authFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: formData,
      });

      alert(isEdit ? "Изменения сохранены!" : "Новость опубликована!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert("Произошла ошибка при сохранении новости");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    editor,
    title,
    setTitle,
    coverPreview,
    isLoadingData,
    isSubmitting,
    isUploadingImage,
    handleSelectCover,
    handleRemoveCover,
    handleInlineImageUpload,
    handleSubmit,
  };
};
