import React from "react";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { useCategoryRow } from "@/hooks/useTmdb";
import {
  CONTENT_CATEGORIES,
  HOME_CATEGORY_KEYS,
  type ContentCategory,
} from "@/constants/ottProviders";

function CategoryRow({ category }: { category: ContentCategory }) {
  const query = useCategoryRow(category);
  return (
    <ContentCarousel
      title={`${category.emoji} 인기 ${category.label}`}
      query={query}
      defaultMediaType={category.mediaType}
    />
  );
}

// 홈에 예능·애니·다큐·키즈 카테고리 행을 노출 (영화·드라마는 기존 섹션이 커버)
export function CategoryRows() {
  const categories = HOME_CATEGORY_KEYS.map((key) =>
    CONTENT_CATEGORIES.find((c) => c.key === key)
  ).filter((c): c is ContentCategory => Boolean(c));

  return (
    <>
      {categories.map((c) => (
        <CategoryRow key={c.key} category={c} />
      ))}
    </>
  );
}
