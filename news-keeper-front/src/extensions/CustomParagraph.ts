import Paragraph from "@tiptap/extension-paragraph";

export type ParagraphVariant = "default" | "lead" | "callout";

export const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      variant: {
        default: "default",
        parseHTML: (element) =>
          (element.getAttribute("data-variant") as ParagraphVariant) ||
          "default",
        renderHTML: (attributes) => {
          return {
            "data-variant": attributes.variant,
            class: `news-p-${attributes.variant}`,
          };
        },
      },
    };
  },
});
