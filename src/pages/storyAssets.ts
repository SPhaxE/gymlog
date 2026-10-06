/** 由 scripts/story_png.py 生成，勿手改：初见引导素材（public/story/<编号>.webp）的像素尺寸。M = 米洛（Milo）的 6 个姿势（同一比例），S = 场景层。 */
export const STORY_ASSETS = {"M1":{"w":471,"h":720},"M2":{"w":506,"h":639},"M3":{"w":467,"h":658},"M4":{"w":732,"h":672},"M5":{"w":659,"h":727},"M6":{"w":764,"h":566},"S1-far":{"w":2400,"h":793},"S1-mid":{"w":2400,"h":793},"S1-near":{"w":2400,"h":793},"S2":{"w":1200,"h":1174}} as const;
export type StoryAsset = keyof typeof STORY_ASSETS;
