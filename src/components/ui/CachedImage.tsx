import React from "react";
import { Image, type ImageProps, type ImageStyle } from "expo-image";
import { View, StyleSheet } from "react-native";

// TMDB 이미지 베이스 URL 상수
export const TMDB_IMAGE_BASE = {
  poster: "https://image.tmdb.org/t/p/w500",
  backdrop: "https://image.tmdb.org/t/p/w1280",
  thumb: "https://image.tmdb.org/t/p/w185",
  logo: "https://image.tmdb.org/t/p/w92",
} as const;

export type TmdbImageSize = keyof typeof TMDB_IMAGE_BASE;

// ─── 공통 캐시 정책 ───────────────────────────────────────────────────────────
// expo-image는 디스크 + 메모리 캐시를 모두 관리.
// "force-cache": 유효한 캐시가 있으면 네트워크 요청을 보내지 않음.
// blurhash placeholder로 로딩 중 빈 화면 깜빡임 방지.

const DEFAULT_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4"; // 중간 회색 계열

interface CachedImageProps extends Omit<ImageProps, "source"> {
  path: string | null | undefined;
  size?: TmdbImageSize;
  style?: ImageStyle;
  blurhash?: string;
  fallback?: React.ReactNode;
}

export function CachedImage({
  path,
  size = "poster",
  style,
  blurhash = DEFAULT_BLURHASH,
  fallback,
  ...rest
}: CachedImageProps) {
  if (!path) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={[styles.placeholder, style]} />
    );
  }

  const uri = `${TMDB_IMAGE_BASE[size]}${path}`;

  return (
    <Image
      source={{ uri }}
      style={style}
      placeholder={{ blurhash }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}   // FlatList 재활용 시 이전 이미지 잔상 방지
      {...rest}
    />
  );
}

// ─── 포스터 비율 고정 래퍼 ────────────────────────────────────────────────────

interface PosterImageProps {
  path: string | null | undefined;
  width: number;
  style?: ImageStyle;
}

export function PosterImage({ path, width, style }: PosterImageProps) {
  const height = Math.round(width * 1.5); // 포스터 2:3 비율

  return (
    <CachedImage
      path={path}
      size="poster"
      style={[{ width, height, borderRadius: 8 }, style]}
    />
  );
}

// ─── 백드롭(와이드) 이미지 래퍼 ──────────────────────────────────────────────

interface BackdropImageProps {
  path: string | null | undefined;
  height?: number;
  style?: ImageStyle;
}

export function BackdropImage({ path, height = 220, style }: BackdropImageProps) {
  return (
    <CachedImage
      path={path}
      size="backdrop"
      style={[{ width: "100%", height }, style]}
    />
  );
}

// ─── OTT 로고 이미지 ──────────────────────────────────────────────────────────

interface OttLogoProps {
  path: string | null | undefined;
  size?: number;
  style?: ImageStyle;
}

export function OttLogo({ path, size = 44, style }: OttLogoProps) {
  return (
    <CachedImage
      path={path}
      size="logo"
      style={[{ width: size, height: size, borderRadius: size / 8 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#1f2937",
  },
});
