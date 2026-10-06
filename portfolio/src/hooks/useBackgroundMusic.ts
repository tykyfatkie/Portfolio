import { useSyncExternalStore } from "react";
import { isPlaying, subscribeMusic, toggleMusic } from "../lib/music";

/** Trạng thái nhạc nền dùng chung: mọi component gọi hook này đều điều khiển cùng một bản nhạc. */
export function useBackgroundMusic() {
  const playing = useSyncExternalStore(subscribeMusic, isPlaying);
  return { playing, toggle: toggleMusic };
}
