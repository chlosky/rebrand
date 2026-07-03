const SETUP_BOTTOM_SCENE_SRC = "/marketing/onboarding-bottom-scene.png?v=2";

type SetupBottomSceneOverlayProps = {
  className?: string;
};

export function SetupBottomSceneOverlay({ className }: SetupBottomSceneOverlayProps = {}) {
  return (
    <div className={["setup-bottom-scene-overlay", className].filter(Boolean).join(" ")} aria-hidden>
      <img src={SETUP_BOTTOM_SCENE_SRC} alt="" decoding="async" />
    </div>
  );
}
