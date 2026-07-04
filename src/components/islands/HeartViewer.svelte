<script lang="ts">
  /**
   * HeartViewer — v2 STUB. Reserves the slot for an interactive 3D
   * heart/coronary model. Intentionally ships NO model and no
   * <model-viewer> runtime yet; it only renders a placeholder frame so
   * pages can lay out around it.
   *
   * TODO(v2): load the <model-viewer> web component (or Three.js) and an
   * open-source heart model, wire props (camera, highlighted segment).
   * See docs/roadmap.md Phase 4.
   */
  interface Props {
    src?: string; // future: URL of a .glb/.gltf model
    alt?: string;
    label?: string; // localized placeholder caption
  }

  let { src, alt = '', label = '3D viewer — coming in v2' }: Props = $props();
</script>

<div
  class="bg-base-200 border-base-300 rounded-box flex aspect-video items-center justify-center border border-dashed"
  data-model-src={src}
  aria-label={alt}
>
  <span class="text-base-content/40 text-sm">{label}</span>
</div>
