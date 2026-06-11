import type { MediaType } from "@/types/tmdb";

export interface OttProvider {
  id: number;
  name: string;
  color: string;
  textColor: string;
}

export const OTT_PROVIDERS: OttProvider[] = [
  { id: 8,   name: "Netflix",   color: "#E50914", textColor: "#fff" },
  { id: 337, name: "Disney+",   color: "#113CCF", textColor: "#fff" },
  { id: 350, name: "Apple TV+", color: "#000000", textColor: "#fff" },
  { id: 356, name: "Wavve",     color: "#0F4BBE", textColor: "#fff" },
  { id: 97,  name: "Watcha",    color: "#FF0558", textColor: "#fff" },
  { id: 210, name: "TVING",     color: "#FF153C", textColor: "#fff" },
];

export interface GenreOption {
  id: number;
  name: string;
}

// TMDB 장르 ID (movie 기준; tv도 대부분 공유)
export const GENRE_OPTIONS: Record<MediaType, GenreOption[]> = {
  movie: [
    { id: 0,     name: "전체" },
    { id: 28,    name: "액션" },
    { id: 12,    name: "어드벤처" },
    { id: 35,    name: "코미디" },
    { id: 18,    name: "드라마" },
    { id: 27,    name: "공포" },
    { id: 10749, name: "로맨스" },
    { id: 878,   name: "SF" },
    { id: 53,    name: "스릴러" },
    { id: 16,    name: "애니메이션" },
    { id: 99,    name: "다큐멘터리" },
  ],
  tv: [
    { id: 0,    name: "전체" },
    { id: 10759, name: "액션" },
    { id: 35,   name: "코미디" },
    { id: 18,   name: "드라마" },
    { id: 9648,  name: "미스터리" },
    { id: 10765, name: "SF/판타지" },
    { id: 10749, name: "로맨스" },
    { id: 16,   name: "애니메이션" },
    { id: 99,   name: "다큐멘터리" },
  ],
};

export const MEDIA_TYPE_TABS: { label: string; value: MediaType }[] = [
  { label: "영화", value: "movie" },
  { label: "드라마", value: "tv" },
];
